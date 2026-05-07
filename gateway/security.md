---
title: "Security"
summary: "Security considerations, trust model, hardening, and audit for OpenClaw Gateway"
read_when:
  - Reviewing OpenClaw security posture
  - Hardening gateway configuration
  - Running security audits
category: gateway
tags: [gateway, security, trust-model, hardening, audit]
sources:
  - /opt/openclaw/data/workspace/refs/openclaw-docs/docs/gateway/security/index.md
---

# Security

> **Personal assistant trust model:** one trusted operator boundary per gateway. NOT a hostile multi-tenant boundary.

## Trust Model

| Supported | Not Supported |
|-----------|--------------|
| One user/trust boundary per gateway | Shared gateway for mutually untrusted users |
| Multiple agents in one gateway | Per-user host authorization on shared agent |

If adversarial-user isolation needed: split by trust boundary (separate gateway + credentials, ideally separate OS users/hosts).

## Quick Audit

```bash
openclaw security audit           # Basic audit
openclaw security audit --deep    # Deep audit
openclaw security audit --fix     # Auto-fix common issues
openclaw security audit --json    # Machine-readable
```

`--fix` flips open group policies to allowlists, restores `logging.redactSensitive: "tools"`, tightens file permissions.

## Hardened Baseline (60 seconds)

```json5
{
  gateway: { mode: "local", bind: "loopback", auth: { mode: "token", token: "replace-me" } },
  session: { dmScope: "per-channel-peer" },
  tools: {
    profile: "messaging",
    deny: ["group:automation", "group:runtime", "group:fs", "sessions_spawn", "sessions_send"],
    fs: { workspaceOnly: true },
    exec: { security: "deny", ask: "always" },
    elevated: { enabled: false },
  },
  channels: { whatsapp: { dmPolicy: "pairing", groups: { "*": { requireMention: true } } } },
}
```

## Shared Inbox Rule

If more than one person can DM your bot:
- Set `session.dmScope: "per-channel-peer"`
- Keep `dmPolicy: "pairing"` or strict allowlists
- Never combine shared DMs with broad tool access

## Context Visibility

| Setting | Behavior |
|---------|----------|
| `contextVisibility: "all"` (default) | Keep all supplemental context |
| `contextVisibility: "allowlist"` | Filter to allowlisted senders |
| `contextVisibility: "allowlist_quote"` | Like allowlist, but keep explicit quoted reply |

## Trust Boundary Matrix

| Control | What it means | Common misread |
|---------|--------------|---------------|
| `gateway.auth` | Authenticates callers to gateway APIs | "Needs per-message signatures" |
| `sessionKey` | Routing key for context selection | "User auth boundary" |
| Prompt guardrails | Reduce model abuse risk | "Proves auth bypass" |
| Exec approvals | Operator intent guardrails | "Hostile multi-tenant isolation" |

## What's NOT a Vulnerability (by design)

- Prompt-injection-only chains without policy/auth/sandbox bypass
- Claims assuming hostile multi-tenant operation on one shared host
- Localhost-only deployment findings (e.g., HSTS on loopback)
- "Missing per-user authorization" treating `sessionKey` as auth token

## DM Access Model

| DM policy | Behavior |
|-----------|----------|
| `pairing` (default) | Unknown senders get one-time pairing code |
| `allowlist` | Only senders in `allowFrom` |
| `open` | All inbound DMs (requires `allowFrom: ["*"]`) |
| `disabled` | Ignore all DMs |

## Incident Response

1. **Isolate**: `openclaw gateway stop`
2. **Audit**: `openclaw security audit --deep --json`
3. **Review**: Check logs (`openclaw logs --follow`), sessions, config
4. **Rotate**: Change tokens, API keys, credentials
5. **Harden**: Apply baseline config, re-enable tools incrementally

## Related

- [[concepts/threat-model]] — MITRE ATLAS threat model
- [[gateway/secrets]] — secrets management
- [[gateway/trusted-proxy-auth]] — reverse proxy auth
