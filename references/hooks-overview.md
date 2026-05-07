---
title: "Hooks"
summary: "Overview of event-driven automation hooks: event types, hook structure, discovery, and bundled hooks"
category: references
tags:
  - openclaw
  - automation
  - hooks
  - events
sources:
  - /opt/openclaw/data/workspace/refs/openclaw-docs/docs/automation/hooks.md
provenance: extracted
---

# Hooks

Hooks are small scripts that run when something happens inside the Gateway. They can be discovered from directories and inspected with `openclaw hooks`. The Gateway loads internal hooks only after you enable hooks or configure at least one hook entry, hook pack, legacy handler, or extra hook directory.

There are two kinds of hooks in OpenClaw:

- **Internal hooks** (this page): run inside the Gateway when agent events fire, like `/new`, `/reset`, `/stop`, or lifecycle events.
- **Webhooks**: external HTTP endpoints that let other systems trigger work in OpenClaw. See [[cron-webhooks|Cron: Webhooks]].

Hooks can also be bundled inside plugins. `openclaw hooks list` shows both standalone hooks and plugin-managed hooks.

## Quick Start

```bash
# List available hooks
openclaw hooks list

# Enable a hook
openclaw hooks enable session-memory

# Check hook status
openclaw hooks check

# Get detailed information
openclaw hooks info session-memory
```

## Event Types

| Event                    | When it fires                                    |
| ------------------------ | ------------------------------------------------ |
| `command:new`            | `/new` command issued                            |
| `command:reset`          | `/reset` command issued                          |
| `command:stop`           | `/stop` command issued                           |
| `command`                | Any command event (general listener)             |
| `session:compact:before` | Before compaction summarizes history             |
| `session:compact:after`  | After compaction completes                       |
| `session:patch`          | When session properties are modified             |
| `agent:bootstrap`        | Before workspace bootstrap files are injected    |
| `gateway:startup`        | After channels start and hooks are loaded        |
| `message:received`       | Inbound message from any channel                 |
| `message:transcribed`    | After audio transcription completes              |
| `message:preprocessed`   | After all media and link understanding completes |
| `message:sent`           | Outbound message delivered                       |

## Hook Discovery

Hooks are discovered from these directories, in order of increasing override precedence:

1. **Bundled hooks**: shipped with OpenClaw
2. **Plugin hooks**: hooks bundled inside installed plugins
3. **Managed hooks**: `~/.openclaw/hooks/` (user-installed, shared across workspaces). Extra directories from `hooks.internal.load.extraDirs` share this precedence.
4. **Workspace hooks**: `<workspace>/hooks/` (per-agent, disabled by default until explicitly enabled)

Workspace hooks can add new hook names but cannot override bundled, managed, or plugin-provided hooks with the same name.

## Bundled Hooks

| Hook                  | Events                         | What it does                                          |
| --------------------- | ------------------------------ | ----------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | Saves session context to `<workspace>/memory/`        |
| bootstrap-extra-files | `agent:bootstrap`              | Injects additional bootstrap files from glob patterns |
| command-logger        | `command`                      | Logs all commands to `~/.openclaw/logs/commands.log`  |
| boot-md               | `gateway:startup`              | Runs `BOOT.md` when the gateway starts                |

Enable any bundled hook:
```bash
openclaw hooks enable <hook-name>
```

## Configuration

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "session-memory": { "enabled": true },
        "command-logger": { "enabled": false }
      }
    }
  }
}
```

## Best Practices

- **Keep handlers fast.** Hooks run during command processing. Fire-and-forget heavy work with `void processInBackground(event)`.
- **Handle errors gracefully.** Wrap risky operations in try/catch; do not throw so other handlers can run.
- **Filter events early.** Return immediately if the event type/action is not relevant.
- **Use specific event keys.** Prefer `"events": ["command:new"]` over `"events": ["command"]` to reduce overhead.

## Related Pages

- [[hooks-writing|Writing Hooks]] — hook structure, metadata, handler implementation, and event context
- [[hooks-cli|Hooks CLI Reference]] — CLI commands for listing, checking, enabling, disabling hooks
- [[cron-webhooks|Cron: Webhooks]] — HTTP webhook endpoints for external triggers
