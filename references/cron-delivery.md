---
title: "Cron: Delivery and Output"
summary: "Delivery modes for cron jobs: announce, webhook, none, failure notifications, and channel target configuration"
category: references
tags:
  - openclaw
  - automation
  - cron
sources:
  - /opt/openclaw/data/workspace/refs/openclaw-docs/docs/automation/cron-jobs.md
provenance: extracted
---

# Cron: Delivery and Output

## Delivery Modes

| Mode       | What happens                                                        |
| ---------- | ------------------------------------------------------------------- |
| `announce` | Fallback-deliver final text to the target if the agent did not send |
| `webhook`  | POST finished event payload to a URL                                |
| `none`     | No runner fallback delivery                                         |

Use `--announce --channel telegram --to "-1001234567890"` for channel delivery. For Telegram forum topics, use `-1001234567890:topic:123`. Slack/Discord/Mattermost targets should use explicit prefixes (`channel:<id>`, `user:<id>`).

## Isolated Job Payload Options

- `--message`: prompt text (required for isolated)
- `--model` / `--thinking`: model and thinking level overrides
- `--light-context`: skip workspace bootstrap file injection
- `--tools exec,read`: restrict which tools the job can use

`--model` uses the selected allowed model for that job. If the requested model is not allowed, cron logs a warning and falls back to the job's agent/default model selection.

## Model Selection Precedence

1. Gmail hook model override (when the run came from Gmail and that override is allowed)
2. Per-job payload `model`
3. Stored cron session model override
4. Agent/default model selection

Fast mode follows the resolved live selection too. If an isolated run hits a live model-switch handoff, cron retries with the switched provider/model and persists that selection before retrying.

## Failure Notifications

Failure notifications follow a separate destination path:

- `cron.failureDestination` sets a global default for failure notifications
- `job.delivery.failureDestination` overrides that per job
- If neither is set and the job already delivers via `announce`, failure notifications fall back to that primary announce target
- `delivery.failureDestination` is only supported on `sessionTarget="isolated"` jobs unless the primary delivery mode is `webhook`

## Isolated Job Behavior

- Isolated cron runs guard against stale acknowledgement replies
- If the first result is just an interim status update and no descendant subagent run is still responsible, OpenClaw re-prompts once for the actual result before delivery
- When orchestration involves subagents, delivery prefers the final descendant output over stale parent interim text

## Related Pages

- [[cron-jobs|Scheduled Tasks]] — overview and cron basics
- [[cron-schedules|Cron: Schedule Types]] — schedule types and expressions
- [[cron-webhooks|Cron: Webhooks]] — HTTP webhook setup
