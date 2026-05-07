---
title: "Troubleshooting OpenClaw"
summary: "Symptom-first troubleshooting guide for OpenClaw: gateway issues, channels, automation, and node tools"
category: concepts
tags:
  - openclaw
  - troubleshooting
  - debugging
sources:
  - /opt/openclaw/data/workspace/refs/openclaw-docs/docs/help/troubleshooting.md
provenance:
  extracted: 0.9
  inferred: 0.1
  ambiguous: 0.0
---

# Troubleshooting

Symptom-first troubleshooting guide for OpenClaw. Use this page as a triage front door.

## First 60 Seconds

Run this ladder in order:

```bash
openclaw status
openclaw status --all
openclaw gateway probe
openclaw gateway status
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

Good output indicators:
- `openclaw status` → shows configured channels, no obvious auth errors
- `openclaw status --all` → full report present and shareable
- `openclaw gateway probe` → expected gateway target reachable (`Reachable: yes`)
- `openclaw gateway status` → `Runtime: running`, `Connectivity probe: ok`
- `openclaw doctor` → no blocking config/service errors
- `openclaw channels status --probe` → reachable gateway returns live transport state
- `openclaw logs --follow` → steady activity, no repeating fatal errors

## Decision Tree

Common symptoms and where to look:

1. **No replies** → [[faq-channels|Channel troubleshooting]]
2. **Dashboard won't connect** → [[faq-gateway|Gateway FAQ]]
3. **Gateway won't start** → Gateway section below
4. **Channel connects but messages don't flow** → [[faq-channels|Channel troubleshooting]]
5. **Cron/heartbeat issues** → [[faq-automation|Automation FAQ]]
6. **Node tool fails** → Node section below
7. **Browser tool fails** → Browser section below

## Gateway Won't Start

### Symptoms
- Service installed but not running
- Port conflict or "address already in use"

### Debug Commands

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

### Common Causes

1. **Port already in use:** Another process is using port 18789
   ```bash
   lsof -i :18789 | grep LISTEN
   ```

2. **Config mode mismatch:** Gateway mode is remote, or config file is missing local-mode stamp
   - Fix: Set `gateway.mode: "local"` in config

3. **Auth required:** Non-loopback bind without valid auth path
   - Fix: Set token/password auth or configure trusted-proxy

4. **Another instance running:** `EADDRINUSE` error
   - Fix: `openclaw gateway stop`, then restart

## No Replies

### Debug Commands

```bash
openclaw status
openclaw gateway status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
```

### Common Log Signatures

- `drop guild message (mention required` → mention gating blocked Discord message
- `pairing request` → sender unapproved, waiting for DM pairing approval
- `blocked` / `allowlist` → sender/room/group filtered

## Channel Connected But Messages Not Flowing

### Debug Commands

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

### Common Log Signatures

- `mention required` → group mention gating blocked processing
- `pairing` / `pending` → DM sender not approved yet
- `not_in_channel`, `missing_scope`, `Forbidden`, `401/403` → channel permission token issue

## Cron/Heartbeat Issues

### Debug Commands

```bash
openclaw status
openclaw gateway status
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw logs --follow
```

### Common Log Signatures

- `cron: scheduler disabled; jobs will not run automatically` → cron disabled
- `heartbeat skipped` with `reason=quiet-hours` → outside active hours
- `heartbeat skipped` with `reason=empty-heartbeat-file` → HEARTBEAT.md exists but empty
- `heartbeat skipped` with `reason=no-tasks-due` → task mode but none due
- `heartbeat skipped` with `reason=alerts-disabled` → visibility disabled

## Browser Tool Fails

### Debug Commands

```bash
openclaw status
openclaw gateway status
openclaw browser status
openclaw logs --follow
openclaw doctor
```

### Common Log Signatures

- `unknown command "browser"` → plugins.allow doesn't include browser
- `Failed to start Chrome CDP on port` → local browser launch failed
- `browser.executablePath not found` → binary path wrong
- `No Chrome tabs found for profile="user"` → Chrome MCP attach profile has no open tabs

## Local OpenAI-Compatible Backend Issues

### Symptoms
Backend works directly but fails in OpenClaw.

### Debug Steps

1. If error mentions `messages[].content` expecting string → set:
   ```json
   "compat.requiresStringContent": true
   ```

2. If still fails only on agent turns → set:
   ```json
   "compat.supportsTools": false
   ```

3. If tiny direct calls work but larger prompts crash → upstream model/server limitation

## Related

- [[faq|FAQ]] — frequently asked questions
- [[faq-gateway|FAQ: Gateway]] — gateway-specific issues
- [[faq-automation|FAQ: Automation]] — cron and heartbeat issues
- [[debugging|Debugging]] — watch mode and raw streams
