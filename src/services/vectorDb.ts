import { Index, Pinecone } from '@pinecone-database/pinecone';
import { config } from '../config';
import { IVectorMetadata, IVectorRecord, IQueryVectorParams, IQueryResult } from '../types/vector';

// typed contract for writing vectors — namespace maps to chat_id for isolation.
export interface IUpsertVectorParams {
  records: IVectorRecord[];
  namespace?: string;
}


let vectorDbClient: Pinecone | null = null;

export function initVectorDbClient(): Pinecone {
  if (vectorDbClient === null) {
    vectorDbClient = new Pinecone({
      apiKey: config.pineconeApiKey,
    });
  }
  return vectorDbClient;
}

// console often copies a full URL; the SDK expects a bare hostname only.
function normalizePineconeHost(hostUrl: string): string {
  const trimmed = hostUrl.trim();
  if (trimmed.startsWith('https://')) {
    return trimmed.slice('https://'.length);
  }
  return trimmed;
}

/*
  initializes the Pinecone Index client for database operations.
  - Optimization 1 (Host): we explicitly pass the sanitized { host } URL to bypass 
    the Pinecone SDK's default `describeIndex` network round-trip. this saves ~150ms of latency.
  - Optimization 2 (Namespace): if a chat_id/namespace is provided, we partition the query 
    to prevent Cross-Tenant Data Leakage. if omitted, it targets the global default namespace.
 */
export function getDbIndex(namespace?: string): Index<IVectorMetadata> {
  const client = initVectorDbClient();
  const host = normalizePineconeHost(config.pineconeHost);
  const index = client.index<IVectorMetadata>({ host });

  if (namespace !== undefined && namespace.length > 0) {
    return index.namespace(namespace);
  }

  return index;
}

// batch-commit vectors to Pinecone (overwrites same id if re-upserted).
export async function upsertVector(params: IUpsertVectorParams): Promise<void> {
  const index = getDbIndex(params.namespace);
  await index.upsert({ records: params.records });
}


export async function queryNearest(params: IQueryVectorParams): Promise<IQueryResult | null> {
  const index = getDbIndex(params.namespace);

  const queryResponse = await index.query({
    vector: params.vector,
    topK: 1, // just grabbing only the single closest match
    includeValues: false, // Save bandwidth
    includeMetadata: true, 
  });

  const match = queryResponse.matches[0];

  if (!match || match.score === undefined) {
    return null;
  }
 
  return {
    score: match.score,
    record: {
      id: match.id,
      values: [],
      metadata: match.metadata as IVectorMetadata,
    },
  };
}