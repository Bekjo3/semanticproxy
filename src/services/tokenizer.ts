import { Tiktoken } from 'js-tiktoken/lite';
import type { TiktokenBPE } from 'js-tiktoken';
import o200kBaseRanks from 'js-tiktoken/ranks/o200k_base';

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
