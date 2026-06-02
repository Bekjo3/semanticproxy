import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { IChatCompletionRequest, IChatCompletionResponse } from '../types/openai';
import { forwardToOpenAI } from '../services/upstream';
import { config } from '../config';

/*
 JSON Schema validator for incoming chat completion requests.
 */
const chatCompletionSchema = {
  type: 'object',
  required: ['messages', 'model'],
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
export async function registerChatRoute(server: FastifyInstance): Promise<void> {
    server.post<{ Body: IChatCompletionRequest }>(
    '/v1/chat/completions',
    {
      schema: {
        body: chatCompletionSchema,
      },
    },
    async (request: FastifyRequest<{ Body: IChatCompletionRequest }>, reply: FastifyReply) => {
      // If a request reaches here, it passed validation
      try {
        const response: IChatCompletionResponse = await forwardToOpenAI(
          request.body,
          config.openaiApiKey
        );

        await reply.send(response);
      } catch (err: unknown) {
        console.error('Route handler error:', err);
        throw err;
      }
    }
  );
}
