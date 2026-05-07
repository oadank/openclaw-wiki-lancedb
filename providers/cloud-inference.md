---
title: "Cloud Inference Providers"
category: "providers"
tags: ["together-ai", "fireworks", "groq", "nvidia", "arcee", "mistral", "open-source"]
sources: ["refs/openclaw-docs/docs/providers/together.md", "refs/openclaw-docs/docs/providers/fireworks.md", "refs/openclaw-docs/docs/providers/groq.md", "refs/openclaw-docs/docs/providers/nvidia.md", "refs/openclaw-docs/docs/providers/arcee.md", "refs/openclaw-docs/docs/providers/mistral.md"]
updated: "2026-04-24"
summary: "Cloud inference platforms: Together AI, Fireworks, Groq, NVIDIA, Arcee AI, Mistral"
provenance:
  extracted: 0.85
  inferred: 0.15
  ambiguous: 0.0
---

# Cloud Inference Providers

Consolidated overview of cloud inference platforms offering open-weight and proprietary models.

## Together AI

| Property | Value |
|----------|-------|
| Provider | `together` |
| Auth | `TOGETHER_API_KEY` |
| Endpoint | `https://api.together.xyz/v1` |
| Default model | `together/moonshotai/Kimi-K2.5` |

Key models: Kimi K2.5, GLM 4.7, Llama 3.3 70B, Llama 4 Scout/Maverick, DeepSeek V3.1/R1. Also provides video generation via `Wan-AI/Wan2.2-T2V-A14B`.

## Fireworks

| Property | Value |
|----------|-------|
| Provider | `fireworks` |
| Auth | `FIREWORKS_API_KEY` |
| Endpoint | `https://api.fireworks.ai/inference/v1` |
| Default model | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` (Fire Pass) |

Models: Kimi K2.6 (thinking disabled on Fireworks), Kimi K2.5 Turbo (Fire Pass). Model refs use full Fireworks path (e.g., `fireworks/accounts/fireworks/models/<name>`).

## Groq

| Property | Value |
|----------|-------|
| Provider | `groq` |
| Auth | `GROQ_API_KEY` |
| Default model | `groq/llama-3.3-70b-versatile` |

Ultra-fast inference on open-source models (Llama, Gemma, Mistral) using custom LPU hardware. Also provides audio transcription via `whisper-large-v3-turbo`.

## NVIDIA

| Property | Value |
|----------|-------|
| Provider | `nvidia` |
| Auth | `NVIDIA_API_KEY` (free) |
| Endpoint | `https://integrate.api.nvidia.com/v1` |
| Default model | `nvidia/nvidia/nemotron-3-super-120b-a12b` |

Free OpenAI-compatible API. Models: Nemotron 3 Super, Kimi K2.5, Minimax M2.5, GLM 5.

## Arcee AI

| Property | Value |
|----------|-------|
| Provider | `arcee` |
| Auth | `ARCEEAI_API_KEY` or `OPENROUTER_API_KEY` |
| Default model | `arcee/trinity-large-thinking` |

Trinity MoE models (Apache 2.0). Models: `trinity-large-thinking` (256K, reasoning), `trinity-large-preview` (128K, 400B params/13B active), `trinity-mini` (128K, fast). Accessible via direct API or OpenRouter.

## Mistral

| Property | Value |
|----------|-------|
| Provider | `mistral` |
| Auth | `MISTRAL_API_KEY` |
| Endpoint | `https://api.mistral.ai/v1` |
| Default model | `mistral/mistral-large-latest` |

Models: Mistral Large, Medium 3.1, Small 4 (adjustable reasoning), Pixtral Large, Codestral, Devstral Medium, Magistral Small. Also provides Voxtral audio transcription and memory embeddings (`mistral-embed`).

## Related
- [[openrouter]] — Access these models via OpenRouter
- [[local-inference]] — Local/self-hosted alternatives
