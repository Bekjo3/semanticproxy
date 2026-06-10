import { IChatCompletionMessage } from '../types/openai';
import { countMessageTokens } from './tokenizer';
import { config } from '../config';

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