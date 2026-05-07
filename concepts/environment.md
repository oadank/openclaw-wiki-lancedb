---
title: "Environment Variables"
summary: "Where OpenClaw loads environment variables from, precedence order, and runtime-injected env vars"
category: concepts
tags:
  - openclaw
  - configuration
  - environment
sources:
  - /opt/openclaw/data/workspace/refs/openclaw-docs/docs/help/environment.md
provenance:
  extracted: 0.9
  inferred: 0.1
  ambiguous: 0.0
---

# Environment Variables

OpenClaw pulls environment variables from multiple sources. Rule: **never override existing values**.

## Precedence Order (highest → lowest)

1. **Process environment** — from parent shell/daemon
2. **`.env` in current working directory** — dotenv default, non-overriding
3. **Global `.env`** — at `~/.openclaw/.env` (`$OPENCLAW_STATE_DIR/.env`), non-overriding
4. **Config `env` block** — in `~/.openclaw/openclaw.json`, applied only if missing
5. **Login-shell import** — `env.shellEnv.enabled` or `OPENCLAW_LOAD_SHELL_ENV=1`, applied only for missing expected keys

Ubuntu fresh installs also treat `~/.config/openclaw/gateway.env` as a compatibility fallback after the global `.env`. If both exist and disagree, `~/.openclaw/.env` is used with a warning.

## Config `env` Block

Two equivalent ways to set inline env vars (non-overriding):

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

## Shell Env Import

`env.shellEnv` runs your login shell and imports only **missing** expected keys:

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

### Environment Variables

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

## Runtime-Injected Env Vars

OpenClaw injects these into spawned child processes:

- `OPENCLAW_SHELL=exec` — commands run through the `exec` tool
- `OPENCLAW_SHELL=acp` — ACP runtime backend process spawns
- `OPENCLAW_SHELL=acp-client` — `openclaw acp client` when spawning ACP bridge
- `OPENCLAW_SHELL=tui-local` — local TUI `!` shell commands

These are runtime markers (not required user config), useful for shell/profile logic.

## UI Env Vars

- `OPENCLAW_THEME=light` — force light TUI palette
- `OPENCLAW_THEME=dark` — force dark TUI palette
- `COLORFGBG` — auto-detect terminal background color

## Env Var Substitution

Reference env vars directly in config string values using `${VAR_NAME}` syntax:

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

- `${VAR}` string substitution in config values
- `SecretRef` objects (`{ source: "env", provider: "default", id: "VAR" }`) for fields supporting secrets references

Both resolve from process env at activation time.

## Path-Related Env Vars

| Variable               | Purpose                                                                                                                                 |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`        | Override home directory for all internal path resolution (`~/.openclaw/`, agent dirs, sessions, credentials). Full filesystem isolation. |
| `OPENCLAW_STATE_DIR`   | Override state directory (default: `~/.openclaw`)                                                                                      |
| `OPENCLAW_CONFIG_PATH` | Override config file path (default: `~/.openclaw/openclaw.json`)                                                                       |

## Logging

| Variable             | Purpose                                                                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_LOG_LEVEL` | Override log level for file and console (e.g., `debug`, `trace`). Takes precedence over config logging levels. Invalid values ignored. |

### OPENCLAW_HOME Precedence

```
OPENCLAW_HOME > $HOME > USERPROFILE > os.homedir()
```

Example (macOS LaunchDaemon):

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

## nvm Users: web_fetch TLS Failures

Node installed via nvm uses bundled CA store, which may be missing modern root CAs (ISRG Root X1/X2 for Let's Encrypt, DigiCert Global Root G2). This causes `web_fetch` to fail with `"fetch failed"` on HTTPS sites.

Linux auto-detects nvm and applies fix:
- `openclaw gateway install` writes `NODE_EXTRA_CA_CERTS` into systemd service environment
- `openclaw` CLI entrypoint re-execs with `NODE_EXTRA_CA_CERTS` set before Node startup

### Manual Fix

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

Node reads `NODE_EXTRA_CA_CERTS` at process startup, so writing only to `~/.openclaw/.env` may not work.

## Related

- [[config-basics|Config Basics]] — configuration fundamentals
- [[faq-env|FAQ: Environment Variables]] — common env var questions
- [[secrets-management|Secrets Management]] — secure credential storage
