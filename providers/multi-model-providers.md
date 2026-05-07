---
title: "Multi-Model Providers"
category: "providers"
tags: ["huggingface", "venice", "chutes", "opencode", "synthetic", "vydra"]
sources: ["refs/openclaw-docs/docs/providers/huggingface.md", "refs/openclaw-docs/docs/providers/venice.md", "refs/openclaw-docs/docs/providers/chutes.md", "refs/openclaw-docs/docs/providers/opencode.md", "refs/openclaw-docs/docs/providers/synthetic.md", "refs/openclaw-docs/docs/providers/vydra.md"]
updated: "2026-04-24"
summary: "Multi-model aggregator providers: HuggingFace, Venice AI, Chutes, OpenCode, Synthetic, Vydra"
provenance:
  extracted: 0.85
  inferred: 0.15
  ambiguous: 0.0
---

# Multi-Model Providers

Providers that aggregate models from many sources behind a single API.

## HuggingFace Inference

| Property | Value |
|----------|-------|
| Provider | `huggingface` |
| Auth | `HUGGINGFACE_HUB_TOKEN` or `HF_TOKEN` |
| Endpoint | `https://router.huggingface.co/v1` |
| Models | DeepSeek R1, Qwen3, Llama 3.3, GPT-OSS 120B, GLM 4.7, Kimi K2.5, etc. |

Fine-grained token with "Make calls to Inference Providers" permission required. Model refs: `huggingface/<org>/<model>`. Supports `:fastest` and `:cheapest` suffixes.

## Venice AI

| Property | Value |
|----------|-------|
| Provider | `venice` |
| Auth | `VENICE_API_KEY` |
| Default model | `venice/kimi-k2-5` |

Privacy-focused inference with two modes:
- **Private** (fully private, no logging): Llama, Qwen, DeepSeek, Kimi, MiniMax, Venice Uncensored
- **Anonymized** (metadata stripped, proxied): Claude, GPT, Gemini, Grok

41 models total (26 private + 15 anonymized). No hard rate limits (fair-use throttling).

## Chutes

| Property | Value |
|----------|-------|
| Provider | `chutes` |
| Auth | OAuth or `CHUTES_API_KEY` |
| Endpoint | `https://llm.chutes.ai/v1` |
| Default model | `chutes/zai-org/GLM-4.7-TEE` |

OAuth via `openclaw onboard --auth-choice chutes`. Aliases: `chutes-fast`, `chutes-pro`, `chutes-vision`. Auto-discovers models with fallback to static catalog.

## OpenCode

| Catalog | Prefix | Default Models |
|---------|--------|---------------|
| Zen | `opencode/` | `claude-opus-4-6`, `gpt-5.4`, `gemini-3-pro` |
| Go | `opencode-go/` | `kimi-k2.5`, `glm-5`, `minimax-m2.5` |

Shared `OPENCODE_API_KEY`. Single onboarding stores credentials for both. Zen uses multi-model proxy, Go hosts Kimi/GLM/MiniMax lineup.

## Synthetic

| Property | Value |
|----------|-------|
| Provider | `synthetic` |
| Auth | `SYNTHETIC_API_KEY` |
| Endpoint | `https://api.synthetic.new/anthropic` |
| API | Anthropic Messages compatible |

21 models from HuggingFace (MiniMax M2.5, Kimi K2.5, GLM 5, DeepSeek variants, etc.). All costs $0. Base URL auto-appends `/v1`.

## Vydra

| Property | Value |
|----------|-------|
| Provider | `vydra` |
| Auth | `VYDRA_API_KEY` |
| Base URL | `https://www.vydra.ai/api/v1` |

Image (`grok-imagine`), video (`veo3`, `kling`), and speech synthesis (ElevenLabs-backed TTS). ⚠️ Use `www.vydra.ai` — apex `vydra.ai` may drop auth on redirect.

## Related
- [[openrouter]] — Another multi-model aggregator
- [[model-providers]] — Provider selection
