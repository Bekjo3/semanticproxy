import fp from 'fastify-plugin';
import fastifyRateLimit from '@fastify/rate-limit';
import { FastifyInstance, FastifyRequest } from 'fastify';

interface IRateLimitRequest {
  chat_id?: string;
}

export const rateLimiterPlugin = fp(async (server: FastifyInstance) => {
  await server.register(fastifyRateLimit, {
    max: 5, // 5 requests maximum
    timeWindow: '1 minute', // per rolling minute
    hook: 'preHandler', // tells the rate limiter to wait until Step 3 to run, so the JSON body actually exists before we look for the chat ID.
    // the steps are onRequest, preParsing, preHandler, then the route handler
 
    keyGenerator: (request: FastifyRequest) => {
      const ip = request.ip;
      
      const body = request.body as IRateLimitRequest | undefined;
      const chatId = typeof body?.chat_id === 'string' && body.chat_id.length > 0 ? body.chat_id : null;
      return chatId ? `${ip}-${chatId}` : ip;
    },

    errorResponseBuilder: (_requestContext, context) => {
      return {
        statusCode: 429,
        error: 'Too Many Requests',
        message: `Rate limit exceeded. You are limited to ${context.max} requests per ${context.after}.`,
      };
    }
  });
});