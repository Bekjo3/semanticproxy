import { upsertVector, queryNearest } from '../src/services/vectorDb';

async function runVectorTest() {
  console.log('Starting the test...');

  const mockNamespace = 'test_chat_multi_001';
  
  const vectorFootball = Array.from({ length: 1536 }, () => Math.random());
  const vectorWorldCup = Array.from({ length: 1536 }, () => Math.random());
  const vectorCoding = Array.from({ length: 1536 }, () => Math.random());
  const vectorWeather = Array.from({ length: 1536 }, () => Math.random());

  console.log('1. Batch-upserting the 4 records...');
  await upsertVector({
    namespace: mockNamespace,
    records: [
      {
        id: 'msg_football_01',
        values: vectorFootball,
        metadata: {
          chat_id: mockNamespace,
          user_prompt: 'Who is the football greatest player of all time?',
          response: 'Lionel Messi and it\'s not even close!'
        }
      },
      {
        id: 'msg_worldcup_02',
        values: vectorWorldCup,
        metadata: {
          chat_id: mockNamespace,
          user_prompt: 'Where is the 2026 world cup going to be played?',
          response: 'It is going to be played in USA, Canada and Mexico.'
        }
      },
      {
        id: 'msg_coding_03',
        values: vectorCoding,
        metadata: {
          chat_id: mockNamespace,
          user_prompt: 'What is TypeScript?',
          response: 'A strongly typed superset of JavaScript.'
        }
      },
      {
        id: 'msg_weather_04',
        values: vectorWeather,
        metadata: {
          chat_id: mockNamespace,
          user_prompt: 'What is the weather like?',
          response: 'Sunny with no chance of rain.'
        }
      }
    ]
  });
  console.log('Batch upsert was successful.');

  console.log('Waiting 2 seconds for Pinecone to index...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // query specifically using the World Cup vector!
  console.log('2. Querying database using the World Cup vector...');
  const result = await queryNearest({
    namespace: mockNamespace,
    vector: vectorWorldCup // should strictly target the World Cup record
  });

  if (result) {
    console.log(`\n Match Result`);
    console.log(`Matched ID: ${result.record.id}`);
    console.log(`Confidence Score: ${result.score}`);
    console.log(`Cached Response: ${result.record.metadata.response}`);
    
    if (result.record.id === 'msg_worldcup_02' && result.score > 0.99) {
      console.log('\n TEST PASSED: topK:1 successfully isolated the match out of 4 inputs!');
    } else {
      console.log('\n TEST FAILED: wrong record.');
    }
  } else {
    console.log('\n TEST FAILED: No matches returned.');
  }
}

runVectorTest().catch(console.error);