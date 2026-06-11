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
 
    keyGenerator: (request: FastifyRequest) => {
      const ip = request.ip;
      const body = request.body as IRateLimitRequest;
      const chatId = body.chat_id!;
      
      // combines IP and chat_id so users can't bypass by rotating IPs on the same chat, 
      // and multiple users on the same IP don't block each other.
      return `${ip}-${chatId}`;
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