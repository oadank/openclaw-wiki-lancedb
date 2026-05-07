---
title: "Control UI (Browser)"
category: concepts
tags: [web, control-ui, browser, gateway]
sources:
  - /opt/openclaw/data/workspace/refs/openclaw-docs/docs/web/control-ui.md
  - /opt/openclaw/data/workspace/refs/openclaw-docs/docs/web/index.md
created: "2026-04-23T15:33:00Z"
updated: "2026-04-23T15:33:00Z"
summary: "Browser-based Control UI for OpenClaw Gateway: Vite+Lit SPA served on the same port as the Gateway WebSocket, supporting chat, config, cron, skills, nodes, exec approvals, and debugging."
provenance:
  extracted: 1.0
  inferred: 0.0
  ambiguous: 0.0
---

# Control UI (Browser)

The Control UI is a small **Vite + Lit** single-page app served by the Gateway on the same port as the Gateway WebSocket:

- Default URL: `http://<host>:18789/`
- Optional prefix: `gateway.controlUi.basePath` (e.g. `/openclaw`)

It communicates directly with the Gateway WebSocket. See [[web|Web (Gateway)]] for bind modes and access patterns.

## Access

**Local**: `http://127.0.0.1:18789/` — auto-approved for loopback.

**Remote (Tailnet)**: Use Tailscale Serve for HTTPS (`https://<magicdns>/`) or tailnet bind with token. See [[web|Web (Gateway)]] for details.

**Device pairing**: New browser/device connections require one-time approval:

```bash
openclaw devices list              # List pending requests
openclaw devices approve <requestId>  # Approve
```

Each browser profile generates a unique device ID. Switching browsers or clearing data requires re-pairing.

## Auth

Auth at WebSocket handshake:

| Method | Config |
|---|---|
| Shared-secret token | `connect.params.auth.token` |
| Shared-secret password | `connect.params.auth.password` |
| Tailscale Serve identity | `gateway.auth.allowTailscale: true` |
| Trusted-proxy identity | `gateway.auth.mode: "trusted-proxy"` |

The dashboard settings panel keeps a token for the current browser tab session; passwords are not persisted.

## Capabilities

| Area | Features |
|---|---|
| **Chat** | `chat.send` (non-blocking), `chat.history` (size-bounded), `chat.abort`, `chat.inject`. Stream tool calls + live output. |
| **Channels** | Status, QR login, per-channel config |
| **Instances** | Presence list + refresh |
| **Sessions** | List + per-session model/thinking/fast/verbose/trace/reasoning overrides |
| **Dreams** | Status, enable/disable, Dream Diary |
| **Cron Jobs** | List/add/edit/run/enable/disable + run history |
| **Skills** | Status, enable/disable, install, API key updates |
| **Nodes** | List + caps |
| **Exec Approvals** | Edit allowlists + ask policy |
| **Config** | View/edit `openclaw.json` with base-hash guard, `config.apply` + restart, schema + form rendering |
| **Debug** | Status/health/models snapshots, event log, manual RPC |
| **Logs** | Live tail with filter/export |
| **Update** | Package/git update + restart |

## Chat Behavior

- `chat.send` is non-blocking: acks immediately, response streams via events
- Idempotency via `idempotencyKey`
- History is size-bounded for UI safety
- `chat.inject` appends assistant notes without agent run
- Stop: click Stop button or type `/stop`
- Aborted runs retain partial assistant text in UI

## Hosted Embeds

Assistant messages can render `[embed ...]` shortcodes inline. Sandbox policy:

- `strict` — no scripts
- `scripts` (default) — allows interactive embeds with origin isolation
- `trusted` — adds `allow-same-origin`

External `http(s)` embed URLs blocked by default; enable with `gateway.controlUi.allowExternalEmbedUrls: true`.

## Security

- Content Security Policy: `img-src` limited to same-origin + `data:` URLs
- Avatar route requires same gateway token
- Insecure HTTP (non-secure context) blocks WebCrypto; requires device identity
- `allowInsecureAuth` — localhost-only toggle for non-secure HTTP
- `dangerouslyDisableDeviceAuth` — severe security downgrade

## Language Support

Locale picker: **Overview → Gateway Access → Language** (in Gateway Access card, not Appearance).

Locales: `en`, `zh-CN`, `zh-TW`, `pt-BR`, `de`, `es`, `ja-JP`, `ko`, `fr`, `tr`, `uk`, `id`, `pl`. Non-English translations lazy-loaded.

## Building

```bash
pnpm ui:build          # Build static files
pnpm ui:dev            # Dev server (localhost:5173)
```

Dev server + remote Gateway: `http://localhost:5173/?gatewayUrl=ws://<host>:18789`

Token via URL fragment (`#token=...`) avoids server logging.

## Cron Jobs Panel

- Isolated jobs: delivery defaults to announce summary
- Webhook mode: `delivery.mode = "webhook"` with `delivery.to` as HTTP(S) URL
- Inline form validation; invalid values disable save
- `cron.webhookToken` for bearer token on webhooks
- Advanced: delete-after-run, agent overrides, best-effort delivery

## Related

- [[web|Web (Gateway)]] — bind modes, security, webhooks
- [[dashboard|Dashboard]] — gateway dashboard access and auth
- [[webchat|WebChat]] — native WebChat interface
- [[debugging|Debugging OpenClaw]] — debugging tools
- [[environment|Environment Variables]] — env var loading
- [[troubleshooting|Troubleshooting OpenClaw]] — symptom-first guide
