# semanticproxy

I'm currently working on this. It's basically an independent proxy designed to decouple context management, semantic caching, and memory tracking from the LLM applications or agents themselves. 

Any application can just swap its base API URL to point locally here. The proxy handles token optimization under the hood before routing the payload upstream.

### Current Status:
Research/infra-build phase. Tracking progress toward running local 75-turn (could be more, will decide when it's done) automated simulations to profile the performance trade-offs (latency, token savings, and context retention) and dumping those findings into a dashboard.

### The Problem I'm Looking At
Long running sessions blow up API costs and degrade TTFT due to $O(N^2)$ attention. I know native provider prompt caching helps, but it requires an exact, byte-for-byte prefix match. A single early typo or changing timestamp busts the provider's cache completely which could force full price processing on massive contexts. 

### Features (Experimental)
* **1.** Intercepts incoming requests and uses fast vector embeddings to catch semantically similar queries across different threads and drops latency to ~zero for repetitive developer/agent tasks. (will have more addition to this and won't simply just return the prev response in cases where similar queries are sent consecutively, as that could mean the user was simply not satisfied with the first reponse.)
* **2.** Uses local token estimation counters to track in-session histories. When a configured watermark (e.g., 8,000 tokens) is crossed, it slices older turns, generates a summary using a cheap model (probs gpt-4o-mini), archives the raw text in our Vector DB for deep RAG retrieval, and injects the compressed state back into the prompt.

Since this is experimental, I'll be switching up tools and modifying the architecture as I go. Will have a setup doc and benchmark code once the project is complete.