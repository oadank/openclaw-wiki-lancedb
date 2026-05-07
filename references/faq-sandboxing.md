---
title: "FAQ: Sandboxing and Memory"
summary: "Sandboxing configuration, Docker setup, and how OpenClaw memory works"
category: references
tags:
  - openclaw
  - faq
  - sandboxing
  - memory
sources:
  - /opt/openclaw/data/workspace/refs/openclaw-docs/docs/help/faq.md
provenance:
  extracted: 0.85
  inferred: 0.15
  ambiguous: 0.0
---

# FAQ: Sandboxing and Memory

Answers about sandboxing configuration, Docker setup, and memory management.

## Sandboxing

### Dedicated Sandboxing Documentation

See [[sandboxing|Sandboxing]] for full documentation. For Docker-specific setup, see [[docker-install|Docker Installation]].

### Docker: Enabling Full Features

The default Docker image is security-first and runs as the `node` user, so it does not include system packages, Homebrew, or bundled browsers. For a fuller setup:

- **Persist home:** Set `OPENCLAW_HOME_VOLUME` so caches survive
- **Bake system deps:** Use `OPENCLAW_DOCKER_APT_PACKAGES`
- **Install Playwright browsers:** `node /app/node_modules/playwright-core/cli.js install chromium`
- **Set Playwright path:** Set `PLAYWRIGHT_BROWSERS_PATH` and ensure the path is persisted

### Sandboxing by Session Type

You can keep DMs personal but make groups public/sandboxed with one agent:

Use `agents.defaults.sandbox.mode: "non-main"` so group/channel sessions (non-main keys) run in the configured sandbox backend, while the main DM session stays on-host. Docker is the default backend if you do not choose one.

Restrict tools in sandboxed sessions via `tools.sandbox.tools`.

### Binding Host Folders into the Sandbox

Set `agents.defaults.sandbox.docker.binds` to `["host:path:mode"]` (e.g., `"/home/user/src:/src:ro"`). Global + per-agent binds merge; per-agent binds are ignored when `scope: "shared"`. Use `:ro` for anything sensitive.

## Memory

### How Memory Works

OpenClaw memory is just Markdown files in the agent workspace:

- **Daily notes:** `memory/YYYY-MM-DD.md`
- **Curated long-term notes:** `MEMORY.md` (main/private sessions only)

OpenClaw runs a **silent pre-compaction memory flush** to remind the model to write durable notes before auto-compaction. This only runs when the workspace is writable (read-only sandboxes skip it).

### Making Memory Stick

Ask the bot to **write the fact to memory**:
- Long-term notes belong in `MEMORY.md`
- Short-term context goes into `memory/YYYY-MM-DD.md`

Verify the Gateway is using the same workspace on every run.

### Memory Persistence and Limits

Memory files live on disk and persist until deleted. The limit is your storage, not the model. The **session context** is still limited by the model context window, so long conversations can compact or truncate. Memory search pulls only relevant parts back into context.

### Semantic Memory Search Providers

Semantic memory search supports multiple providers:

- **OpenAI embeddings** — requires `OPENAI_API_KEY`
- **Gemini embeddings** — requires `GEMINI_API_KEY`
- **Voyage embeddings** — requires Voyage API key
- **Mistral embeddings** — requires Mistral API key
- **Ollama** — requires `memorySearch.provider = "ollama"`
- **Local** — set `memorySearch.provider = "local"` (no API key needed)

Auto-selection prefers OpenAI → Gemini → Voyage → Mistral → local. If no remote key is available, memory search stays disabled until configured.

## Related

- [[sandboxing|Sandboxing]] — full sandbox documentation
- [[memory|Memory]] — memory system documentation
- [[docker-install|Docker Installation]] — Docker-specific setup
