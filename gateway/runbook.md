---
title: "Gateway Runbook"
summary: "Day-1 startup and day-2 operations guide for the OpenClaw Gateway service"
read_when:
  - Running or debugging the gateway process
category: gateway
tags: [gateway, operations, startup]
sources:
  - /opt/openclaw/data/workspace/refs/openclaw-docs/docs/gateway/index.md
  - /opt/openclaw/data/workspace/refs/openclaw-docs/docs/gateway/configuration.md
---

# Gateway Runbook

Operational guide for starting, verifying, and managing the OpenClaw Gateway service.

## 5-Minute Startup

```bash
# Start the gateway
openclaw gateway --port 18789
# With debug output
openclaw gateway --port 18789 --verbose
# Force-kill existing listener on port, then start
openclaw gateway --force
```

## Verify Health

```bash
openclaw gateway status                    # Basic status
openclaw gateway status --require-rpc      # RPC-level proof
openclaw status                            # Full local summary
openclaw logs --follow                     # Live log tail
openclaw channels status --probe           # Live channel probes
```

Healthy baseline:
- `Runtime: running`
- `Connectivity probe: ok`
- `Capability:` matches expected features

## Runtime Model

The Gateway is a single always-on process serving:
- **WebSocket** control plane + RPC
- **HTTP APIs** — OpenAI-compatible (`/v1/models`, `/v1/chat/completions`, `/v1/responses`, `/v1/embeddings`, `/tools/invoke`)
- **Control UI** — browser-based management interface

Default bind mode is `loopback`. Auth is required by default (shared-secret via `gateway.auth.token` or `gateway.auth.password`).

## Port & Bind Precedence

| Setting | Resolution order |
|---------|-----------------|
| Port | `--port` → `OPENCLAW_GATEWAY_PORT` → `gateway.port` → `18789` |
| Bind | CLI override → `gateway.bind` → `loopback` |

## Hot Reload Modes

| `gateway.reload.mode` | Behavior |
|----------------------|----------|
| `off` | No config reload |
| `hot` | Apply only hot-safe changes |
| `restart` | Restart on any config change |
| `hybrid` (default) | Hot-apply when safe, restart when required |

## Operator Commands

```bash
openclaw gateway status
openclaw gateway status --deep     # Adds system-level service scan
openclaw gateway status --json
openclaw gateway install           # Install as system service
openclaw gateway restart
openclaw gateway stop
openclaw secrets reload            # Re-resolve SecretRefs
openclaw logs --follow
openclaw doctor                    # Health + repair
```

## Supervision

- **macOS (launchd):** `openclaw gateway install` → Label: `ai.openclaw.gateway`
- **Linux (systemd user):** `openclaw gateway install` → `systemctl --user enable --now openclaw-gateway.service`
  - Enable lingering: `sudo loginctl enable-linger <user>`
- **Windows:** Native Scheduled Task `OpenClaw Gateway`
- **Linux (system service):** Install under `/etc/systemd/system/openclaw-gateway.service`

## Protocol Quick Reference

1. First client frame must be `connect`
2. Gateway returns `hello-ok` with snapshot (presence, health, stateVersion, uptimeMs, limits/policy)
3. Requests: `req(method, params)` → `res(ok/payload|error)`
4. Agent runs are two-stage: immediate ack → final completion with streamed events

## Common Failure Signatures

| Signature | Likely issue |
|-----------|-------------|
| `refusing to bind gateway ... without auth` | Non-loopback bind without valid auth |
| `EADDRINUSE` / `another gateway instance already listening` | Port conflict |
| `Gateway start blocked: set gateway.mode=local` | Config in remote mode or missing gateway.mode |
| `unauthorized` during connect | Auth mismatch between client and gateway |

## Multiple Gateways

Most setups run one Gateway per machine. Multiple gateways need:
- Unique `gateway.port`
- Unique `OPENCLAW_CONFIG_PATH`
- Unique `OPENCLAW_STATE_DIR`
- Unique `agents.defaults.workspace`

See [[gateway/multiple-gateways]] for details.

## Related

- [[gateway/troubleshooting]] — deep diagnostic runbook
- [[gateway/configuration]] — task-oriented config guide
- [[gateway/protocol]] — WebSocket protocol spec
- [[gateway/health]] — health check commands
- [[gateway/doctor]] — repair & migration tool
