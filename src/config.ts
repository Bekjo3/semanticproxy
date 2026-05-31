import dotenv from 'dotenv';

dotenv.config();

/**
not done yet. Will update this later.
 */
interface IConfig {
  openaiApiKey: string;
  port: number;
  pineconeApiKey: string;
  pineconeHost: string;
  tokenWatermarkMax: number;
  targetPruneTokens: number;
  similarityThreshold: number;
}


function loadConfig(): IConfig {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const pineconeApiKey = process.env.PINECONE_API_KEY;
  const pineconeHost = process.env.PINECONE_HOST;
  const tokenWatermarkMax = process.env.TOKEN_WATERMARK_MAX
    ? parseInt(process.env.TOKEN_WATERMARK_MAX, 10)
    : 8000;
  const targetPruneTokens = process.env.TARGET_PRUNE_TOKENS
    ? parseInt(process.env.TARGET_PRUNE_TOKENS, 10)
    : 3000;
  const similarityThreshold = process.env.SIMILARITY_THRESHOLD
    ? parseFloat(process.env.SIMILARITY_THRESHOLD)
    : 0.95;

  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY is not set in environment variables');
  }

  if (!pineconeApiKey) {
    throw new Error('PINECONE_API_KEY is not set in environment variables');
  }

  if (!pineconeHost) {
    throw new Error('PINECONE_HOST is not set in environment variables');
  }

  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be a valid number between 1 and 65535');
  }

  return {
    openaiApiKey,
    port,
    pineconeApiKey,
    pineconeHost,
    tokenWatermarkMax,
    targetPruneTokens,
    similarityThreshold,
  };
}

export const config: IConfig = loadConfig();
