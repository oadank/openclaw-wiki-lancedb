---
title: Models CLI
category: concepts
tags:
  - cli
  - models
  - configuration
sources:
  - /opt/openclaw/data/workspace/refs/openclaw-docs/docs/concepts/models.md
created: 2026-04-23T02:45:00Z
updated: 2026-04-23T02:45:00Z
summary: How OpenClaw selects models, CLI commands for managing models, aliases, fallbacks, and the model allowlist behavior.
provenance:
  extracted: 0.8
  inferred: 0.2
  ambiguous: 0.0
---

# Models CLI

How OpenClaw selects models and the CLI tools for managing them. For provider details, see [[model-providers]]. For failover rules, see [[model-failover]].

## Model Selection Order

1. **Primary** model (`agents.defaults.model.primary`)
2. **Fallbacks** in `agents.defaults.model.fallbacks` (in order)
3. **Provider auth failover** happens within a provider before moving to the next model

Additional model slots:
- `agents.defaults.imageModel` — used when primary model can't accept images
- `agents.defaults.pdfModel` — used by the `pdf` tool (falls back to imageModel)
- `agents.defaults.imageGenerationModel` — image generation
- `agents.defaults.musicGenerationModel` — music generation
- `agents.defaults.videoGenerationModel` — video generation

Per-agent defaults via `agents.list[].model` override global settings ^[inferred].

## Quick Model Policy

- Set primary to the strongest latest-generation model available.
- Use fallbacks for cost/latency-sensitive tasks.
- Avoid older/weaker models for tool-enabled agents or untrusted inputs.

## Onboarding

```bash
openclaw onboard
```

Sets up model + auth for common providers including OpenAI Codex (OAuth) and Anthropic (API key or Claude CLI).

## Config Keys

- `agents.defaults.model.primary` and `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` / `.fallbacks`
- `agents.defaults.pdfModel.primary` / `.fallbacks`
- `agents.defaults.imageGenerationModel.primary` / `.fallbacks`
- `agents.defaults.videoGenerationModel.primary` / `.fallbacks`
- `agents.defaults.models` — allowlist + aliases + provider params
- `models.providers` — custom providers written into `models.json`

Model refs normalize to lowercase. Provider aliases like `z.ai/*` normalize to `zai/*`.

## Safe Allowlist Edits

Use `openclaw config set` with `--merge` for additive changes:

```bash
openclaw config set agents.defaults.models '{"openai-codex/gpt-5.4":{}}' --strict-json --merge
```

Plain object assignment is rejected when it would remove existing entries. Use `--replace` only for complete replacement.

## "Model is not allowed"

When `agents.defaults.models` is set, it becomes the **allowlist** for `/model` and session overrides. Selecting a model outside the allowlist returns:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

Fixes:
- Add the model to `agents.defaults.models`
- Clear the allowlist
- Pick from `/model list`

## Switching Models in Chat (`/model`)

```
/model           # Compact numbered picker
/model list      # Same as /model
/model 3         # Select by number
/model openai/gpt-5.4  # Select by ref
/model status    # Detailed view with auth + endpoint info
```

- Model refs split on the **first** `/` — use `provider/model` format.
- Model IDs containing `/` (OpenRouter-style) must include provider prefix.
- Without provider prefix, resolution order: alias match → unique provider match → deprecated fallback to default provider.
- `/model` persists immediately. If agent is idle, next run uses new model. If a run is active, it marks as pending and switches at a clean retry point.
- Discord: `/model` and `/models` open interactive picker with dropdowns.
- `/models add <provider> <modelId>` — fastest path to add a model.

## CLI Commands

### List & Status

```bash
openclaw models list              # Configured models
openclaw models list --all        # Full catalog
openclaw models list --local      # Local providers only
openclaw models list --provider <name>
openclaw models list --plain      # One per line
openclaw models list --json       # Machine-readable
openclaw models status            # Primary, fallbacks, auth overview
openclaw models status --plain    # Just primary model
openclaw models status --check    # Exit 1 when missing/expired, 2 when expiring
openclaw models status --probe    # Live auth checks
```

`models status` shows OAuth expiry status (warns within 24h). JSON output includes `auth.oauth` and `auth.providers`.

### Set Model

```bash
openclaw models set <provider/model>
openclaw models set-image <provider/model>
```

### Aliases

```bash
openclaw models aliases list
openclaw models aliases add <alias> <provider/model>
openclaw models aliases remove <alias>
```

### Fallbacks

```bash
openclaw models fallbacks list
openclaw models fallbacks add <provider/model>
openclaw models fallbacks remove <provider/model>
openclaw models fallbacks clear

openclaw models image-fallbacks list
openclaw models image-fallbacks add <provider/model>
openclaw models image-fallbacks remove <provider/model>
openclaw models image-fallbacks clear
```

## Scanning (OpenRouter Free Models)

```bash
openclaw models scan
```

Inspects OpenRouter's free model catalog with optional probing for tool/image support.

Key flags:
- `--no-probe` — skip live probes (metadata only)
- `--min-params <b>` — minimum parameter size (billions)
- `--max-age-days <days>` — skip older models
- `--provider <name>` — provider filter
- `--set-default` — set primary model to first selection
- `--set-image` — set image model to first image selection

Results ranked by: image support → tool latency → context size → parameter count.

## Models Registry (`models.json`)

Custom providers in `models.providers` are written to `models.json` under the agent directory. Merge mode precedence:

1. Non-empty `baseUrl` in agent `models.json` wins
2. Non-empty `apiKey` wins (unless SecretRef-managed)
3. SecretRef-managed values are refreshed from source markers
4. Empty/missing values fall back to config `models.providers`

## Related

- [[model-providers]] — provider overview and auth setup
- [[model-failover]] — fallback chains and retry behavior
- [[environment]] — environment variables
- [[debugging]] — debugging model issues
- [[troubleshooting]] — troubleshooting guide
- [[faq-models]] — model FAQ
- [[faq-gateway]] — gateway FAQ
