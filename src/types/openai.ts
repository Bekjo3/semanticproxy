// checkout: https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/retrieve
export interface IChatCompletionMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}


export interface IChatCompletionRequest {
  messages: IChatCompletionMessage[];
  model: string;
  max_tokens?: number;
  temperature?: number;
  /**
   * nucleus sampling parameter. the model considers tokens with top_p probability mass.
   */
  top_p?: number;  // 0.1: only the top 10% most likely tokens are considered, and 1.0: all tokens are considered.
  frequency_penalty?: number; // discourage/encourage model based of frequency of tokens in the text so far.
  presence_penalty?: number;
  chat_id?: string;
}

/**
 * Represents a single choice/completion returned by the chat completion endpoint.
 * Each request may generate multiple choices based on the `n` parameter.
 */
export interface IChatCompletionChoice {
  index: number;
  message: IChatCompletionMessage;
  finish_reason: 'stop' | 'length' | 'content_filter' | null;
}

export interface ITokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface IChatCompletionResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: IChatCompletionChoice[];
  usage: ITokenUsage;
}
