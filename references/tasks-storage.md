---
title: "Tasks Storage and Maintenance"
summary: "Background task storage in SQLite, automatic maintenance (reconciliation, cleanup, pruning), and integration with other systems"
category: references
tags:
  - openclaw
  - automation
  - tasks
  - maintenance
sources:
  - /opt/openclaw/data/workspace/refs/openclaw-docs/docs/automation/tasks.md
provenance: extracted
---

# Tasks Storage and Maintenance

## Where Tasks Live

Task records persist in SQLite at:

```
$OPENCLAW_STATE_DIR/tasks/runs.sqlite
```

The registry loads into memory at gateway start and syncs writes to SQLite for durability across restarts.

## Automatic Maintenance

A sweeper runs every **60 seconds** and handles three things:

1. **Reconciliation** — checks whether active tasks still have authoritative runtime backing. ACP/subagent tasks use child-session state, cron tasks use active-job ownership, and chat-backed CLI tasks use the owning run context. If that backing state is gone for more than 5 minutes, the task is marked `lost`.
2. **Cleanup stamping** — sets a `cleanupAfter` timestamp on terminal tasks (endedAt + 7 days).
3. **Pruning** — deletes records past their `cleanupAfter` date.

**Retention**: terminal task records are kept for **7 days**, then automatically pruned. No configuration needed.

## How Tasks Relate to Other Systems

### Tasks and Task Flow

[[taskflow|Task Flow]] is the flow orchestration layer above background tasks. A single flow may coordinate multiple tasks over its lifetime using managed or mirrored sync modes. Use `openclaw tasks` to inspect individual task records and `openclaw tasks flow` to inspect the orchestrating flow.

### Tasks and Cron

A cron job **definition** lives in `~/.openclaw/cron/jobs.json`; runtime execution state lives beside it in `~/.openclaw/cron/jobs-state.json`. **Every** cron execution creates a task record — both main-session and isolated. Main-session cron tasks default to `silent` notify policy so they track without generating notifications.

See [[cron-jobs|Scheduled Tasks]].

### Tasks and Heartbeat

Heartbeat runs are main-session turns — they do not create task records. When a task completes, it can trigger a heartbeat wake so you see the result promptly.

See [[gateway-heartbeat|Heartbeat]].

### Tasks and Sessions

A task may reference a `childSessionKey` (where work runs) and a `requesterSessionKey` (who started it). Sessions are conversation context; tasks are activity tracking on top of that.

### Tasks and Agent Runs

A task's `runId` links to the agent run doing the work. Agent lifecycle events (start, end, error) automatically update the task status — you do not need to manage the lifecycle manually.

## Related Pages

- [[background-tasks|Background Tasks]] — overview and lifecycle
- [[tasks-cli|Tasks CLI Reference]] — CLI commands for managing tasks
- [[cron-jobs|Scheduled Tasks]] — how cron creates task records
