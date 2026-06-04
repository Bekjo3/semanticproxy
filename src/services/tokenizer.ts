import { Tiktoken } from 'js-tiktoken/lite';
import type { TiktokenBPE } from 'js-tiktoken';
import o200kBaseRanks from 'js-tiktoken/ranks/o200k_base';
import type { IChatCompletionMessage } from '../types/openai.js';

//https://github.com/openai/tiktoken 

export type TokenizerEncodingName = 'o200k_base'; // o200k_base is the default encoding for GPT-4o and GPT-4o-mini

// serialized rank table shape shipped with js-tiktoken for o200k_base
export type IO200kBaseRankTable = TiktokenBPE;

// Module level lazy tokenizer state (instance is null until first init)
export interface ITokenizerModuleState {
  encodingName: TokenizerEncodingName;
  instance: Tiktoken | null;
}

const tokenizerState: ITokenizerModuleState = {
  encodingName: 'o200k_base',
  instance: null,
};

// constructs and caches the o200k_base Tiktoken encoder
export function initTokenizer(): Tiktoken {
  if (tokenizerState.instance === null) {
    const ranks: IO200kBaseRankTable = o200kBaseRanks;
    tokenizerState.instance = new Tiktoken(ranks);
  }

  return tokenizerState.instance;
}

// encodes a raw string and returns its token count.
export function countStringTokens(text: string): number {
  const tokenizer = initTokenizer();
  return tokenizer.encode(text).length;
}

// fixed per-message framing overhead; system messages use +4, others +3.
// TODO: this is just for now. will have to do more research on it.
function messageStructuralOverhead(role: IChatCompletionMessage['role']): number {
  return role === 'system' ? 4 : 3;
}

// token weight for one chat message: framing overhead plus encoded role and content.
export function countMessageTokens(message: IChatCompletionMessage): number {
  return (
    messageStructuralOverhead(message.role) +
    countStringTokens(message.role) +
    countStringTokens(message.content)
  );
}

// sum of all message tokens plus +3 assistant reply priming 
// not sure abotu this one either. the +3 is just from the example will look into it more later
export function calculatePayloadTokens(messages: IChatCompletionMessage[]): number {
  let total = 0;
  for (const message of messages) {
    total += countMessageTokens(message);
  }
  total += 3;
  return total;
}
