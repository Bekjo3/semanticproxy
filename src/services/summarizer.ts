import { config } from '../config';
import { IChatCompletionResponse } from '../types/openai';

/*
  targets gpt-4o-mini for fast, cheap, high-density summarization.
 */
export async function summarizeConversation(textBlock: string): Promise<string> {
  const targetUrl = 'https://api.openai.com/v1/chat/completions';

  const response = await fetch(targetUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.openaiApiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a highly efficient text summarizer.'  // need to get a good prompt
        },
        {
          role: 'user',
          content: `Please summarize the following conversation history:\n\n${textBlock}`
        }
      ],
      // keeping variance low so the output is strictly factual
      temperature: 0.3, 
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Summarizer API failed with status ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as IChatCompletionResponse;
  
  return data.choices[0].message.content;
}