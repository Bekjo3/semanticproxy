import type { FastifyReply, FastifyRequest } from 'fastify';
import { calculatePayloadTokens } from '../services/tokenizer';
import type { IChatCompletionRequest } from '../types/openai';

export async function tokenTrackerPreHandler(
  request: FastifyRequest<{ Body: IChatCompletionRequest }>,
  _reply: FastifyReply
): Promise<void> {
  const messages = request.body.messages;
  const tokenCount = calculatePayloadTokens(messages);
  request.payloadTokenCount = tokenCount;
}
