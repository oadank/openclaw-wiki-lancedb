---
title: "Unified API Gateways"
category: "providers"
tags: ["openrouter", "litellm", "kilocode", "ai-gateway", "vercel", "cloudflare"]
sources: ["refs/openclaw-docs/docs/providers/openrouter.md", "refs/openclaw-docs/docs/providers/litellm.md", "refs/openclaw-docs/docs/providers/kilocode.md", "refs/openclaw-docs/docs/providers/vercel-ai-gateway.md", "refs/openclaw-docs/docs/providers/cloudflare-ai-gateway.md"]
updated: "2026-04-24"
summary: "Unified API gateway providers: OpenRouter, LiteLLM, Kilo Gateway, Vercel AI Gateway, Cloudflare AI Gateway"
provenance:
  extracted: 0.9
  inferred: 0.1
  ambiguous: 0.0
---

# Unified API Gateways

Gateways provide a single API key to access many models from different providers.

## OpenRouter

| Property | Value |
|----------|-------|
| Provider | `openrouter` |
| Auth | `OPENROUTER_API_KEY` |
| Default model | `openrouter/auto` (automatic routing) |

Model refs: `openrouter/<provider>/<model>`. Adds OpenRouter headers (`HTTP-Referer`, `X-OpenRouter-Title`, `X-OpenRouter-Categories`). Anthropic cache markers kept on verified routes. Proxy-style OpenAI-compatible path — no native OpenAI request shaping.

## LiteLLM

| Property | Value |
|----------|-------|
| Provider | `litellm` |
| Auth | `LITELLM_API_KEY` |
| Default | `http://localhost:4000` |

Self-hosted LLM gateway. Benefits: cost tracking, model routing, virtual keys with spend limits, full request/response logging, automatic failover. Proxy-style OpenAI-compatible path.

## Kilo Gateway

| Property | Value |
|----------|-------|
| Provider | `kilocode` |
| Auth | `KILOCODE_API_KEY` |
| Endpoint | `https://api.kilo.ai/api/gateway/` |
| Default model | `kilocode/kilo/auto` (smart routing) |

Auto-discovers models from Kilo Gateway. OpenRouter-compatible. Proxy-style path — `kilocode/kilo/auto` and proxy-reasoning-unsupported refs skip reasoning injection.

## Vercel AI Gateway

| Property | Value |
|----------|-------|
| Provider | `vercel-ai-gateway` |
| Auth | `AI_GATEWAY_API_KEY` |
| API | Anthropic Messages compatible |
| Model catalog | Auto-discovered via `/v1/models` |

Model refs: `vercel-ai-gateway/<provider>/<model>`. Shorthand support: `vercel-ai-gateway/claude-opus-4.6` → `vercel-ai-gateway/anthropic/claude-opus-4.6`.

## Cloudflare AI Gateway

| Property | Value |
|----------|-------|
| Provider | `cloudflare-ai-gateway` |
| Auth | `CLOUDFLARE_AI_GATEWAY_API_KEY` (your provider's key, e.g., Anthropic) |
| URL | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic` |
| Default model | `cloudflare-ai-gateway/claude-sonnet-4-5` |

Sits in front of provider APIs for analytics, caching, and controls. Authenticated gateways need additional `cf-aig-authorization` header.

## Related
- [[model-providers]] — Provider selection
- [[model-failover]] — Fallback chains
