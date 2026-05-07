---
title: "FAQ: Models"
summary: "Model defaults, selection, aliases, switching, and failover strategies"
category: references
tags:
  - openclaw
  - faq
  - models
sources:
  - /opt/openclaw/data/workspace/refs/openclaw-docs/docs/help/faq.md
provenance:
  extracted: 0.85
  inferred: 0.15
  ambiguous: 0.0
---

# FAQ: Models

Answers about model selection, aliases, failover, and "All models failed" scenarios.

## Models: Defaults, Selection, Aliases, Switching

### How Model Selection Works

OpenClaw uses a multi-provider model with failover support:

- Each agent can have its own model routing and failover chain
- Provider order is defined in `openclaw.json`
- Per-channel and per-account model routing is supported

### Model Aliases

You can define aliases for model names in configuration:

```json5
{
  models: {
    aliases: {
      "default": "anthropic/claude-sonnet-4-20250514",
      "fast": "openai/gpt-4o-mini",
    },
  },
}
```

### Checking Model Status

```bash
openclaw models status
```

Shows provider auth + model availability.

### Switching Models

You can switch the active model via:
- Config changes in `openclaw.json`
- CLI commands: `openclaw models use <model>`
- Runtime overrides

### Model Provider Support

OpenClaw supports:
- **Anthropic** — Claude family
- **OpenAI** — GPT family
- **MiniMax** — MiniMax models
- **OpenRouter** — multi-provider routing
- And others — check provider configuration docs

## Model Failover and "All Models Failed"

### Failover Configuration

OpenClaw attempts the next provider in the chain if the primary fails:

```json5
{
  models: {
    providers: {
      "anthropic": {
        // primary config
      },
      "openai": {
        // fallback config
      },
    },
  },
}
```

### Common Failures

- **429 Rate Limits** — switch providers or wait
- **Auth errors** — check `openclaw models status`
- **Model not available** — verify model name and provider
- **Network issues** — check connectivity and proxy settings

### "All Models Failed" Recovery

When all providers fail:

1. Check `openclaw models status` for auth issues
2. Verify network connectivity
3. Try a different provider
4. Check logs: `openclaw logs --follow`

### Anthropic Long Context 429

If you see:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`

This requires additional Anthropic usage quota. Switch to a different model or reduce context length.

### Live Testing Models

```bash
# Test models with live credentials
pnpm test:live
# Target specific test file
pnpm test:live -- src/agents/models.profiles.live.test.ts
```

## Related

- [[models-overview|Models Overview]] — comprehensive model documentation
- [[models|Model Configuration]] — how to configure model providers
- [[testing|Testing]] — how to test model connectivity
