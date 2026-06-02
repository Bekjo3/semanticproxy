// Offline tokenizer unit checks (o200k_base via js-tiktoken).
// String-level counts align with OpenAI's tiktoken for gpt-4o / gpt-4o-mini.
// Run: npm run test:tokenizer
// check here for manual tests: https://platform.openai.com/tokenizer

import assert from 'node:assert/strict';
import {
  countStringTokens,
  countMessageTokens,
  calculatePayloadTokens,
} from '../src/services/tokenizer';
import type { IChatCompletionMessage } from '../src/types/openai';

function runTokenizerTests(): void {
  assert.equal(countStringTokens(''), 0, 'empty string');
  assert.equal(countStringTokens('hello'), 1, '"hello"');
  assert.equal(countStringTokens('tiktoken is great!'), 6, '"tiktoken is great!"');
  assert.equal(
    countStringTokens('The quick brown fox jumps over the lazy dog'),
    9,
    'pangram'
  );

  const userHello: IChatCompletionMessage = { role: 'user', content: 'Hello' };
  assert.equal(countMessageTokens(userHello), 5, 'user message "Hello"');

  const systemPrompt: IChatCompletionMessage = {
    role: 'system',
    content: 'You are a helpful assistant.',
  };
  assert.equal(
    countMessageTokens(systemPrompt),
    11,
    'system message with +4 framing overhead'
  );

  const conversation: IChatCompletionMessage[] = [
    { role: 'user', content: 'Hello' },
    { role: 'assistant', content: 'Hi there!' },
  ];
  assert.equal(calculatePayloadTokens(conversation), 15, 'two-turn payload + reply priming');

  console.log('All tokenizer tests passed.');
}

runTokenizerTests();
