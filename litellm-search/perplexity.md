---
title: "Perplexity AI Search"
category: "litellm-search"
tags:
  - litellm
  - litellm-search
sources:
  - "/opt/openclaw/data/workspace/refs/litellm-docs/docs/search/perplexity.md"
summary: "Get API Key:** [https://www.perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)"
---

# Perplexity AI Search

# Perplexity AI Search

**Get API Key:** [https://www.perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)

## LiteLLM Python SDK

```python showLineNumbers title="Perplexity Search"
from litellm import search

os.environ["PERPLEXITYAI_API_KEY"] = "pplx-..."

response = search(
    query="latest AI developments",
    search_provider="perplexity",
    max_results=5
)
```

## LiteLLM AI Gateway

### 1. Setup config.yaml

```yaml showLineNumbers title="config.yaml"
model_list:
  - model_name: gpt-4
    litellm_params:
      model: gpt-4
      api_key: os.environ/OPENAI_API_KEY

search_tools:
  - search_tool_name: perplexity-search
    litellm_params:
      search_provider: perplexity
      api_key: os.environ/PERPLEXITYAI_API_KEY
```

### 2. Start the proxy

```bash
litellm --config /path/to/config.yaml

# RUNNING on http://0.0.0.0:4000
```

### 3. Test the search endpoint

```bash showLineNumbers title="Test Request"
curl http://0.0.0.0:4000/v1/search/perplexity-search \
  -H "Authorization: Bearer sk-1234" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "latest AI developments",
    "max_results": 5
  }'
```
