async function fireRateLimitTest() {
    console.log('Starting Rate Limit Burst Test...');
    const targetUrl = 'http://localhost:3000/v1/chat/completions';
    
    // create an array of 10 identical, simultaneous requests
    const requests = Array.from({ length: 10 }).map((_, index) => {
      return fetch(targetUrl, {  // no await for the burst
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          chat_id: 'test_burst_001',
          messages: [{ role: 'user', content: `Test message ${index}` }]
        }),
      }).then(async (response) => {
        const status = response.status;
        const raw = await response.text();

        let data: any;
        try {
          data = JSON.parse(raw);
        } catch {
          // if it's not JSON (like an HTML error page), just save the raw text
          data = raw;
        }

        return { index, status, data };
      });
    });
  
    const results = await Promise.all(requests);
  
    let successCount = 0;
    let blockedCount = 0;
  
    results.forEach(res => {
      if (res.status === 200) {
        successCount++;
        console.log(`[Request ${res.index}] 200 OK`);
      } else if (res.status === 429) {
        blockedCount++;
        
        const msg = res.data?.message ?? String(res.data);
        console.log(`[Request ${res.index}] 429 BLOCKED: ${msg}`);
      } else {
        console.log(`[Request ${res.index}] Unexpected Status: ${res.status}`);
      }
    });
  
    console.log('\n--- Test Summary ---');
    console.log(`Successful: ${successCount} (Expected: <= 5)`);
    console.log(`Blocked: ${blockedCount} (Expected: >= 5)`);
    
    if (successCount <= 5 && blockedCount > 0) {
      console.log('\nTEST PASSED: Wallet Firewall is actively blocking traffic.');
    } else {
      console.log('\nTEST FAILED: Rate limiter did not engage correctly.');
    }
  }
  
  fireRateLimitTest().catch(console.error);