---
title: "Web Search Overview"
category: "tools"
tags: ["search", "web", "overview"]
sources: ["refs/openclaw-docs/docs/tools/web.md"]
summary: "OpenClaw web_search tool: all providers, auto-detection order, and configuration"
updated: "2026-04-24T00:00:00Z"
provenance:
  extracted: 0.9
  inferred: 0.1
  ambiguous: 0.0
---

# Web Search Overview

The `web_search` tool provides AI agents with internet search capabilities through multiple interchangeable providers.

## Provider Auto-Detection Order

When no explicit provider is configured, OpenClaw auto-detects in this priority:

1. API-backed providers with configured keys (Brave, Perplexity, Exa, etc.)
2. **DuckDuckGo** (order 100) — key-free, experimental HTML scraping
3. **Ollama Web Search** (order 110) — uses Ollama's experimental endpoint
4. **SearXNG** (order 200) — self-hosted meta-search, last fallback

## Available Providers

| Provider | Key Required | Type | Notes |
|----------|-------------|------|-------|
| [[brave-search|Brave]] | Yes | Structured API | Free tier, LLM Context mode |
| [[perplexity-search|Perplexity]] | Yes | Structured API / Sonar | OpenRouter compatible |
| [[exa-search|Exa]] | Yes | Neural search | Content extraction, highlights |
| [[tavily-search|Tavily]] | Yes | AI-optimized search | Extract tool available |
| [[firecrawl-search|Firecrawl]] | Yes | Search + scrape | Bot circumvention |
| [[gemini-search|Gemini]] | Yes | AI-synthesized | Google Search grounding |
| [[grok-search|Grok]] | Yes | AI-synthesized | xAI web-grounded |
| [[kimi-search|Kimi]] | Yes | AI-synthesized | Moonshot backend |
| [[minimax-search|MiniMax]] | Yes | Structured | CN/global regions |
| [[duckduckgo-search|DuckDuckGo]] | No | HTML scraping | Experimental, CAPTCHA risk |
| [[ollama-search|Ollama]] | No | Ollama API | Requires `ollama signin` |
| [[searxng-search|SearXNG]] | No | Self-hosted | Privacy/air-gap |

## Common Tool Parameters

All providers accept at minimum:
- `query` (required) — search query string
- `count` (1-10, default 5) — number of results

Provider-specific parameters include `freshness`, `country`, `language`, `date_after`/`date_before`, and `domain_filter`. See individual provider pages for details.

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

## Related

- [[skills|Skills]] — search-related skills available on ClawHub
- [[web-fetch|Web Fetch]] — fetch and extract content from URLs
- [[browser|Browser]] — full browser automation for complex pages
