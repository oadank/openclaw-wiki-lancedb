---
title: "Debugging OpenClaw"
summary: "Debugging tools: watch mode, raw model streams, runtime overrides, and dev profile for isolated debugging"
category: concepts
tags:
  - openclaw
  - debugging
  - development
sources:
  - /opt/openclaw/data/workspace/refs/openclaw-docs/docs/help/debugging.md
provenance:
  extracted: 0.85
  inferred: 0.15
  ambiguous: 0.0
---

# Debugging

Covers debugging helpers for streaming output, runtime overrides, and development workflows.

## Runtime Debug Overrides

Use `/debug` in chat to set **runtime-only** config overrides (memory, not disk). Disabled by default; enable with `commands.debug: true`.

### Commands

- `/debug show` — display current overrides
- `/debug set messages.responsePrefix="[openclaw]"` — set an override
- `/debug unset messages.responsePrefix` — remove an override
- `/debug reset` — clear all overrides and return to on-disk config

## Session Trace Output

Use `/trace` to see plugin-owned trace/debug lines in one session without full verbose mode.

- `/trace` or `/trace on` — enable trace for current session
- `/trace off` — disable trace

Use `/trace` for plugin diagnostics. Keep using `/verbose` for normal verbose output.

## Gateway Watch Mode

Run the gateway under a file watcher for fast iteration:

```bash
pnpm gateway:watch
# Maps to: node scripts/watch-node.mjs gateway --force
```

The watcher restarts on:
- Build-relevant files under `src/`
- Extension source files
- Extension `package.json` and `openclaw.plugin.json`
- `tsconfig.json`, `package.json`, `tsdown.config.ts`

Extension metadata changes restart the gateway without forcing a rebuild; source and config changes rebuild `dist` first.

## Dev Profile

Use `--dev` to isolate state and spin up a safe, disposable setup for debugging.

### Two --dev Flags

- **Global `--dev` (profile):** isolates state under `~/.openclaw-dev`, defaults gateway port to `19001`
- **`gateway --dev`:** auto-creates default config + workspace when missing

### Recommended Flow

```bash
pnpm gateway:dev
OPENCLAW_PROFILE=dev openclaw tui
```

### Profile Isolation Details

- `OPENCLAW_PROFILE=dev`
- `OPENCLAW_STATE_DIR=~/.openclaw-dev`
- `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
- `OPENCLAW_GATEWAY_PORT=19001`

### Dev Bootstrap

Writes minimal config, sets `agent.workspace` to dev workspace, seeds workspace files (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`), default identity is **C3-PO**.

### Reset Flow

```bash
pnpm gateway:dev:reset
# Wipes config, credentials, sessions, and dev workspace using trash (not rm)
```

Stop a running non-dev gateway first:

```bash
openclaw gateway stop
```

## Raw Stream Logging

OpenClaw can log the **raw assistant stream** before any filtering/formatting — best way to see whether reasoning is arriving as plain text deltas.

### Enable via CLI

```bash
pnpm gateway:watch --raw-stream
```

### Environment Variables

- `OPENCLAW_RAW_STREAM=1`
- `OPENCLAW_RAW_STREAM_PATH=~/.openclaw/logs/raw-stream.jsonl`

Default file: `~/.openclaw/logs/raw-stream.jsonl`

### Raw Chunk Logging (pi-mono)

- `PI_RAW_STREAM=1`
- `PI_RAW_STREAM_PATH=~/.pi-mono/logs/raw-openai-completions.jsonl`

## Safety Notes

- Raw stream logs can include full prompts, tool output, and user data
- Keep logs local and delete after debugging
- Scrub secrets and PII before sharing logs

## Related

- [[environment|Environment Variables]] — env var loading and precedence
- [[troubleshooting|Troubleshooting]] — symptom-first debugging guide
- [[faq-debugging|FAQ: Debugging]] — common debugging questions
- [[diagnostics-flags|Diagnostics Flags]] — targeted debug log flags for subsystem-specific logging
