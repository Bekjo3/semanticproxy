import { config } from '../config';
import { FastifyRequest, FastifyReply } from 'fastify';
import { generateTextEmbedding } from '../services/embeddings';
import { IChatCompletionMessage, IChatCompletionRequest } from '../types/openai';
import { isWithinTemporalOverrideWindow, recordTurnTimestamp } from '../services/sessionStore';
import { queryNearest } from '../services/vectorDb';

//extract the latest user question from the chat history array.
function extractLatestUserMessage(messages: IChatCompletionMessage[] | undefined): string | null {
  if (!messages || messages.length === 0) {
    return null;
  }

  const lastMessage = messages[messages.length - 1];

  // verify it's actually a user prompt
  if (lastMessage && lastMessage.role === 'user') {
    return lastMessage.content;
  }

  return null;
}

// core semantic sache middleware interceptor
export async function semanticCacheMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const body = request.body as IChatCompletionRequest;

    // provide a strict fallback string if the client omits the chat_id
    const chatId = body.chat_id || 'global_default';
    
    const userPrompt = extractLatestUserMessage(body.messages);
    if (!userPrompt) {
      return; // no user message to cache match against, pass through to route handler
    }

    const embeddedQuery = await generateTextEmbedding(userPrompt);

    const matchResult = await queryNearest({
      vector: embeddedQuery,
      namespace: chatId
    });

    const isHighConfidence = matchResult && matchResult.score >= config.similarityThreshold;

    // Evaluate the cache hit (similarityThreshold is 0.95 by default w/c means the questions must be semantically almost identical to trigger a cache hit.)
    if (isHighConfidence) { 
      const isStalled = isWithinTemporalOverrideWindow(chatId, matchResult.record.id);

      if (isStalled) {
         console.log(`[CACHE OVERRIDE] Match found, but user is looping. Forcing fresh OpenAI call.`);
         return; // pass through to route handler
      }
        
      console.log(`[CACHE HIT] Score: ${matchResult.score}. Short-circuiting upstream network.`);
      
      // mocking an OpenAI style response payload format because the cached reponse is only a string
      const mockOpenAiResponse = {
        id: `chatcmpl-cached-${matchResult.record.id}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000), // ms to sec
        model: 'gpt-4o-mini',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: matchResult.record.metadata.response
            },
            finish_reason: 'stop'
          }
        ],
        usage: {
          prompt_tokens: 0, // 0 tokens used because we bypassed OpenAI completely
          completion_tokens: 0,
          total_tokens: 0
        }
      };

      return reply.status(200).send(mockOpenAiResponse);
    }

    console.log(`[CACHE MISS] Best match score was ${matchResult?.score ?? 0}. Forwarding to OpenAI.`);
    
  } catch (error) {
    console.error('Cache middleware error (Failing Open):', error);
  }
}