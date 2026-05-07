---
title: "Model Provider Quickstart"
category: providers
tags:
  - llm
  - model-provider
sources:
  - "/opt/openclaw/data/workspace/refs/openclaw-docs/docs/providers/models.md"
summary: "Quick-start guide for selecting and configuring LLM model providers in OpenClaw."
created: 2026-04-24T12:00:00Z
updated: 2026-04-24T12:00:00Z
provenance:
  extracted: 0.9
  inferred: 0.1
  ambiguous: 0.0
---

# Model Provider Quickstart

OpenClaw can use many LLM providers. Pick one, authenticate, then set the default model as `provider/model`.

## Quick start (two steps)

1. Authenticate with the provider — typically via `openclaw onboard`
2. Set the default model:
   ```json5
   {
     agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
   }
   ```

## Supported providers (starter set)

| Provider | Documentation link |
| -------- | ------------------ |
| Alibaba Model Studio | [[qwen|Qwen]] |
| Anthropic (API + Claude CLI) | /providers/anthropic |
| Amazon Bedrock | /providers/bedrock |
| BytePlus (International) | /concepts/model-providers#byteplus-international |
| Chutes | /providers/chutes |
| ComfyUI | /providers/comfy |
| Cloudflare AI Gateway | /providers/cloudflare-ai-gateway |
| fal | /providers/fal |
| Fireworks | /providers/fireworks |
| GLM models | [[glm|GLM (Zhipu)]] |
| MiniMax | /providers/minimax |
| Mistral | /providers/mistral |
| Moonshot AI (Kimi + Kimi Coding) | /providers/moonshot |
| OpenAI (API + Codex) | /providers/openai |
| OpenCode (Zen + Go) | /providers/opencode |
| OpenRouter | /providers/openrouter |
| Qianfan | /providers/qianfan |
| Qwen | [[qwen|Qwen]] |
| Runway | [[runway|Runway]] |
| StepFun | /providers/stepfun |
| Synthetic | /providers/synthetic |
| Vercel AI Gateway | /providers/vercel-ai-gateway |
| Venice (Venice AI) | /providers/venice |
| xAI | /providers/xai |
| Z.AI | /providers/zai |
| DeepSeek | [[deepseek|DeepSeek]] |
| NVIDIA | [[nvidia|NVIDIA]] |
| Tencent Cloud (TokenHub) | [[tencent|Tencent Cloud (TokenHub)]] |

## Additional bundled variants

- `anthropic-vertex` — implicit Anthropic on Google Vertex (no separate auth)
- `copilot-proxy` — local VS Code Copilot Proxy bridge
- `google-gemini-cli` — Gemini CLI OAuth flow (requires local `gemini` install)

## See also

- [[provider-directory|Provider Directory]] — Full provider catalog with links
- [[model-providers|Model Providers]] — Advanced configuration and failover
