---
title: "Hooks"
category: concepts
tags: [automation, events]
summary: "Event-driven automation for commands and lifecycle events in the Gateway"
sources: ["/opt/openclaw/data/workspace/refs/openclaw-docs/docs/automation/hooks.md"]
updated: "2026-04-23T10:00:00Z"
provenance:
  extracted: 0.85
  inferred: 0.15
  ambiguous: 0.0
---

# Hooks

Hooks are small scripts that run when something happens inside the [[gateway|Gateway]]. Two kinds exist:

- **Internal hooks** — run inside the Gateway on agent lifecycle events
- **Webhooks** — external HTTP endpoints for triggering work from outside systems (see [[cron|Scheduled Tasks]])

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

| Event                    | When it fires                                  |
| ------------------------ | --------------------------------------------- |
| `command:new`            | `/new` command issued                         |
| `command:reset`          | `/reset` command issued                        |
| `command:stop`           | `/stop` command issued                         |
| `command`                | Any command event (general listener)          |
| `session:compact:before` | Before compaction summarizes history          |
| `session:compact:after`  | After compaction completes                    |
| `session:patch`          | When session properties are modified          |
| `agent:bootstrap`        | Before workspace bootstrap files are injected |
| `gateway:startup`        | After channels start and hooks are loaded      |
| `message:received`       | Inbound message from any channel              |
| `message:sent`           | Outbound message to any channel               |
| `agent:error`            | Agent error during a turn                     |
| `agent:end`              | Agent turn completed                          |
| `tool:before`            | Before a tool call executes                   |
| `tool:after`             | After a tool call completes                   |
| `tool:error`             | Tool call failed                              |

## Hook Packs

Hook packs are bundles of related hooks managed together:

| Pack       | Description                                      |
| ---------- | ------------------------------------------------ |
| `session-memory` | Tracks context across sessions              |
| `session-summary` | Generates summaries on session events     |
| `auto-invite` | Handles DM pairing and invites             |

## Hook Development

Hooks are discovered from directories and can be inspected with `openclaw hooks`. The Gateway loads internal hooks only after you enable hooks or configure at least one hook entry, hook pack, legacy handler, or extra hook directory.

## Related

- [[automation|Automation & Tasks]] — all automation mechanisms at a glance
- [[cron|Scheduled Tasks]] — [[webhook|webhooks]] for external triggers
- [[gateway|Gateway]] — the OpenClaw gateway process
