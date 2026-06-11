import { IChatCompletionMessage } from '../types/openai';
import { countMessageTokens } from './tokenizer';
import { config } from '../config';
import { summarizeConversation } from './summarizer';
import { generateTextEmbedding } from './embeddings';
import { upsertVector } from './vectorDb';
import { IVectorRecord } from '../types/vector';

export interface ICompressionResult {
    activeMessages: IChatCompletionMessage[];
    prunedMessages: IChatCompletionMessage[];
    summaryText: string | null;
}

export function shouldCompress(totalTokens: number): boolean {
  return totalTokens > config.tokenWatermarkMax;
}

export interface ISlicedMessages {
  activeMessages: IChatCompletionMessage[];
  prunedMessages: IChatCompletionMessage[];
}

/*
 * slices the incoming payload into retained (active) and discarded (pruned) messages.
 */
export function sliceOldMessages(
  messages: IChatCompletionMessage[],
  payloadTotalTokens: number
): ISlicedMessages {
  const activeMessages: IChatCompletionMessage[] = [];
  const prunedMessages: IChatCompletionMessage[] = [];

  const maxRetainedTokens = payloadTotalTokens - config.targetPruneTokens;
  let activeTokens = 0;

  // backwards because it must prioritize keeping the absolute newest conversational context perfectly intact.
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];

    // won't prune the root system prompt.
    // this protects the user's core agent instructions from being compressed.
    if (i === 0 && msg.role === 'system') {
      activeMessages.unshift(msg);
      continue;
    }

    const tokens = countMessageTokens(msg);

    // will adding this message push us over our retention limit?
    if (activeTokens + tokens <= maxRetainedTokens) {
        activeMessages.unshift(msg); 
        activeTokens += tokens;
      } else {
        prunedMessages.unshift(msg);
    }
  }

  return {
    activeMessages,
    prunedMessages
  };
}

/*
 transforms structured message arrays into a single flat text block for summarization.
*/
export function formatForSummarization(prunedMessages: IChatCompletionMessage[]): string {
    return prunedMessages
      .map((msg) => {
        // capitalize the role (like, USER, ASSISTANT) to create clear boundaries
        const roleHeader = `[${msg.role.toUpperCase()}]`;
        return `${roleHeader}:\n${msg.content}`;
      })
      .join('\n\n---\n\n');
  }

export function rebuildContext(
  activeMessages: IChatCompletionMessage[],
  summaryText: string
): IChatCompletionMessage[] {
  const summaryMessage: IChatCompletionMessage = {
    role: 'system',
    content: `[SYSTEM MEMORY ARCHIVE - PAST CONTEXT]:\n${summaryText}`
  };

  if (activeMessages.length > 0 && activeMessages[0].role === 'system') {
    activeMessages.splice(1, 0, summaryMessage);
  } else {
    activeMessages.unshift(summaryMessage);
  }

  return activeMessages;
}

/*
  executes the full sequence of slicing, formatting, and summarizing.
*/
export async function executeCompressionPipeline(
    messages: IChatCompletionMessage[],
    payloadTotalTokens: number,
    chatId: string
  ): Promise<ICompressionResult> {
    
    // slice the array into keep vs. discard (Stage 66)
    const { activeMessages, prunedMessages } = sliceOldMessages(messages, payloadTotalTokens);
  
    // exit early if there was nothing to prune (e.g., a massive single message)
    if (prunedMessages.length === 0) {
      return {
        activeMessages,
        prunedMessages,
        summaryText: null
      };
    }
  
    // format the discarded messages into a flat string
    const textBlock = formatForSummarization(prunedMessages);
  
    // send the flat string to gpt-4o-mini for compression
    const summaryText = await summarizeConversation(textBlock);

  // archive logs to Vector DB
  try {
    const embeddingVector = await generateTextEmbedding(textBlock);
  
    const vectorRecord: IVectorRecord = {
      id: `prune_${Date.now()}`,
      values: embeddingVector, 
      metadata: {
        chat_id: chatId,
        user_prompt: '[SYSTEM_CONTEXT_ARCHIVE]',
        response: textBlock,
        timestamp: Date.now(),
        type: 'archived_context'
      }
    };

    await upsertVector({
      namespace: chatId,
      records: [vectorRecord]
    });

    console.log(`[Compression] Successfully archived context to Pinecone namespace: ${chatId}`);
  } catch (error) {
    console.error('[Compression] Vector DB archiving failed:', error);
  }
  
    // we return all three pieces because we need the prunedMessages for vector storage
    // and the summaryText to inject back into the active payload
    return {
      activeMessages,
      prunedMessages,
      summaryText
    };
  }