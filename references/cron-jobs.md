---
title: "Scheduled Tasks"
summary: "Overview of OpenClaw's built-in cron scheduler: schedule types, execution styles, delivery modes, and configuration"
category: references
tags:
  - openclaw
  - automation
  - cron
  - scheduling
sources:
  - /opt/openclaw/data/workspace/refs/openclaw-docs/docs/automation/cron-jobs.md
provenance: extracted
---

# Scheduled Tasks (Cron)

Cron is the Gateway's built-in scheduler. It persists jobs, wakes the agent at the right time, and can deliver output back to a chat channel or webhook endpoint.

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

- Cron runs **inside the Gateway** process (not inside the model).
- Job definitions persist at `~/.openclaw/cron/jobs.json` so restarts do not lose schedules.
- Runtime execution state persists next to it in `~/.openclaw/cron/jobs-state.json`. Track `jobs.json` in git; gitignore `jobs-state.json`.
- After the split, older OpenClaw versions can read `jobs.json` but may treat jobs as fresh because runtime fields now live in `jobs-state.json`.
- All cron executions create [[cron-background-tasks|background task]] records.
- One-shot jobs (`--at`) auto-delete after success by default.
- Isolated cron runs best-effort close tracked browser tabs/processes for their `cron:<jobId>` session when the run completes.

## Execution Styles

| Style           | `--session` value   | Runs in                  | Best for                        |
| --------------- | ------------------- | ------------------------ | ------------------------------- |
| Main session    | `main`              | Next heartbeat turn      | Reminders, system events        |
| Isolated        | `isolated`          | Dedicated `cron:<jobId>` | Reports, background chores      |
| Current session | `current`           | Bound at creation time   | Context-aware recurring work    |
| Custom session  | `session:custom-id` | Persistent named session | Workflows that build on history |

**Main session** jobs enqueue a system event and optionally wake the heartbeat (`--wake now` or `--wake next-heartbeat`). **Isolated** jobs run a dedicated agent turn with a fresh session. **Custom sessions** (`session:xxx`) persist context across runs, enabling workflows like daily standups that build on previous summaries.

## Delivery and Output

| Mode       | What happens                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Fallback-deliver final text to the target if the agent did not send |
| `webhook`  | POST finished event payload to a URL                                |
| `none`     | No runner fallback delivery                                         |

Use `--announce --channel telegram --to "-1001234567890"` for channel delivery. For Telegram forum topics, use `-1001234567890:topic:123`. Slack/Discord/Mattermost targets should use explicit prefixes (`channel:<id>`, `user:<id>`).

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

## Related Pages

- [[cron-schedules|Cron: Schedule Types]] — at, every, cron expressions, timezone gotchas
- [[cron-delivery|Cron: Delivery and Output]] — announce, webhook, failure notifications, Telegram/Slack targets
- [[cron-webhooks|Cron: Webhooks]] — HTTP webhook endpoints, Gmail PubSub integration
- [[cron-manage|Cron: Managing Jobs]] — CLI commands for listing, editing, running, deleting jobs
- [[cron-troubleshoot|Cron: Troubleshooting]] — command ladder, common issues, delivery problems
- [[cron-background-tasks|Background Tasks]] — task ledger for cron executions
