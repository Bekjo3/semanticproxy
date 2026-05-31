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
