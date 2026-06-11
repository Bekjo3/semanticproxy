import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { IChatCompletionRequest, IChatCompletionResponse } from '../types/openai';
import { forwardToOpenAI } from '../services/upstream';
import { config } from '../config';
import { tokenTrackerPreHandler } from '../middleware/tokenTracker';
import { semanticCacheMiddleware } from '../middleware/semanticCache';
import { processPostResponseCache } from '../middleware/postResponse';
import { contextCompressorMiddleware } from '../middleware/compressor';

/*
 JSON Schema validator for incoming chat completion requests.
 */
const chatCompletionSchema = {
  type: 'object',
  required: ['messages', 'model', 'chat_id'],
  properties: {
    messages: {
      type: 'array',
      items: {
        type: 'object',
        required: ['role', 'content'],
        properties: {
          role: {
            type: 'string',
            enum: ['system', 'user', 'assistant'],
          },
          content: {
            type: 'string',
          },
        },
      },
      minItems: 1,
    },
    model: {
      type: 'string',
    },
    max_tokens: {
      type: 'integer',
      minimum: 1,
    },
    temperature: {
      type: 'number',
      minimum: 0,
      maximum: 2,
    },
    top_p: {
      type: 'number',
      minimum: 0,
      maximum: 1,
    },
    frequency_penalty: {
      type: 'number',
      minimum: -2,
      maximum: 2,
    },
    presence_penalty: {
      type: 'number',
      minimum: -2,
      maximum: 2,
    },
    chat_id: {
      type: 'string',
    },
  },
};

//Registers the POST /v1/chat/completions route handler
// this outer fun runs only once when the server boots up and lets fastify map the URL '/v1/chat/completions' to the logic
export async function registerChatRoute(server: FastifyInstance): Promise<void> {
    server.post<{ Body: IChatCompletionRequest }>(
    '/v1/chat/completions',
    {
      schema: {
        body: chatCompletionSchema,
      },
      preHandler: [tokenTrackerPreHandler, semanticCacheMiddleware, contextCompressorMiddleware], // also runs on every single request
    },
    // this func runs everytime a user makes a request.
    async (request: FastifyRequest<{ Body: IChatCompletionRequest }>, reply: FastifyReply) => {
      // If a request reaches here, it passed validation
      try {
        console.log(`Payload token count: ${request.payloadTokenCount}`);

        // only executes if the Cache Interceptor missed
        const response: IChatCompletionResponse = await forwardToOpenAI(
          request.body,
          config.openaiApiKey
        );

        // extract data for the background worker
        const messages = request.body.messages;
        const lastUserPrompt = messages?.[messages.length - 1]?.content;
        const chatId = request.body.chat_id || 'global_default';

        await reply.send(response);

        // new entry for our vector DB
        if (lastUserPrompt) {
          processPostResponseCache(chatId, lastUserPrompt, response).catch(console.error);
        }
      } catch (err: unknown) {
        console.error('Route handler error:', err);
        throw err;
      }
    }
  );
}
