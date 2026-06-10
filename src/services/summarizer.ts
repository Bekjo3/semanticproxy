import { config } from '../config';
import { IChatCompletionResponse } from '../types/openai';

const COMPRESSOR_SYSTEM_PROMPT = `You are an expert technical archivist. Your directive is to compress developer conversation logs into a highly dense, factual, and itemized structural digest.

CRITICAL RULES:
1. Preserve all specific technical constraints, architectural decisions, and facts.
2. Retain critical code snippets, file paths, and exact variable names if they represent core logic.
3. Completely eliminate conversational filler, greetings, pleasantries, and redundant explanations.
4. Format the output as a concise, structured bulleted list.
5. Do NOT invent, infer, or assume details. If it is not explicitly stated in the log, exclude it completely.`;

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
          content: COMPRESSOR_SYSTEM_PROMPT
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