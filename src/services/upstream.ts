import { IChatCompletionRequest, IChatCompletionResponse } from '../types/openai';

/*
 removes the incoming request header's fields specific to our proxy (Host: localhost:3000, ...)
 */
function buildUpstreamHeaders(authToken: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json',
    'User-Agent': 'semanticproxy/1.0',
  };

  return headers;
}

/*
 forwards an incoming chat completion request to OpenAI's upstream API endpoint.
 */
export async function forwardToOpenAI(
  request: IChatCompletionRequest,
  authToken: string
): Promise<IChatCompletionResponse> {
  const headers = buildUpstreamHeaders(authToken);
  const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

  try {
    const response: Response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`OpenAI API error (${response.status}):`, errorBody);
      throw new Error(`OpenAI API returned ${response.status}: ${errorBody}`);
    }

    const parsedResponse: unknown = await response.json();

    // TODO: for now, i will just trust the structure of openai's response and cast it
    const chatCompletionResponse = parsedResponse as IChatCompletionResponse;

    return chatCompletionResponse;
  } catch (err: unknown) {
    console.error('Upstream fetch failed:', err);
    throw err;
  }
}
