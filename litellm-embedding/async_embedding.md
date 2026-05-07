---
title: "litellm.aembedding()"
category: "litellm-embedding"
tags:
  - litellm
  - litellm-embedding
sources:
  - "/opt/openclaw/data/workspace/refs/litellm-docs/docs/embedding/async_embedding.md"
summary: "LiteLLM provides an asynchronous version of the `embedding` function called `aembedding`"
---

# litellm.aembedding()

# litellm.aembedding()

LiteLLM provides an asynchronous version of the `embedding` function called `aembedding`
### Usage
```python
from litellm import aembedding

async def test_get_response():
    response = await aembedding('text-embedding-ada-002', input=["good morning from litellm"])
    return response

response = asyncio.run(test_get_response())
print(response)
```
