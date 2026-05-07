---
title: "Dashboard (Control UI)"
category: concepts
tags: [web, control-ui, dashboard, auth, security]
sources:
  - /opt/openclaw/data/workspace/refs/openclaw-docs/docs/web/dashboard.md
created: "2026-04-23T15:33:00Z"
updated: "2026-04-23T15:33:00Z"
summary: "Gateway dashboard access, authentication modes, and troubleshooting — the browser Control UI served by the Gateway."
provenance:
  extracted: 1.0
  inferred: 0.0
  ambiguous: 0.0
---

# Dashboard (Control UI)

The Gateway dashboard is the browser Control UI served at `/` by default (override with `gateway.controlUi.basePath`). See [[control-ui|Control UI (Browser)]] for full feature details.

## Quick Access

```bash
openclaw dashboard
```

This command copies the link, opens the browser if possible, and shows SSH hints for headless servers. After onboarding, it auto-opens a clean (non-tokenized) link.

## Authentication

Auth is enforced at the WebSocket handshake:

| Mode | Config | Notes |
|---|---|---|
| Shared-secret token | `gateway.auth.token` or `OPENCLAW_GATEWAY_TOKEN` | Wizard generates by default |
| Shared-secret password | `gateway.auth.password` or `OPENCLAW_GATEWAY_PASSWORD` | Dashboard does not persist passwords across reloads |
| Tailscale Serve | `gateway.auth.allowTailscale: true` | Identity headers satisfy auth; no token needed |
| Trusted-proxy | `gateway.auth.mode: "trusted-proxy"` | Identity-aware reverse proxy |

- `openclaw dashboard` passes token via URL **fragment** for one-time bootstrap (stored in sessionStorage, not localStorage).
- If token is SecretRef-managed, `openclaw dashboard` prints a non-tokenized URL by design (avoids exposing tokens in logs/clipboard).

## If You See "Unauthorized" / 1008

1. Ensure the gateway is reachable:
   - Local: `openclaw status`
   - Remote: `ssh -N -L 18789:127.0.0.1:18789 user@host`, then `http://127.0.0.1:18789/`
2. For `AUTH_TOKEN_MISMATCH`: clients may retry once with cached device token; if still failing, resolve token drift manually.
3. Connect auth precedence: shared token/password → explicit `deviceToken` → stored device token → bootstrap token.
4. Retrieve shared secret:
   - Token: `openclaw config get gateway.auth.token`
   - Password: resolve configured password env var
   - SecretRef: resolve external secret or export `OPENCLAW_GATEWAY_TOKEN`
   - No secret: `openclaw doctor --generate-gateway-token`
5. Paste into dashboard settings and connect.

Language picker: **Overview → Gateway Access → Language** (in access card, not Appearance).

## Security Note

The Control UI is an **admin surface** (chat, config, exec approvals). Do not expose it publicly. Prefer localhost, Tailscale Serve, or an SSH tunnel. See [[web|Web Surfaces]] for bind mode options.

## Related

- [[control-ui|Control UI (Browser)]] — full capabilities and usage
- [[web|Web Surfaces]] — bind modes and security
- [[troubleshooting|Troubleshooting OpenClaw]] — symptom-first guide
- [[faq-gateway|FAQ: Gateway]] — gateway Q&A
