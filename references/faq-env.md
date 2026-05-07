---
title: "FAQ: Environment Variables"
summary: "Environment variable loading, precedence, and configuration in OpenClaw"
category: references
tags:
  - openclaw
  - faq
  - environment
sources:
  - /opt/openclaw/data/workspace/refs/openclaw-docs/docs/help/faq.md
provenance:
  extracted: 0.85
  inferred: 0.15
  ambiguous: 0.0
---

# FAQ: Environment Variables

Answers about environment variable loading, precedence, and configuration.

## Env Vars and .env Loading

### Precedence Order (highest → lowest)

1. **Process environment** — from parent shell/daemon
2. **`.env` in current working directory** — dotenv default, non-overriding
3. **Global `.env`** — at `~/.openclaw/.env`, non-overriding
4. **Config `env` block** — in `openclaw.json`, applied only if missing
5. **Login-shell import** — if enabled via `env.shellEnv.enabled`

Rule: **never override existing values**.

### Config `env` Block

Set inline env vars in `openclaw.json`:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
  },
}
```

### Shell Env Import

Run login shell and import only **missing** expected keys:

```json5
{
  env: {
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

Environment variables:
- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

### Runtime-Injected Env Vars

OpenClaw injects these context markers:

- `OPENCLAW_SHELL=exec` — exec tool commands
- `OPENCLAW_SHELL=acp` — ACP runtime backend
- `OPENCLAW_SHELL=acp-client` — ACP client bridge
- `OPENCLAW_SHELL=tui-local` — local TUI shell commands

## Env Var Substitution in Config

Reference env vars using `${VAR_NAME}`:

```json5
{
  models: {
    providers: {
      "vercel-gateway": {
        apiKey: "${VERCEL_GATEWAY_API_KEY}",
      },
    },
  },
}
```

## Secret Refs vs ${ENV} Strings

Two patterns supported:
- `${VAR}` — string substitution in config
- `SecretRef` objects — for fields supporting secrets references

Both resolve from process env at activation time.

## Path-Related Env Vars

| Variable | Purpose |
| --- | --- |
| `OPENCLAW_HOME` | Override home directory for path resolution |
| `OPENCLAW_STATE_DIR` | Override state directory (default: `~/.openclaw`) |
| `OPENCLAW_CONFIG_PATH` | Override config file path |

## nvm Users: web_fetch TLS Failures

Node installed via nvm may miss modern root CAs, causing `web_fetch` to fail.

Linux auto-detects nvm and applies fix. Manual fix:

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

## Related

- [[environment|Environment Variables]] — full environment documentation
- [[faq|FAQ]] — main FAQ index
