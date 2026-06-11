import { FastifyRequest, FastifyReply } from 'fastify';
import { IChatCompletionRequest } from '../types/openai';
import { shouldCompress, executeCompressionPipeline } from '../services/compression';
import { countMessageTokens } from '../services/tokenizer';

export async function contextCompressorMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const body = request.body as IChatCompletionRequest;

  if (!body || !body.messages || body.messages.length === 0) {
    return;
  }

  const payloadTotalTokens = body.messages.reduce(
    (total, msg) => total + countMessageTokens(msg), 
    0
  );

  if (shouldCompress(payloadTotalTokens)) {
    const chatId = body.chat_id || 'anonymous';
    console.log(`[Compressor] Payload hit ${payloadTotalTokens} tokens. Compressing chat: ${chatId}...`);

    try {
      const compressedMessages = await executeCompressionPipeline(
        body.messages,
        payloadTotalTokens,
        chatId
      );

      // mutate the request body directly. 
      body.messages = compressedMessages;
      
      console.log(`[Compressor] Success. Payload mutated and ready for upstream`);
    } catch (error) {
      console.error('[Compressor] Pipeline failed, falling back to raw payload:', error);
    }
  }
}