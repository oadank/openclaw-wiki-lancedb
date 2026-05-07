---
title: "Special Purpose Providers"
category: "providers"
tags: ["github-copilot", "claude-max-proxy", "perplexity", "web-search"]
sources: ["refs/openclaw-docs/docs/providers/github-copilot.md", "refs/openclaw-docs/docs/providers/claude-max-api-proxy.md", "refs/openclaw-docs/docs/providers/perplexity-provider.md"]
updated: "2026-04-24"
summary: "Special purpose providers: GitHub Copilot (device login), Claude Max API Proxy (community), Perplexity (web search)"
provenance:
  extracted: 0.9
  inferred: 0.1
  ambiguous: 0.0
---

# Special Purpose Providers

Non-standard providers with unique auth flows or purposes.

## GitHub Copilot

| Property | Value |
|----------|-------|
| Provider | `github-copilot` (built-in) or `copilot-proxy` (VS Code plugin) |
| Auth | Device flow: `openclaw models auth login-github-copilot` |
| Env var priority | 1. `COPILOT_GITHUB_TOKEN` 2. `GH_TOKEN` 3. `GITHUB_TOKEN` |

⚠️ Requires interactive TTY for device login. Model availability depends on your GitHub plan.

Also serves as embedding provider for memory search (priority 15 in auto-detection):
```json5
{ agents: { defaults: { memorySearch: { provider: "github-copilot" } } } }
```
Auto-discovers embedding models, prefers `text-embedding-3-small`.

## Claude Max API Proxy

**Community tool** — exposes Claude Max/Pro subscription as OpenAI-compatible API. Not officially supported by Anthropic or OpenClaw.

⚠️ Anthropic has blocked some subscription usage outside Claude Code. Verify current policy before relying on it.

| Property | Value |
|----------|-------|
| Install | `npm install -g claude-max-api-proxy` |
| Server | `http://localhost:3456` |
| Models | `claude-opus-4`, `claude-sonnet-4`, `claude-haiku-4` |

Cost comparison: Claude Max subscription ($200/month flat) vs Anthropic API (~$15/M input, $75/M output for Opus).

Configure OpenClaw:
```json5
{ env: { OPENAI_BASE_URL: "http://localhost:3456/v1" }, agents: { defaults: { model: { primary: "openai/claude-opus-4" } } } }
```

Proxy-style path — no native OpenAI request shaping.

## Perplexity (Web Search Provider)

| Property | Value |
|----------|-------|
| Type | Web search provider (NOT a model provider) |
| Auth | `PERPLEXITY_API_KEY` (native) or `OPENROUTER_API_KEY` (Sonar via OpenRouter) |
| Config | `plugins.entries.perplexity.config.webSearch.apiKey` |

| Key Prefix | Transport | Features |
|------------|-----------|----------|
| `pplx-` | Native Perplexity Search API | Structured results, domain/language/date filters |
| `sk-or-` | OpenRouter (Sonar) | AI-synthesized answers with citations |

Native API filtering: country, language, date range, domain allowlist/denylist (max 20), content budget limits.

## Related
- [[anthropic]] — Native Anthropic provider (preferred for production)
- [[openrouter]] — OpenRouter provider
