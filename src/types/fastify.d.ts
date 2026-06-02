import 'fastify';
f
declare module 'fastify' {
  interface FastifyRequest {
    // tot estimated prompt tokens for the current chat completion body
    payloadTokenCount: number;
  }
}
