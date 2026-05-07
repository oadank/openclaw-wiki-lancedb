---
title: "Local Inference Servers"
category: "providers"
tags: ["vllm", "sglang", "lm-studio", "inferrs", "local", "self-hosted"]
sources: ["refs/openclaw-docs/docs/providers/vllm.md", "refs/openclaw-docs/docs/providers/sglang.md", "refs/openclaw-docs/docs/providers/lmstudio.md", "refs/openclaw-docs/docs/providers/inferrs.md"]
updated: "2026-04-24"
summary: "Local/self-hosted inference servers: vLLM, SGLang, LM Studio, inferrs"
provenance:
  extracted: 0.9
  inferred: 0.1
  ambiguous: 0.0
---

# Local Inference Servers

Consolidated overview of self-hosted inference servers supported by OpenClaw.

## vLLM

| Property | Value |
|----------|-------|
| Provider | `vllm` |
| API | OpenAI-compatible (`openai-completions`) |
| Auth | `VLLM_API_KEY` (any value works) |
| Default URL | `http://127.0.0.1:8000/v1` |

Auto-discovers models via `GET /v1/models` when `VLLM_API_KEY` set and no explicit config. Proxy-style — no native OpenAI request shaping.

## SGLang

| Property | Value |
|----------|-------|
| Provider | `sglang` |
| API | OpenAI-compatible (`openai-completions`) |
| Auth | `SGLANG_API_KEY` |
| Default URL | `http://127.0.0.1:30000/v1` |

Same behavior as vLLM: auto-discovery, proxy-style path.

## LM Studio

| Property | Value |
|----------|-------|
| Provider | `lmstudio` |
| Auth | `LM_API_TOKEN` (any non-empty value for unauthenticated) |
| Default URL | `http://localhost:1234/v1` |

Supports GGUF (llama.cpp) and MLX (Apple Silicon) models. JIT model loading enabled for smooth experience. Model keys: `author/model-name` format.

```bash
openclaw onboard --non-interactive --auth-choice lmstudio --accept-risk
```

## inferrs

| Property | Value |
|----------|-------|
| Provider | `inferrs` |
| API | OpenAI-compatible |
| Default URL | `http://127.0.0.1:8080/v1` |

Currently treated as custom self-hosted backend, not dedicated plugin. **⚠️ Requires `compat.requiresStringContent: true`** for some models (Gemma). May also need `compat.supportsTools: false` for agent runs.

```json5
compat: { requiresStringContent: true, supportsTools: false }
```

## Common Pattern

All local servers are treated as **proxy-style OpenAI-compatible `/v1` backends**:
- No `service_tier`, no Responses `store`, no prompt-cache hints
- No OpenAI reasoning-compat payload shaping
- No hidden attribution headers on custom base URLs

## Related
- [[ollama]] — Ollama (native API, not OpenAI-compatible)
- [[model-providers]] — Provider selection
