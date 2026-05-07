---
title: "Cron: Schedule Types"
summary: "Schedule types for cron jobs: at (one-shot), every (interval), cron expressions, timezone handling, and OR logic gotchas"
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

# Cron: Schedule Types

## Schedule Types

| Kind    | CLI flag  | Description                                             |
| ------- | --------- | ------------------------------------------------------- |
| `at`    | `--at`    | One-shot timestamp (ISO 8601 or relative like `20m`)    |
| `every` | `--every` | Fixed interval                                          |
| `cron`  | `--cron`  | 5-field or 6-field cron expression with optional `--tz` |

Timestamps without a timezone are treated as UTC. Add `--tz America/New_York` for local wall-clock scheduling.

## One-Shot (at)

```bash
openclaw cron add \
  --name "Reminder" \
  --at "2026-02-01T16:00:00Z" \
  --session main \
  --system-event "Reminder: check the cron docs draft" \
  --wake now \
  --delete-after-run
```

Relative time also works:
```bash
openclaw cron add --name "Quick reminder" --at "20m" --session main --system-event "Time's up!" --wake now
```

## Fixed Interval (every)

```bash
# Every 30 minutes
openclaw cron add --name "Health check" --every "30m" --session isolated --message "Check system health"
```

## Cron Expressions

```bash
# Every day at 7 AM (America/Los_Angeles timezone)
openclaw cron add \
  --name "Morning brief" \
  --cron "0 7 * * *" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Summarize overnight updates."

# Weekly on Monday at 6 AM
openclaw cron add \
  --name "Weekly review" \
  --cron "0 6 * * 1" \
  --session isolated \
  --message "Weekly deep analysis of project progress."
```

### Staggering

Recurring top-of-hour expressions are automatically staggered by up to 5 minutes to reduce load spikes. Use `--exact` to force precise timing or `--stagger 30s` for an explicit window.

## Day-of-Month and Day-of-Week OR Logic

Cron expressions are parsed by [croner](https://github.com/Hexagon/croner). When both the day-of-month and day-of-week fields are non-wildcard, croner matches when **either** field matches — not both.

```
# Intended: "9 AM on the 15th, only if it's a Monday"
# Actual:   "9 AM on every 15th, AND 9 AM on every Monday"
0 9 15 * 1
```

To require both conditions, use Croner's `+` day-of-week modifier (`0 9 15 * +1`) or guard the other condition in your job's prompt.

## Timezone Gotchas

- Cron without `--tz` uses the gateway host timezone
- `at` schedules without timezone are treated as UTC
- Heartbeat `activeHours` uses configured timezone resolution

## Related Pages

- [[cron-jobs|Scheduled Tasks]] — overview and quick start
- [[cron-webhooks|Cron: Webhooks]] — webhook delivery setup
- [[gateway-heartbeat|Heartbeat]] — timezone configuration for heartbeat
