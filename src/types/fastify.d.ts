import 'fastify';
import { IQueryResult } from './vector';

declare module 'fastify' {
  interface FastifyRequest {
    // tot estimated prompt tokens for the current chat completion body
    payloadTokenCount: number;
    // populated by semantic cache pre-handler for downstream hit/miss logic
    semanticCacheMatch?: IQueryResult | null;
    semanticCacheThreshold?: number;
  }
}
