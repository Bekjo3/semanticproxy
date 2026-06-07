import { generateTextEmbedding } from '../services/embeddings';
import { upsertVector } from '../services/vectorDb';
import { recordTurnTimestamp } from '../services/sessionStore';
import { IChatCompletionResponse } from '../types/openai';

/*
  - It is invoked after the route sends the response to the client.
  - It runs asynchronously so the user doesn't have to wait for the database upload.
*/
export async function processPostResponseCache(
  chatId: string, 
  userPrompt: string, 
  openAiResponse: IChatCompletionResponse
): Promise<void> {
  try {
    const responseText = openAiResponse.choices[0]?.message?.content;
    if (!responseText) return;

    //create a unique ID based on the timestamp
    const newRecordId = `msg_${Date.now()}`;

    // embedding for the new prompt
    const embeddedVector = await generateTextEmbedding(userPrompt);

    // archive the Prompt + Response into Pinecone
    await upsertVector({
      namespace: chatId,
      records: [{
        id: newRecordId,
        values: embeddedVector,
        metadata: {
          chat_id: chatId,
          user_prompt: userPrompt,
          response: responseText
        }
      }]
    });

    // log this new turn in the session store
    recordTurnTimestamp(chatId, newRecordId);

    console.log(`[BACKGROUND WORKER] Successfully cached new interaction: ${newRecordId}`);
  } catch (error) {
    console.error('[BACKGROUND WORKER] Failed to cache response:', error);
  }
}