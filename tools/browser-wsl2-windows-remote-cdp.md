---
title: "WSL2 + Windows Remote CDP"
summary: "Troubleshoot split-host browser control when OpenClaw runs in WSL2 and Chrome runs on Windows"
tags: ["tools", "browser", "troubleshooting", "wsl2", "windows"]
sources: ["/opt/openclaw/data/workspace/refs/openclaw-docs/docs/tools/browser-wsl2-windows-remote-cdp-troubleshooting.md"]
provenance: {
  extracted: 1.0,
  inferred: 0.0,
  ambiguous: 0.0
}
---

# WSL2 + Windows + Remote Chrome CDP Troubleshooting

This guide covers the common split-host setup where:
- OpenClaw Gateway runs inside WSL2
- Chrome runs on Windows
- Browser control must cross the WSL2/Windows boundary

## Choose the right browser mode first

You have two valid patterns:

### Option 1: Raw remote CDP from WSL2 to Windows

Use a remote browser profile that points from WSL2 to a Windows Chrome CDP endpoint.

Choose this when:
- The Gateway stays inside WSL2
- Chrome runs on Windows
- You need browser control to cross the WSL2/Windows boundary

### Option 2: Host-local Chrome MCP

Use `existing-session` / `user` only when the Gateway itself runs on the same host as Chrome.

Choose this when:
- OpenClaw and Chrome are on the same machine
- You want the local signed-in browser state
- You do not need cross-host browser transport
- You do not need advanced managed/raw-CDP-only routes like `responsebody`, PDF export, download interception, or batch actions

For WSL2 Gateway + Windows Chrome, prefer raw remote CDP. Chrome MCP is host-local, not a WSL2-to-Windows bridge.

## Working architecture

Reference shape:
- WSL2 runs the Gateway on `127.0.0.1:18789`
- Windows opens the Control UI in a normal browser at `http://127.0.0.1:18789/`
- Windows Chrome exposes a CDP endpoint on port `9222`
- WSL2 can reach that Windows CDP endpoint
- OpenClaw points a browser profile at the address that is reachable from WSL2

## Validate in layers

Work top to bottom. Do not skip ahead.

### Layer 1: Verify Chrome is serving CDP on Windows

Start Chrome on Windows with remote debugging enabled:

```powershell
chrome.exe --remote-debugging-port=9222
```

From Windows, verify Chrome itself first:

```powershell
curl http://127.0.0.1:9222/json/version
curl http://127.0.0.1:9222/json/list
```

If this fails on Windows, OpenClaw is not the problem yet.

### Layer 2: Verify WSL2 can reach that Windows endpoint

From WSL2, test the exact address you plan to use in `cdpUrl`:

```bash
curl http://WINDOWS_HOST_OR_IP:9222/json/version
curl http://WINDOWS_HOST_OR_IP:9222/json/list
```

Good result:
- `/json/version` returns JSON with Browser / Protocol-Version metadata
- `/json/list` returns JSON (empty array is fine if no pages are open)

If this fails:
- Windows is not exposing the port to WSL2 yet
- The address is wrong for the WSL2 side
- Firewall / port forwarding / local proxying is still missing

Fix that before touching OpenClaw config.

### Layer 3: Configure the correct browser profile

For raw remote CDP, point OpenClaw at the address that is reachable from WSL2:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "remote",
    profiles: {
      remote: {
        cdpUrl: "http://WINDOWS_HOST_OR_IP:9222",
        attachOnly: true,
        color: "#00AA00",
      },
    },
  },
}
```

Notes:
- Use the WSL2-reachable address, not whatever only works on Windows
- Keep `attachOnly: true` for externally managed browsers
- `cdpUrl` can be `http://`, `https://`, `ws://`, or `wss://`
- Use HTTP(S) when you want OpenClaw to discover `/json/version`
- Use WS(S) only when the browser provider gives you a direct DevTools socket URL
- Test the same URL with `curl` before expecting OpenClaw to succeed

### Layer 4: Verify the Control UI layer separately

Open the UI from Windows: `http://127.0.0.1:18789/`

Then verify:
- The page origin matches what `gateway.controlUi.allowedOrigins` expects
- Token auth or pairing is configured correctly
- You are not debugging a Control UI auth problem as if it were a browser problem

### Layer 5: Verify end-to-end browser control

From WSL2:

```bash
openclaw browser open https://example.com --browser-profile remote
openclaw browser tabs --browser-profile remote
```

Good result:
- The tab opens in Windows Chrome
- `openclaw browser tabs` returns the target
- Later actions (`snapshot`, `screenshot`, `navigate`) work from the same profile

## Common misleading errors

Treat each message as a layer-specific clue:

- `control-ui-insecure-auth` — UI origin / secure-context problem, not a CDP transport problem
- `token_missing` — Auth configuration problem
- `pairing required` — Device approval problem
- `Remote CDP for profile "remote" is not reachable` — WSL2 cannot reach the configured `cdpUrl`
- `Browser attachOnly is enabled and CDP websocket for profile "remote" is not reachable` — The HTTP endpoint answered, but the DevTools WebSocket still could not be opened
- Stale viewport / dark-mode / locale / offline overrides after a remote session — Run `openclaw browser stop --browser-profile remote` to close the active control session and release emulation state
- `gateway timeout after 1500ms` — Often still CDP reachability or a slow/unreachable remote endpoint
- `No Chrome tabs found for profile="user"` — Local Chrome MCP profile selected where no host-local tabs are available

## Fast triage checklist

1. Windows: does `curl http://127.0.0.1:9222/json/version` work?
2. WSL2: does `curl http://WINDOWS_HOST_OR_IP:9222/json/version` work?
3. OpenClaw config: does `browser.profiles.<name>.cdpUrl` use that exact WSL2-reachable address?
4. Control UI: are you opening `http://127.0.0.1:18789/` instead of a LAN IP?
5. Are you trying to use `existing-session` across WSL2 and Windows instead of raw remote CDP?

## See also

- [[browser-troubleshooting|Browser Troubleshooting]] — Browser startup issues on Linux
- [[control-ui|Control UI]] — Web Control UI configuration and troubleshooting
- [[gateway/remote|Remote Gateway Access]] — Remote Gateway connectivity patterns
