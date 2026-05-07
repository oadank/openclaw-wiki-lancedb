---
title: "WebChat (Gateway WebSocket UI)"
category: concepts
tags: [web, chat, gateway, websocket]
sources:
  - /opt/openclaw/data/workspace/refs/openclaw-docs/docs/web/webchat.md
created: "2026-04-23T15:33:00Z"
updated: "2026-04-23T15:33:00Z"
summary: "Native WebChat UI for the Gateway — a macOS/iOS SwiftUI chat interface that talks directly to the Gateway WebSocket using the same sessions and routing as other channels."
provenance:
  extracted: 1.0
  inferred: 0.0
  ambiguous: 0.0
---

# WebChat (Gateway WebSocket UI)

## What it is

A native chat UI for the Gateway (macOS/iOS SwiftUI app):

- No embedded browser, no local static server
- Uses the same sessions and routing rules as other channels
- Deterministic routing: replies always go back to WebChat

## Quick Start

1. Start the Gateway
2. Open WebChat UI or Control UI chat tab
3. Ensure valid Gateway auth is configured (shared-secret by default, even on loopback)

## How it Works

The UI connects to the Gateway WebSocket using `chat.history`, `chat.send`, and `chat.inject`.

- `chat.history` is bounded for stability — Gateway may truncate long text fields, omit heavy metadata, and replace oversized entries with `[chat.history omitted: message too large]`
- `chat.history` strips inline delivery directive tags (`[[reply_to_*]]`, `[[audio_as_voice]]`), plain-text tool-call XML payloads, and leaked control tokens
- Entries whose visible text is only `NO_REPLY` / `no_reply` are omitted
- `chat.inject` appends an assistant note directly to the transcript (no agent run, no channel delivery)
- Aborted runs can keep partial assistant output visible; Gateway persists aborted partial text with abort metadata
- History is always fetched from the Gateway (no local file watching)
- If the Gateway is unreachable, WebChat is read-only

## Control UI Agents Tools Panel

The `/agents` Tools panel has two separate views:

- **Available Right Now**: `tools.effective(sessionKey=...)` — shows what the current session can use at runtime (core, plugin, channel-owned tools)
- **Tool Configuration**: `tools.catalog` — focused on profiles, overrides, and catalog semantics

Runtime availability is session-scoped — switching sessions on the same agent can change the list.

## Remote Use

Remote mode tunnels the Gateway WebSocket over SSH/Tailscale. No separate WebChat server needed.

## Configuration

| Option | Description |
|---|---|
| `gateway.webchat.chatHistoryMaxChars` | Max character count for text fields in `chat.history` |
| `gateway.port`, `gateway.bind` | WebSocket host/port |
| `gateway.auth.mode/token/password` | Shared-secret WebSocket auth |
| `gateway.auth.allowTailscale` | Allow Tailscale Serve identity headers |
| `gateway.auth.mode: "trusted-proxy"` | Reverse-proxy auth for non-loopback identity-aware proxy |
| `gateway.remote.*` | Remote Gateway target |
| `session.*` | Session storage and main key defaults |

See [[faq-gateway|FAQ: Gateway]] and [[environment|Environment Variables]] for related configuration.

## Related

- [[control-ui|Control UI (Browser)]] — full browser Control UI
- [[web|Web (Gateway)]] — web surfaces overview
- [[dashboard|Dashboard]] — dashboard access and auth
- [[tui|TUI]] — terminal user interface
- [[faq-gateway|FAQ: Gateway]] — gateway configuration Q&A
- [[troubleshooting|Troubleshooting OpenClaw]] — symptom-first troubleshooting
- [[debugging|Debugging OpenClaw]] — debugging tools
