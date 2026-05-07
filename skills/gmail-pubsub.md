---
title: "Gmail PubSub Integration"
category: skills
tags: [automation, gmail]
summary: "Gmail inbox triggers via Google PubSub for event-driven automation"
sources: ["/opt/openclaw/data/workspace/refs/openclaw-docs/docs/automation/cron-jobs.md"]
updated: "2026-04-23T10:00:00Z"
provenance:
  extracted: 0.8
  inferred: 0.2
  ambiguous: 0.0
---

# Gmail PubSub Integration

Wire Gmail inbox triggers to OpenClaw via Google PubSub. New emails can trigger agent runs automatically.

## Prerequisites

- `gcloud` CLI installed and authenticated
- `gog` (gogcli) installed
- [[cron|Webhooks]] enabled in the Gateway config
- Tailscale (optional, recommended for public HTTPS endpoint)

## Wizard Setup (Recommended)

```bash
openclaw webhooks gmail setup --account openclaw@gmail.com
```

This writes `hooks.gmail` config, enables the Gmail preset, and uses Tailscale Funnel for the push endpoint.

## Auto-Start Behavior

When `hooks.enabled=true` and `hooks.gmail.account` is set, the Gateway starts `gog gmail watch serve` on boot and auto-renews the watch.

Opt out with `OPENCLAW_SKIP_GMAIL_WATCHER=1`.

## Manual Setup

1. Select the GCP project that owns the OAuth client used by `gog`:

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

## Configuration

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

## How It Works

When a new email arrives in your inbox:

1. Google PubSub sends a push notification to your Gateway webhook endpoint
2. Gateway triggers an isolated agent run with the new email content
3. The agent can process the email, reply, create tasks, or take other actions

## Related

- [[cron|Scheduled Tasks]] — webhook and cron job documentation
- [[automation|Automation & Tasks]] — all automation mechanisms
- [[hooks|Hooks]] — event-driven lifecycle scripts
