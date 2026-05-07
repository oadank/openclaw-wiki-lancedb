---
title: "Diagnostics Flags"
category: concepts
tags: [diagnostics, logging, debugging, configuration]
sources:
  - /opt/openclaw/data/workspace/refs/openclaw-docs/docs/diagnostics/flags.md
created: "2026-04-23T15:57:00Z"
updated: "2026-04-23T15:57:00Z"
summary: "Targeted debug log flags that let you enable subsystem-specific logging without raising global verbosity levels."
provenance:
  extracted: 1.0
  inferred: 0.0
  ambiguous: 0.0
---

# Diagnostics Flags

Diagnostics flags let you enable **targeted debug logs** for specific subsystems without raising the global logging level to verbose. Flags are opt-in and have no effect unless a subsystem explicitly checks them.

## Flag Format

Flags are strings, compared **case-insensitively**.

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

### Wildcard Support

- `telegram.*` → matches `telegram.http`, `telegram.payload`, etc.
- `*` → enables **all** flags

Multiple flags can be combined:

```json
{
  "diagnostics": {
    "flags": ["telegram.http", "gateway.*"]
  }
}
```

After changing flags in config, **restart the gateway** for them to take effect.

## Environment Variable Override

For one-off debugging sessions without touching config:

```bash
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

To disable all flags at once:

```bash
OPENCLAW_DIAGNOSTICS=0
```

See [[environment|Environment Variables]] for general env var loading rules.

## Log Output Location

Flags emit logs to the standard diagnostics log file:

- Default: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`
- If `logging.file` is configured, use that path instead
- Format: **JSONL** (one JSON object per line)
- Redaction still applies per `logging.redactSensitive`

> Note: If `logging.level` is set higher than `warn`, flag-emitted logs may be suppressed. Default `info` level is fine for most diagnostic work.

## Extracting Diagnostic Logs

Find the latest log file:

```bash
ls -t /tmp/openclaw/openclaw-*.log | head -n 1
```

Filter for specific subsystem errors (example: Telegram HTTP):

```bash
rg "telegram http error" /tmp/openclaw/openclaw-*.log
```

Live tail while reproducing an issue:

```bash
tail -f /tmp/openclaw/openclaw-$(date +%F).log | rg "telegram http error"
```

For remote gateways, use `openclaw logs --follow`. See [[troubleshooting|Troubleshooting OpenClaw]] for more debugging strategies.

## Safety

- Flags are **safe to leave enabled** — they only increase log volume for the specific subsystem, not globally
- They do not affect performance or behavior beyond log output
- Always pair with [[debugging|Debugging OpenClaw]] tools like watch mode and raw model streams when needed

## See Also

- [[debugging|Debugging OpenClaw]] — Other debugging tools
- [[environment|Environment Variables]] — Config and env override precedence
- [[troubleshooting|Troubleshooting OpenClaw]] — Symptom-first troubleshooting guide
- [[faq-env|FAQ: Environment Variables]] — Env var loading details
