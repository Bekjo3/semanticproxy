import { config } from '../config';
// https://developers.openai.com/api/docs/guides/embeddings 

const OPENAI_EMBEDDINGS_URL = 'https://api.openai.com/v1/embeddings';
const EMBEDDING_MODEL = 'text-embedding-3-small';

const EMBEDDING_DIMENSIONS = 1536;

// prevents the proxy from hanging indefinitely if the upstream OpenAI network connection stalls
const EMBEDDING_REQUEST_TIMEOUT_MS = 30_000; 

interface IEmbeddingRequestBody {
  model: string;
  input: string;
  dimensions: number;
}

interface IEmbeddingDataItem {
  index: number;
  embedding: number[];
}

interface IEmbeddingApiResponse {
  object: string;
  data: IEmbeddingDataItem[];
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

function buildEmbeddingHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${config.openaiApiKey}`,
    'Content-Type': 'application/json',
  };
}


async function callEmbeddingsApi(body: IEmbeddingRequestBody): Promise<IEmbeddingApiResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), EMBEDDING_REQUEST_TIMEOUT_MS); 

  try {
    const response = await fetch(OPENAI_EMBEDDINGS_URL, {
      method: 'POST',
      headers: buildEmbeddingHeaders(),
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Embeddings API returned ${response.status}: ${errorBody}`);
    }

    const parsed: unknown = await response.json();
    return parsed as IEmbeddingApiResponse;
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        throw new Error(
          `Embeddings request timed out after ${EMBEDDING_REQUEST_TIMEOUT_MS}ms`
        );
      }
      throw err;
    }
    throw new Error('Embeddings request failed with an unknown error');
  } finally {
    clearTimeout(timeoutId);
  }
}

// turn user text into a dense vector for semantic cache / RAG storage.
export async function generateTextEmbedding(text: string): Promise<number[]> {
  const apiResponse = await callEmbeddingsApi({
    model: EMBEDDING_MODEL,
    input: text,
    dimensions: EMBEDDING_DIMENSIONS,
  });

  const firstResult = apiResponse.data[0];
  if (firstResult === undefined) {
    throw new Error('Embeddings API returned no vector data');
  }

  const embedding = firstResult.embedding;
  if (embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Expected ${EMBEDDING_DIMENSIONS} dimensions, received ${embedding.length}`
    );
  }

  return embedding;
}
