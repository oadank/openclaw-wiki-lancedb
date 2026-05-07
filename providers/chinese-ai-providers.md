---
title: "Chinese AI Providers"
category: "providers"
tags: ["deepseek", "moonshot", "kimi", "minimax", "zai", "glm", "qianfan", "stepfun", "volcengine", "xiaomi", "tencent"]
sources: ["refs/openclaw-docs/docs/providers/deepseek.md", "refs/openclaw-docs/docs/providers/moonshot.md", "refs/openclaw-docs/docs/providers/minimax.md", "refs/openclaw-docs/docs/providers/zai.md", "refs/openclaw-docs/docs/providers/glm.md", "refs/openclaw-docs/docs/providers/qianfan.md", "refs/openclaw-docs/docs/providers/stepfun.md", "refs/openclaw-docs/docs/providers/volcengine.md", "refs/openclaw-docs/docs/providers/xiaomi.md", "refs/openclaw-docs/docs/providers/tencent.md"]
updated: "2026-04-24"
summary: "Chinese AI platforms: DeepSeek, Moonshot (Kimi), MiniMax, Z.AI/GLM, Qianfan, StepFun, Volcengine, Xiaomi, Tencent"
provenance:
  extracted: 0.85
  inferred: 0.15
  ambiguous: 0.0
---

# Chinese AI Providers

Consolidated overview of major Chinese AI model providers supported by OpenClaw.

## DeepSeek

| Property | Value |
|----------|-------|
| Provider | `deepseek` |
| Auth | `DEEPSEEK_API_KEY` |
| API | OpenAI-compatible, `https://api.deepseek.com` |
| Models | `deepseek-chat` (default, V3.2 non-thinking), `deepseek-reasoner` (V3.2 reasoning) |
| Context | 131,072 tokens |

```bash
openclaw onboard --auth-choice deepseek-api-key
```

## Moonshot (Kimi)

**⚠️ Moonshot (`moonshot/`) and Kimi Coding (`kimi/`) are separate providers with separate keys and endpoints.**

| Provider | Endpoint | Auth Choice | Models |
|----------|----------|-------------|--------|
| Moonshot (international) | `api.moonshot.ai/v1` | `moonshot-api-key` | `kimi-k2.6`, `kimi-k2.5`, `kimi-k2-thinking`, `kimi-k2-thinking-turbo`, `kimi-k2-turbo` |
| Moonshot (China) | `api.moonshot.cn/v1` | `moonshot-api-key-cn` | Same |
| Kimi Coding | Separate | `kimi-code-api-key` | `kimi-code` |

- Kimi K2.6 pricing: $0.95/MTok input, $4.00/MTok output
- Thinking: binary (`enabled`/`disabled`), `/think off` → disabled
- Also provides `web_search` provider

## MiniMax

| Property | Value |
|----------|-------|
| Provider | `minimax` (API key) / `minimax-portal` (OAuth) |
| Default model | `MiniMax-M2.7` (reasoning), `MiniMax-M2.7-highspeed` (faster) |
| Auth | `MINIMAX_API_KEY` or OAuth (Coding Plan) |
| Endpoints | `api.minimax.io/anthropic` (international), `api.minimaxi.com` (China) |

Also provides: image generation (`image-01`), music generation (`music-2.5+`), video generation (`MiniMax-Hailuo-2.3`), image understanding (`MiniMax-VL-01`), and `web_search`.

**⚠️ Thinking disabled by default** on Anthropic-compatible streaming path to prevent reasoning leakage.

## Z.AI (GLM Models)

| Property | Value |
|----------|-------|
| Provider | `zai` |
| Auth | `ZAI_API_KEY` |
| Default model | `zai/glm-5.1` |
| API | Z.AI Chat Completions (Bearer auth) |

GLM model family: `glm-5.1` (default), `glm-5`, `glm-5-turbo`, `glm-5v-turbo`, `glm-4.7`, `glm-4.7-flash`, `glm-4.7-flashx`, `glm-4.6`, `glm-4.6v`, `glm-4.5`, `glm-4.5-air`, `glm-4.5-flash`, `glm-4.5v`.

Auth choices: `zai-api-key` (auto-detect), `zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`. Image understanding via `glm-4.6v`.

## Qianfan (Baidu)

| Property | Value |
|----------|-------|
| Provider | `qianfan` |
| Auth | `QIANFAN_API_KEY` (format: `bce-v3/ALTAK-...`) |
| Endpoint | `https://qianfan.baidubce.com/v2` |
| Models | `deepseek-v3.2` (default), `ernie-5.0-thinking-preview` |

## StepFun

| Property | Value |
|----------|-------|
| Provider | `stepfun` (standard) / `stepfun-plan` (reasoning) |
| Auth | `STEPFUN_API_KEY` |
| Default model | `stepfun/step-3.5-flash` |

China endpoints use `.com`, global endpoints use `.ai`. Step Plan also exposes `step-3.5-flash-2603`.

## Volcengine (Doubao)

| Provider | Endpoint | Use Case |
|----------|----------|----------|
| `volcengine` | `ark.cn-beijing.volces.com/api/v3` | General models |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | Coding models |

Models include: Doubao Seed 1.8, Kimi K2.5, GLM 4.7, DeepSeek V3.2, Ark Coding Plan.

## Xiaomi MiMo

| Property | Value |
|----------|-------|
| Provider | `xiaomi` |
| Auth | `XIAOMI_API_KEY` |
| Endpoint | `https://api.xiaomimimo.com/v1` |
| Models | `mimo-v2-flash` (default), `mimo-v2-pro` (1M context, reasoning), `mimo-v2-omni` (multimodal, reasoning) |

## Tencent (TokenHub)

| Property | Value |
|----------|-------|
| Provider | `tencent-tokenhub` |
| Auth | `TOKENHUB_API_KEY` |
| Endpoint | `tokenhub.tencentmaas.com/v1` |
| Models | `hy3-preview` (256K context, reasoning) |

## Related
- [[qwen]] — Qwen Cloud provider
- [[model-providers]] — Provider selection and failover
