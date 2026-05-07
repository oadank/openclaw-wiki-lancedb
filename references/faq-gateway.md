---
title: "FAQ: Gateway"
summary: "Gateway ports, daemon management, remote mode, and connection troubleshooting"
category: references
tags:
  - openclaw
  - faq
  - gateway
sources:
  - /opt/openclaw/data/workspace/refs/openclaw-docs/docs/help/faq.md
provenance:
  extracted: 0.85
  inferred: 0.15
  ambiguous: 0.0
---

# FAQ: Gateway

Answers about gateway configuration, remote access, daemon management, and connection issues.

## Gateway Basics

The **Gateway** is the always-on control plane of OpenClaw. It runs on your hardware (Mac, Linux, VPS, Raspberry Pi) and handles:

- Channel connections (WhatsApp, Telegram, Discord, etc.)
- Session management and memory
- Tool execution and orchestration
- Authentication and authorization

## Default Gateway Port

By default, the Gateway runs on port **18789** for non-dev environments. Dev mode uses port **19001** by default.

### Changing the Port

Set `gateway.port` in `openclaw.json`:

```json5
{
  gateway: {
    port: 8080,
  },
}
```

Or via environment variable:
`OPENCLAW_GATEWAY_PORT=8080`

## Gateway: "Already Running" Error

If you get a port conflict or "address already in use" error:

1. Check if the Gateway is already running:
   ```bash
   openclaw gateway status
   ```

2. Stop the running Gateway:
   ```bash
   openclaw gateway stop
   ```

3. If that doesn't work, kill the process directly:
   ```bash
   lsof -i :18789 | grep LISTEN | awk '{print $2}' | xargs kill -9
   ```

## Remote Gateways and Nodes

The Gateway can run on a remote machine (VPS, server) and be accessed from other devices.

### Accessing the Gateway Remotely

#### Recommended: Tailscale Serve

- Keep Gateway bound to loopback (127.0.0.1)
- Run: `openclaw gateway --tailscale serve`
- Open `https://<magicdns>/` — Tailscale handles authentication

#### SSH Tunnel

```bash
ssh -N -L 18789:127.0.0.1:18789 user@remote-host
```

Then open `http://127.0.0.1:18789/` locally.

#### Direct Access

If exposing directly, **always enable authentication**:

```bash
openclaw gateway --bind 0.0.0.0 --token "<your-secret-token>"
```

## Nodes

Nodes are local devices (laptop, phone, desktop) that pair with a remote Gateway to provide:

- Local screen capture
- Camera access
- Canvas interaction
- Command execution on the local machine
- Browser automation

### Pairing a Node

```bash
openclaw nodes pair <gateway-url>
```

## Dashboard Access

### How to Open the Dashboard After Onboarding

The wizard opens your browser with a clean (non-tokenized) dashboard URL right after onboarding and also prints the link in the summary. Keep that tab open; if it didn't launch, copy/paste the printed URL on the same machine.

### Authenticating the Dashboard on Localhost vs Remote

**Localhost (same machine):**
- Open `http://127.0.0.1:18789/`
- If prompted, paste the token from `gateway.auth.token` or password from `gateway.auth.password`
- Generate a token if needed: `openclaw doctor --generate-gateway-token`

**Not on localhost:**
- **Tailscale Serve** (recommended): keep bind loopback, run `openclaw gateway --tailscale serve`, open `https://<magicdns>/`
- **Tailnet bind**: run `openclaw gateway --bind tailnet --token "<token>"`, open `http://<tailscale-ip>:18789/`
- **Identity-aware reverse proxy**: configure `gateway.auth.mode: "trusted-proxy"` behind a non-loopback trusted proxy
- **SSH tunnel**: use port forwarding as described above

## Gateway Service Management

### Start Gateway

```bash
openclaw gateway start
# Or for dev mode
pnpm gateway:dev
```

### Stop Gateway

```bash
openclaw gateway stop
```

### Restart Gateway

```bash
openclaw gateway restart
```

### Check Gateway Status

```bash
openclaw gateway status
```

### Install Gateway as a Daemon

```bash
openclaw gateway install
# Uninstall
openclaw gateway uninstall
```

## Troubleshooting Gateway Issues

### Gateway Will Not Start

1. Check if another process is using the port:
   ```bash
   lsof -i :18789
   ```

2. Verify config syntax:
   ```bash
   openclaw doctor
   ```

3. Check logs:
   ```bash
   openclaw logs --follow
   ```

### Gateway Is Running But Unreachable

1. Verify network connectivity:
   ```bash
   curl http://127.0.0.1:18789/health
   ```

2. Check firewall settings
3. Verify bind configuration: ensure Gateway is bound to the correct interface
4. Check proxy settings if behind a firewall

### Onboarding "Wake up my friend" Hangs

1. Restart the Gateway:
   ```bash
   openclaw gateway restart
   ```

2. Check status + auth:
   ```bash
   openclaw status
   openclaw models status
   openclaw logs --follow
   ```

3. Run doctor:
   ```bash
   openclaw doctor
   ```

## Related

- [[gateway|Gateway Documentation]] — full gateway reference
- [[nodes|Nodes Documentation]] — node pairing and capabilities
- [[remote-access|Remote Access Guide]] — remote gateway configuration
