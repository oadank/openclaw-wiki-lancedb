---
title: "Web Surfaces (Gateway)"
category: concepts
tags: [web, gateway, control-ui, security]
sources:
  - /opt/openclaw/data/workspace/refs/openclaw-docs/docs/web/index.md
created: "2026-04-23T15:33:00Z"
updated: "2026-04-23T15:33:00Z"
summary: "Gateway web surfaces: Control UI, webhooks, bind modes (loopback, tailnet, funnel), Tailscale access patterns, and security notes."
provenance:
  extracted: 1.0
  inferred: 0.0
  ambiguous: 0.0
---

# Web Surfaces (Gateway)

The Gateway serves a small **browser Control UI** (Vite + Lit) from the same port as the Gateway WebSocket:

- Default: `http://<host>:18789/`
- Optional prefix: `gateway.controlUi.basePath` (e.g. `/openclaw`)

This page covers bind modes, security, and web-facing surfaces. Capabilities live in [[control-ui|Control UI]].

## Config (default-on)

Control UI is **enabled by default** when assets are present (`dist/control-ui`):

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" },
  },
}
```

## Webhooks

When `hooks.enabled=true`, the Gateway exposes a small webhook endpoint on the same HTTP server. See [[hooks-overview|Hooks]] for details.

## Tailscale Access

### Integrated Serve (recommended)

Keep Gateway on loopback, let Tailscale Serve proxy it:

```json5
{
  gateway: { bind: "loopback", tailscale: { mode: "serve" } },
}
```

Open: `https://<magicdns>/`

### Tailnet bind + token

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

Open: `http://<tailscale-ip>:18789/`

### Public internet (Funnel)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password" },
  },
}
```

## Security Notes

- Gateway auth is required by default (token, password, trusted-proxy, or Tailscale Serve identity headers).
- Non-loopback binds still **require** gateway auth.
- For non-loopback Control UI deployments, set `gateway.controlUi.allowedOrigins` explicitly — startup refused without it.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` is a dangerous security downgrade.
- With Serve, Tailscale identity headers can satisfy Control UI/WebSocket auth when `gateway.auth.allowTailscale` is `true` (no token/password needed). HTTP API endpoints do not use those headers.
- `gateway.tailscale.mode: "funnel"` requires `gateway.auth.mode: "password"`.
- The wizard creates shared-secret auth by default and usually generates a gateway token.

## Building the UI

```bash
pnpm ui:build
```

Static files served from `dist/control-ui`.

## Related

- [[control-ui|Control UI]] — full browser Control UI capabilities
- [[dashboard|Dashboard]] — dashboard access and auth troubleshooting
- [[webchat|WebChat]] — native WebChat interface
- [[tui|TUI]] — terminal user interface
- [[hooks-overview|Hooks]] — webhook endpoint details
- [[troubleshooting|Troubleshooting OpenClaw]] — symptom-first troubleshooting
- [[debugging|Debugging OpenClaw]] — debugging tools
- [[environment|Environment Variables]] — env var loading
