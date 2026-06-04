import { Index, Pinecone } from '@pinecone-database/pinecone';
import { config } from '../config';
import { IVectorMetadata } from '../types/vector';

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
