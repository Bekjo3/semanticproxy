import { FastifyRequest, FastifyReply } from 'fastify';
import { SIMILARITY_THRESHOLD } from '../config';
import { generateTextEmbedding } from '../services/embeddings';
import { queryNearest } from '../services/vectorDb';
import { IChatCompletionMessage, IChatCompletionRequest } from '../types/openai';
import { IQueryResult } from '../types/vector';

// last array slot is usually the active user turn in chat completions.
function extractLatestUserMessage(
  messages: IChatCompletionMessage[] | undefined
): IChatCompletionMessage | null {
  if (!messages || messages.length === 0) {
    return null;
  }

  const lastMessage = messages[messages.length - 1];
  if (lastMessage?.role === 'user') {
    return lastMessage;
  }

  return null;
}

// header wins so clients can keep an OpenAI-shaped body while still scoping cache by session.
function extractChatId(request: FastifyRequest, body: IChatCompletionRequest): string {
  const headerValue = request.headers['x-chat-id'];
  if (typeof headerValue === 'string' && headerValue.trim().length > 0) {
    return headerValue.trim();
  }

  if (body.chat_id.trim().length > 0) {
    return body.chat_id.trim();
  }

  return 'global_default';
}

// pre-handler hook — embed prompt and ANN lookup.
export async function semanticCacheMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  void reply;

  try {
    const body = request.body as IChatCompletionRequest;
    const chatId = extractChatId(request, body);

    const latestUserMessage = extractLatestUserMessage(body.messages);
    if (!latestUserMessage) {
      return;
    }

    const queryVector = await generateTextEmbedding(latestUserMessage.content);

    const nearestMatch: IQueryResult | null = await queryNearest({
      vector: queryVector,
      namespace: chatId,
    });

    request.semanticCacheMatch = nearestMatch;
    request.semanticCacheThreshold = SIMILARITY_THRESHOLD;

    if (nearestMatch) {
      console.log(
        `[semantic-cache] chat=${chatId} score=${nearestMatch.score.toFixed(4)} threshold=${SIMILARITY_THRESHOLD}`
      );
    } else {
      console.log(`[semantic-cache] chat=${chatId} no vector match in index`);
    }
  } catch (error) {
    console.error('[semantic-cache] lookup failed (fail-open to upstream):', error);
  }
}
