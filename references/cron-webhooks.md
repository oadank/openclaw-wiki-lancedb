---
title: "Cron: Webhooks"
summary: "HTTP webhook endpoints for external triggers and Gmail PubSub inbox integration"
category: references
tags:
  - openclaw
  - automation
  - webhooks
  - http
  - gmail
sources:
  - /opt/openclaw/data/workspace/refs/openclaw-docs/docs/automation/cron-jobs.md
provenance: extracted
---

# Cron: Webhooks

Gateway can expose HTTP webhook endpoints for external triggers. Enable in config:

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
  },
}
```

## Authentication

Every request must include the hook token via header:

- `Authorization: Bearer <token>` (recommended)
- `x-openclaw-token: <token>`

Query-string tokens are rejected.

## POST /hooks/wake

Enqueue a system event for the main session:

```bash
curl -X POST http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"text":"New email received","mode":"now"}'
```

- `text` (required): event description
- `mode` (optional): `now` (default) or `next-heartbeat`

## POST /hooks/agent

Run an isolated agent turn:

```bash
curl -X POST http://127.0.0.1:18789/hooks/agent \
  -H 'Authorization: Bearer SECRET' \
  -H 'Content-Type: application/json' \
  -d '{"message":"Summarize inbox","name":"Email","model":"openai/gpt-5.4-mini"}'
```

Fields: `message` (required), `name`, `agentId`, `wakeMode`, `deliver`, `channel`, `to`, `model`, `thinking`, `timeoutSeconds`.

## Mapped Hooks (POST /hooks/\<name\>)

Custom hook names are resolved via `hooks.mappings` in config. Mappings can transform arbitrary payloads into `wake` or `agent` actions with templates or code transforms.

## Security

- Keep hook endpoints behind loopback, tailnet, or trusted reverse proxy
- Use a dedicated hook token; do not reuse gateway auth tokens
- Keep `hooks.path` on a dedicated subpath; `/` is rejected
- Set `hooks.allowedAgentIds` to limit explicit `agentId` routing
- Keep `hooks.allowRequestSessionKey=false` unless you require caller-selected sessions
- If you enable `hooks.allowRequestSessionKey`, also set `hooks.allowedSessionKeyPrefixes` to constrain allowed session key shapes

## Gmail PubSub Integration

Wire Gmail inbox triggers to OpenClaw via Google PubSub.

**Prerequisites**: `gcloud` CLI, `gog` (gogcli), OpenClaw hooks enabled, Tailscale for the public HTTPS endpoint.

### Wizard Setup (Recommended)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

This writes `hooks.gmail` config, enables the Gmail preset, and uses Tailscale Funnel for the push endpoint.

### Gateway Auto-Start

When `hooks.enabled=true` and `hooks.gmail.account` is set, the Gateway starts `gog gmail watch serve` on boot and auto-renews the watch. Set `OPENCLAW_SKIP_GMAIL_WATCHER=1` to opt out.

### Manual One-Time Setup

1. Select the GCP project:
```bash
gcloud auth login
gcloud config set project <project-id>
gcloud services enable gmail.googleapis.com pubsub.googleapis.com
```

2. Create topic and grant Gmail push access:
```bash
gcloud pubsub topics create gog-gmail-watch
gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
  --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
  --role=roles/pubsub.publisher
```

3. Start the watch:
```bash
gog gmail watch start \
  --account openclaw@gmail.com \
  --label INBOX \
  --topic projects/<project-id>/topics/gog-gmail-watch
```

### Gmail Model Override

```json5
{
  hooks: {
    gmail: {
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

## Related Pages

- [[cron-jobs|Scheduled Tasks]] — overview and cron basics
- [[hooks-overview|Hooks]] — event-driven hooks for lifecycle events
