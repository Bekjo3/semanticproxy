import { upsertVector, queryNearest } from '../src/services/vectorDb';


async function runVectorTest(): Promise<void> {
  const mockNamespace = 'integration_test';
  const mockId = 'mock_record';

  // fixed random seed-ish vector: same array for upsert and query proves retrieval path works
  const mockVector = Array.from({ length: 1536 }, (_, index) => (index % 17) / 17);

  console.log('upserting mock vector record...');
  await upsertVector({
    namespace: mockNamespace,
    records: [
      {
        id: mockId,
        values: mockVector,
        metadata: {
          chat_id: mockNamespace,
          user_prompt: 'What is a semantic proxy?',
          response: 'A network layer that caches LLM responses by meaning, not exact bytes.',
        },
      },
    ],
  });

  // serverless indexes are eventually consistent; brief pause avoids flaky "no match" on first query
  console.log('Waiting 2s for index propagation...');
  await new Promise((resolve) => setTimeout(resolve, 2000));

  console.log('querying with the same vector...');
  const result = await queryNearest({
    namespace: mockNamespace,
    vector: mockVector,
  });

  if (!result) {
    console.error('TEST FAILED: queryNearest returned null');
    process.exitCode = 1;
    return;
  }

  console.log(`Matched id: ${result.record.id}`);
  console.log(`Score: ${result.score}`);
  console.log(`Cached response: ${result.record.metadata.response}`);

  const passed =
    result.record.id === mockId &&
    result.score > 0.99 &&
    result.record.metadata.user_prompt.includes('semantic proxy');

  if (passed) {
    console.log('\nTEST PASSED: upsert + immediate nearest-neighbor retrieval succeeded.');
  } else {
    console.error('\nTEST FAILED: unexpected match payload or score.');
    process.exitCode = 1;
  }
}

runVectorTest().catch((error: unknown) => {
  console.error('Vector integration test error:', error);
  process.exitCode = 1;
});
