// Key: chat_id. Value: Array of vector record IDs from previous turns.
const sessionMap = new Map<string, string[]>();

export function recordTurnTimestamp(chatId: string, recordId: string): void {
  if (!sessionMap.has(chatId)) {
    sessionMap.set(chatId, []);
  }

  sessionMap.get(chatId)!.push(recordId);
}

// Evaluates if the matched record was used in the last 1 or 2 turns.
export function isWithinTemporalOverrideWindow(chatId: string, matchedRecordId: string): boolean {
  const history = sessionMap.get(chatId);
  if (!history || history.length === 0) {
    return false;
  }

  const lastIndex = history.length - 1;
  
  // turn Gap == 1 (The immediately preceding turn)
  if (history[lastIndex] === matchedRecordId) {
    return true;
  }
  
  // turn Gap == 2 (The turn right before the last one)
  if (lastIndex >= 1 && history[lastIndex - 1] === matchedRecordId) {
    return true;
  }

  return false;
}