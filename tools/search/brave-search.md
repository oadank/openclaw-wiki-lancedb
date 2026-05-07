---
title: "Brave Search"
category: "tools"
tags: ["search", "web", "brave"]
sources: ["refs/openclaw-docs/docs/tools/brave-search.md"]
summary: "Brave Search API setup for web_search in OpenClaw"
updated: "2026-04-24T12:00:00Z"
provenance: { extracted: 1.0, inferred: 0.0, ambiguous: 0.0 }
---

# Brave Search

OpenClaw supports Brave Search API as a `web_search` provider.

## Setup

1. Create a Brave Search API account at [brave.com/search/api/](https://brave.com/search/api/)
2. Choose the **Search** plan and generate an API key
3. Store the key in config or set `BRAVE_API_KEY` env var

## Config

```json5
{
  plugins: {
    entries: {
      brave: {
        config: {
          webSearch: {
            apiKey: "BRAVE_API_KEY",
            mode: "web", // or "llm-context"
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: { provider: "brave", maxResults: 5, timeoutSeconds: 30 },
    },
  },
}
```

## Modes

- `web` (default): normal web search with titles, URLs, snippets
- `llm-context`: Brave LLM Context API with pre-extracted text chunks for grounding

## Tool Parameters

| Parameter     | Description                                    |
|---------------|------------------------------------------------|
| `query`       | Search query (required)                        |
| `count`       | Number of results (1-10, default 5)            |
| `country`     | 2-letter ISO country code (e.g. "US", "DE")    |
| `language`    | ISO 639-1 language code                        |
| `freshness`   | Time filter: `day`/`week`/`month`/`year`       |
| `date_after`  | Only results after YYYY-MM-DD                  |
| `date_before` | Only results before YYYY-MM-DD                 |

**Note:** `llm-context` mode does NOT support `ui_lang`, `freshness`, `date_after`, `date_before`.

## Pricing

- $5/month free credit (renewing)
- $5 per 1,000 requests
- Set usage limit in Brave dashboard to avoid unexpected charges

## Related

- [[web-search-overview|Web Search Overview]]
- [[perplexity-search|Perplexity Search]]
- [[exa-search|Exa Search]]
