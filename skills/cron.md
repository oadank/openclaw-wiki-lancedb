---
title: "Scheduled Tasks (Cron)"
category: skills
tags: [automation, scheduling]
summary: "Gateway scheduler for precise timing: cron expressions, one-shot reminders, webhooks, and delivery options"
sources: ["/opt/openclaw/data/workspace/refs/openclaw-docs/docs/automation/cron-jobs.md"]
updated: "2026-04-23T10:00:00Z"
provenance:
  extracted: 0.9
  inferred: 0.1
  ambiguous: 0.0
---

# Scheduled Tasks (Cron)

Cron is the [[gateway|Gateway]]'s built-in scheduler. It persists jobs, wakes the agent at the right time, and can deliver output back to a chat channel or webhook endpoint.

## Quick Start

```bash
# Add a one-shot reminder
openclaw cron add \
  --name "Reminder" \
  --at "2026-02-01T16:00:00Z" \
  --session main \
  --system-event "Reminder: check the cron docs draft" \
  --wake now \
  --delete-after-run

# Check your jobs
openclaw cron list
openclaw cron show <job-id>

# See run history
openclaw cron runs --id <job-id>
```

## How Cron Works

- Cron runs **inside the [[gateway|Gateway]]** process (not inside the model)
- Job definitions persist at `~/.openclaw/cron/jobs.json` — restarts do not lose schedules
- Runtime state persists in `~/.openclaw/cron/jobs-state.json`
- All cron executions create [[tasks|background task]] records
- One-shot jobs (`--at`) auto-delete after success by default
- Isolated runs best-effort close tracked browser tabs/processes when the run completes

## Schedule Types

| Kind    | CLI flag  | Description                                           |
| ------- | --------- | ----------------------------------------------------- |
| `at`    | `--at`    | One-shot timestamp (ISO 8601 or relative like `20m`)  |
| `every` | `--every` | Fixed interval                                        |
| `cron`  | `--cron`  | 5-field or 6-field cron expression with optional `--tz` |

> [!Warning]
> Day-of-month and day-of-week use **OR logic** (Vixie cron behavior). When both are non-wildcard, it matches when **either** field matches.

Timestamps without a timezone are treated as UTC. Add `--tz America/New_York` for local wall-clock scheduling.

## Execution Styles

| Style           | `--session` value     | Runs in                   | Best for                        |
| --------------- | --------------------- | ------------------------- | ------------------------------- |
| Main session    | `main`                | Next heartbeat turn       | Reminders, system events        |
| Isolated        | `isolated`            | Dedicated `cron:<jobId>`  | Reports, background chores      |
| Current session | `current`             | Bound at creation time    | Context-aware recurring work    |
| Custom session  | `session:custom-id`   | Persistent named session  | Workflows that build on history |

### Payload Options for Isolated Jobs

- `--message`: prompt text (required for isolated)
- `--model` / `--thinking`: model and thinking level overrides
- `--light-context`: skip workspace bootstrap file injection
- `--tools exec,read`: restrict which tools the job can use

## Delivery Modes

| Mode       | What happens                                              |
| ---------- | --------------------------------------------------------- |
| `announce` | Fallback-deliver final text to the target if the agent did not send |
| `webhook`  | POST finished event payload to a URL                     |
| `none`     | No runner fallback delivery                               |

```bash
# Delivery to Telegram
openclaw cron add --name "Morning brief" --cron "0 7 * * *" \
  --session isolated --message "Summarize overnight updates." \
  --announce --channel telegram --to "-1001234567890"

# Delivery to Slack
--channel slack --to "channel:C1234567890"
```

## Webhooks

Gateway exposes HTTP webhook endpoints for external triggers. See [[gmail-pubsub|Gmail PubSub Integration]] for Gmail integration.

Enable in config:

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
  },
}
```

### Endpoints

- **POST /hooks/wake** — Enqueue a system event for the main session
- **POST /hooks/agent** — Run an isolated agent turn
- **POST /hooks/\<name\>** — Custom mapped hooks

## Configuration

```json5
{
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 1,
    retry: {
      maxAttempts: 3,
      backoffMs: [60000, 120000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "server_error"],
    },
    webhookToken: "replace-with-dedicated-webhook-token",
    sessionRetention: "24h",
    runLog: { maxBytes: "2mb", keepLines: 2000 },
  },
}
```

Disable cron: `cron.enabled: false` or `OPENCLAW_SKIP_CRON=1`.

## Troubleshooting

| Symptom                            | Check                                                    |
| ---------------------------------- | -------------------------------------------------------- |
| Cron not firing                    | `cron.enabled`, `OPENCLAW_SKIP_CRON`, timezone vs host  |
| Cron fired but no delivery         | Delivery mode `none`, invalid target, channel auth errors |
| Manual run skipped                 | `openclaw cron run <jobId> --due` — only runs if due     |

```bash
openclaw status
openclaw gateway status
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw logs --follow
openclaw doctor
```

## Related

- [[automation|Automation & Tasks]] — all automation mechanisms at a glance
- [[tasks|Background Tasks]] — task ledger for cron executions
- [[heartbeat|Heartbeat]] — periodic main-session turns
- [[gmail-pubsub|Gmail PubSub Integration]] — Gmail inbox triggers
- [[hooks|Hooks]] — event-driven lifecycle scripts
- [[faq-automation|FAQ: Skills and Automation]] — scheduling Q&A
- [[troubleshooting|Troubleshooting OpenClaw]] — symptom-first troubleshooting
