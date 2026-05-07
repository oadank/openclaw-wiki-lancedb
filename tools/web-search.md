---
title: "Web Search Overview"
category: "tools"
tags: ["search", "web", "overview"]
sources: ["refs/openclaw-docs/docs/tools/web.md"]
summary: "OpenClaw web_search tool: all providers, auto-detection order, configuration"
updated: "2026-04-24T12:00:00Z"
provenance: { extracted: 1.0, inferred: 0.0, ambiguous: 0.0 }
---

# Web Search Overview

The `web_search` tool provides AI agents with internet search capabilities. OpenClaw supports multiple interchangeable providers.

## Provider Auto-Detection Order

When no explicit provider is configured, OpenClaw auto-detects:

1. **API-backed providers** with configured keys (highest priority)
2. [[duckduckgo-search|DuckDuckGo]] (order 100) — key-free, experimental HTML scraping
3. [[ollama-search|Ollama]] (order 110) — uses Ollama's experimental web_search endpoint
4. [[searxng-search|SearXNG]] (order 200) — self-hosted meta-search

## Provider Comparison

| Provider | Key Required | Type | Notes |
|----------|-------------|------|-------|
| [[brave-search|Brave]] | Yes | Structured API | Free tier ($5/mo credit), LLM Context mode |
| [[perplexity-search|Perplexity]] | Yes | Structured API / Sonar | OpenRouter compatible |
| [[exa-search|Exa]] | Yes | Neural search | Content extraction, highlights, summaries |
| [[tavily|Tavily]] | Yes | AI-optimized | Search + extract tools |
| [[firecrawl|Firecrawl]] | Yes | Search + scrape | Bot circumvention, JS rendering |
| [[gemini-search|Gemini]] | Yes | AI-synthesized | Google Search grounding |
| [[grok-search|Grok]] | Yes | AI-synthesized | xAI web-grounded responses |
| [[kimi-search|Kimi]] | Yes | AI-synthesized | Moonshot backend |
| [[minimax-search|MiniMax]] | Yes | Structured | Coding Plan API, CN/global regions |
| [[duckduckgo-search|DuckDuckGo]] | No | HTML scraping | Experimental, CAPTCHA risk |
| [[ollama-search|Ollama]] | No | Local API | Requires `ollama signin` |
| [[searxng-search|SearXNG]] | No | Self-hosted | Privacy/air-gap friendly |

## Common Tool Parameters

- `query` (required) — search query string
- `count` (default 5) — number of results
- `freshness` — time filter: `day`/`week`/`month`/`year`

Provider-specific parameters (country, language, date range, domain_filter, etc.) vary. See individual provider pages.

## Configuration

```json5
{
  tools: {
    web: {
      search: {
        provider: "brave", // or any provider name above
        maxResults: 5,
        timeoutSeconds: 30,
      },
    },
  },
}
```

Results are cached for 15 minutes by default (configurable via `cacheTtlMinutes`).

## Related

- [[web-fetch|Web Fetch]] — fetch and extract content from URLs
- [[browser|Browser]] — full browser automation for complex pages
