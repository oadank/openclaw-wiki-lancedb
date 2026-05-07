---
title: "Background Tasks"
category: concepts
tags: [automation, background-tasks]
summary: "Background task tracking for ACP runs, subagents, isolated cron jobs, and CLI operations"
sources: ["/opt/openclaw/data/workspace/refs/openclaw-docs/docs/automation/tasks.md"]
updated: "2026-04-23T10:00:00Z"
provenance:
  extracted: 0.85
  inferred: 0.15
  ambiguous: 0.0
---

# Background Tasks

Background tasks track work that runs **outside your main conversation session**: ACP runs, subagent spawns, isolated [[cron|cron job]] executions, and CLI-initiated operations.

Tasks are **records**, not schedulers — [[cron|cron]] and [[heartbeat|heartbeat]] decide *when* work runs; tasks track *what happened*.

> **Looking for scheduling?** See [[automation|Automation & Tasks]] for choosing the right mechanism.

## What Creates Tasks

| Source                 | Runtime type | Default notify policy |
| ---------------------- | ------------ | --------------------- |
| ACP background runs    | `acp`        | `done_only`           |
| Subagent orchestration | `subagent`   | `done_only`           |
| [[cron|Cron jobs]] (all types) | `cron` | `silent`         |
| CLI operations         | `cli`        | `silent`              |

> [!Note]
> Heartbeat turns and normal interactive chat do **not** create tasks.

## Task Lifecycle

```
queued → running → succeeded
                   ↓
              failed | timed_out | cancelled | lost
```

| Status       | What it means                                         |
| ------------ | ----------------------------------------------------- |
| `queued`     | Created, waiting for the agent to start              |
| `running`   | Agent turn is actively executing                     |
| `succeeded`  | Completed successfully                               |
| `failed`     | Completed with an error                              |
| `timed_out`  | Exceeded the configured timeout                       |
| `cancelled`  | Stopped by operator via `openclaw tasks cancel`      |
| `lost`       | Runtime lost authoritative backing state (5 min grace) |

## CLI Commands

```bash
# List all tasks (newest first)
openclaw tasks list

# Show details for a specific task
openclaw tasks show <lookup>

# Cancel a running task
openclaw tasks cancel <lookup>

# Change notification policy
openclaw tasks notify <lookup> state_changes

# Audit for operational issues
openclaw tasks audit

# Maintenance: preview or apply cleanup
openclaw tasks maintenance --apply

# Inspect Task Flow state
openclaw tasks flow list
openclaw tasks flow show <lookup>
openclaw tasks flow cancel <lookup>
```

## Notification Policies

| Policy             | What is delivered                                   |
| ------------------ | --------------------------------------------------- |
| `done_only` (default) | Only terminal state (succeeded, failed, etc.)  |
| `state_changes`    | Every state transition and progress update         |
| `silent`           | Nothing at all                                      |

## Delivery

When a task reaches a terminal state, OpenClaw notifies you via **direct delivery** (channel like Telegram/Discord) or **session-queued delivery** (system event surfaced on next [[heartbeat|heartbeat]]).

Task completion triggers an immediate heartbeat wake so you see the result quickly.

## Audit Findings

`openclaw tasks audit` surfaces these issues:

| Finding                    | Severity | Trigger                              |
| -------------------------- | -------- | ------------------------------------ |
| `stale_queued`             | warn     | Queued for more than 10 minutes      |
| `stale_running`           | error    | Running for more than 30 minutes     |
| `lost`                     | error    | Runtime-backed task ownership gone   |
| `delivery_failed`          | warn     | Delivery failed, notify not `silent` |

## Storage

- Task records persist in SQLite at `$OPENCLAW_STATE_DIR/tasks/runs.sqlite`
- Terminal records are kept for **7 days**, then automatically pruned
- A sweeper runs every **60 seconds** for reconciliation, cleanup stamping, and pruning

## How Tasks Relate to Other Systems

- **[[taskflow|Task Flow]]** orchestrates multiple tasks via managed or mirrored sync modes
- **[[cron|Cron]]** creates a task for every execution (main-session and isolated)
- **[[heartbeat|Heartbeat]]** runs are main-session turns and do **not** create task records
- A task may reference a `childSessionKey` (where work runs) and a `requesterSessionKey` (who started it)

## Related

- [[automation|Automation & Tasks]] — all automation mechanisms at a glance
- [[taskflow|Task Flow]] — flow orchestration above tasks
- [[cron|Scheduled Tasks]] — scheduling background work
- [[heartbeat|Heartbeat]] — periodic main-session turns
- [[faq-automation|FAQ: Skills and Automation]] — cron scheduling, automation workflows
- [[troubleshooting|Troubleshooting OpenClaw]] — debugging delivery failures
