---
title: "Provider Directory"
category: providers
tags:
  - llm
  - model-provider
  - directory
sources:
  - "/opt/openclaw/data/workspace/refs/openclaw-docs/docs/providers/index.md"
summary: "Directory of all LLM providers supported by OpenClaw, with quick-start setup guide."
created: 2026-04-24T12:00:00Z
updated: 2026-04-24T12:00:00Z
provenance:
  extracted: 0.95
  inferred: 0.05
  ambiguous: 0.0
---

# Provider Directory

OpenClaw supports many LLM providers. The workflow is always: authenticate, then set the default model as `provider/model`.

## Quick start

1. Authenticate via `openclaw onboard`
2. Set default model:
   ```json5
   { agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } } }
   ```

## Provider catalog

### LLM providers

- [Alibaba Model Studio](/providers/alibaba)
- [Amazon Bedrock](/providers/bedrock)
- [Anthropic](/providers/anthropic)
- [Arcee AI](/providers/arcee)
- [BytePlus](/concepts/model-providers#byteplus-international)
- [Chutes](/providers/chutes)
- [Cloudflare AI Gateway](/providers/cloudflare-ai-gateway)
- [ComfyUI](/providers/comfy)
- [DeepSeek](/providers/deepseek)
- [fal](/providers/fal)
- [Fireworks](/providers/fireworks)
- [GitHub Copilot](/providers/github-copilot)
- [GLM models](/providers/glm)
- [Google (Gemini)](/providers/google)
- [Groq](/providers/groq)
- [Hugging Face](/providers/huggingface)
- [inferrs](/providers/inferrs)
- [Kilocode](/providers/kilocode)
- [LiteLLM](/providers/litellm)
- [LM Studio](/providers/lmstudio)
- [MiniMax](/providers/minimax)
- [Mistral](/providers/mistral)
- [Moonshot AI (Kimi)](/providers/moonshot)
- [NVIDIA](/providers/nvidia)
- [Ollama](/providers/ollama)
- [OpenAI](/providers/openai)
- [OpenCode](/providers/opencode)
- [OpenCode Go](/providers/opencode-go)
- [OpenRouter](/providers/openrouter)
- [Perplexity](/providers/perplexity-provider)
- [Qianfan](/providers/qianfan)
- [Qwen Cloud](/providers/qwen)
- [Runway](/providers/runway)
- [SGLang](/providers/sglang)
- [StepFun](/providers/stepfun)
- [Synthetic](/providers/synthetic)
- [Tencent Cloud (TokenHub)](/providers/tencent)
- [Together AI](/providers/together)
- [Venice](/providers/venice)
- [Vercel AI Gateway](/providers/vercel-ai-gateway)
- [vLLM](/providers/vllm)
- [Volcengine (Doubao)](/providers/volcengine)
- [Vydra](/providers/vydra)
- [xAI](/providers/xai)
- [Xiaomi](/providers/xiaomi)
- [Z.AI](/providers/zai)

### Bundled variants

- `anthropic-vertex` — implicit Anthropic on Google Vertex (no separate auth)
- `copilot-proxy` — local VS Code Copilot Proxy bridge
- `google-gemini-cli` — Gemini CLI OAuth flow

### Media generation

- [Image Generation](/tools/image-generation)
- [Music Generation](/tools/music-generation)
- [Video Generation](/tools/video-generation)

### Transcription

- [Deepgram](/providers/deepgram)
- [xAI Speech-to-Text](/providers/xai#speech-to-text)

### Community

- [Claude Max API Proxy](/providers/claude-max-api-proxy)

## See also

- [[model-providers|Model Providers]] — Full configuration and failover behavior
- [[models-cli|Models CLI]] — CLI commands for model management
