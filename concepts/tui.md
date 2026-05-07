---
title: "Terminal UI (TUI)"
category: concepts
tags: [tui, terminal, chat, cli]
sources:
  - /opt/openclaw/data/workspace/refs/openclaw-docs/docs/web/tui.md
created: "2026-04-23T15:33:00Z"
updated: "2026-04-23T15:33:00Z"
summary: "Terminal-based UI for OpenClaw: gateway-connected and local modes, slash commands, keyboard shortcuts, and local shell integration."
provenance:
  extracted: 1.0
  inferred: 0.0
  ambiguous: 0.0
---

# Terminal UI (TUI)

The TUI is a terminal-based chat interface for OpenClaw. It can connect to a running Gateway or run locally in embedded mode.

## Quick Start

### Gateway Mode

```bash
openclaw gateway
openclaw tui
```

Remote Gateway:

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

Use `--password` for password auth. When `--url` is set, you **must** pass `--token` or `--password` explicitly — no fallback to config/env.

### Local Mode

```bash
openclaw chat
# or: openclaw tui --local
```

- `openclaw chat` and `openclaw terminal` are aliases for `openclaw tui --local`
- `--local` cannot be combined with `--url`, `--token`, or `--password`
- Uses embedded agent runtime; most local tools work but Gateway-only features are unavailable

## Interface

- **Header**: connection URL, current agent, current session
- **Chat log**: user messages, assistant replies, system notices, tool cards
- **Status line**: connecting / running / streaming / idle / error
- **Footer**: connection state + agent + session + model + think/fast/verbose/trace/reasoning + token counts + deliver
- **Input**: text editor with autocomplete

## Mental Model: Agents + Sessions

- Agents are unique slugs (e.g. `main`, `research`)
- Sessions belong to the current agent: `agent:<agentId>:<sessionKey>`
- `/session main` expands to `agent:<currentAgent>:main`
- Session scope: `per-sender` (default) or `global`

## Sending + Delivery

Messages are sent to Gateway; provider delivery is **off by default**.

Enable delivery:
- `/deliver on`
- Settings panel
- `openclaw tui --deliver`

## Keyboard Shortcuts

| Key | Action |
|---|---|
| Enter | Send message |
| Esc | Abort active run |
| Ctrl+C | Clear input (×2 to exit) |
| Ctrl+D | Exit |
| Ctrl+L | Model picker |
| Ctrl+G | Agent picker |
| Ctrl+P | Session picker |
| Ctrl+O | Toggle tool output expansion |
| Ctrl+T | Toggle thinking visibility |

## Slash Commands

### Core
- `/help`, `/status`
- `/agent <id>` (or `/agents`)
- `/session <key>` (or `/sessions`)
- `/model <provider/model>` (or `/models`)

### Session Controls
- `/think <off|minimal|low|medium|high>`
- `/fast <on|off>`, `/verbose <on|full|off>`
- `/trace <on|off>`, `/reasoning <on|off|stream>`
- `/usage <off|tokens|full>`
- `/elevated <on|off|ask|full>` (alias `/elev`)
- `/activation <mention|always>`
- `/deliver <on|off>`

### Session Lifecycle
- `/new` or `/reset`, `/abort`, `/settings`, `/exit`

### Local Mode Only
- `/auth [provider]` — opens provider auth/login inside TUI

Other Gateway slash commands (e.g. `/context`) are forwarded to Gateway.

## Local Shell Commands

Prefix with `!` to run local shell commands on the TUI host:

```
!openclaw config validate
```

- Prompts once per session to allow local execution
- Runs in fresh, non-interactive shell
- Env: `OPENCLAW_SHELL=tui-local`
- A lone `!` is sent as normal text; leading spaces don't trigger exec

## Repair Configs from Local TUI

Use `openclaw chat` when config validates but you want an agent to compare against docs:

1. `openclaw chat`
2. Ask: "Compare my gateway auth config with the docs"
3. Use `!openclaw config file`, `!openclaw docs <query>`, `!openclaw config validate`
4. Apply narrow fixes with `openclaw config set` or `openclaw configure`
5. `!openclaw doctor --fix` for automatic migrations

## Tool Output

Tool calls show as cards with args + results. `Ctrl+O` toggles collapsed/expanded. Partial updates stream into the same card.

## Terminal Colors

- Assistant body text uses terminal default foreground (readable in dark/light)
- Light backgrounds: `OPENCLAW_THEME=light`
- Force dark palette: `OPENCLAW_THEME=dark`

## History + Streaming

- On connect: loads latest 200 messages (configurable via `--history-limit`)
- Streaming responses update in place
- Listens to agent tool events for richer tool cards

## Connection

- Registers with Gateway as `mode: "tui"`
- Reconnects show a system message; event gaps surfaced in log

## Options Reference

| Flag | Description |
|---|---|
| `--local` | Local embedded agent |
| `--url <url>` | Gateway WebSocket URL |
| `--token <token>` | Gateway token |
| `--password <password>` | Gateway password |
| `--session <key>` | Session key (default: `main`) |
| `--deliver` | Deliver replies to provider |
| `--thinking <level>` | Override thinking level |
| `--message <text>` | Send initial message |
| `--timeout-ms <ms>` | Agent timeout |
| `--history-limit <n>` | History entries (default 200) |

## Troubleshooting

**No output after sending:**
1. `/status` — confirm Gateway connected and idle/busy
2. `openclaw logs --follow` — check Gateway logs
3. `openclaw status`, `openclaw models status` — confirm agent can run
4. Enable delivery if expecting channel replies

**Connection issues:**
- `disconnected`: verify URL/token/password
- No agents in picker: `openclaw agents list`
- Empty session picker: might be global scope or no sessions yet

## Related

- [[webchat|WebChat]] — native WebChat UI
- [[control-ui|Control UI]] — browser-based Control UI
- [[web|Web Surfaces]] — gateway bind modes and security
- [[dashboard|Dashboard]] — dashboard access and auth
- [[debugging|Debugging OpenClaw]] — debugging tools
- [[environment|Environment Variables]] — env vars and precedence
- [[troubleshooting|Troubleshooting OpenClaw]] — symptom-first guide
