---
title: "Task Flow"
category: concepts
tags: [automation, orchestration]
summary: "Durable multi-step flow orchestration above background tasks, with managed and mirrored sync modes"
sources: ["/opt/openclaw/data/workspace/refs/openclaw-docs/docs/automation/taskflow.md"]
updated: "2026-04-23T10:00:00Z"
provenance:
  extracted: 0.85
  inferred: 0.15
  ambiguous: 0.0
---

# Task Flow

Task Flow is the flow orchestration layer above [[tasks|background tasks]]. It coordinates multi-step workflows where you need durable progress tracking across [[gateway|gateway]] restarts.

> A plain [[tasks|task]] is sufficient for single background operations. Use Task Flow for pipelines.

| Scenario                              | Use                        |
| ------------------------------------- | -------------------------- |
| Single background job                 | Plain [[tasks|task]]       |
| Multi-step pipeline (A then B then C) | Task Flow (managed)        |
| Observe externally created tasks      | Task Flow (mirrored)       |
| One-shot reminder                     | [[cron|Cron job]]          |

## Sync Modes

### Managed Mode

Task Flow owns the lifecycle end-to-end: creates tasks as flow steps, drives them to completion, and advances flow state automatically.

Example: a weekly report flow that (1) gathers data, (2) generates the report, and (3) delivers it.

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Mirrored Mode

Task Flow observes externally created tasks and keeps flow state in sync without owning task creation. Useful when tasks are triggered by [[cron|cron jobs]], CLI commands, or other sources.

Example: three independent cron jobs that together form a "morning ops" routine.

## Durable State and Revision Tracking

Each flow persists its own state and tracks revisions so progress survives gateway restarts. Revision tracking enables conflict detection when multiple sources attempt to advance the same flow concurrently.

## Cancel Behavior

`openclaw tasks flow cancel` sets a sticky cancel intent on the flow. Active tasks within the flow are cancelled, and no new steps are started. The cancel intent persists across restarts.

## CLI Commands

| Command                               | Description                                   |
| ------------------------------------- | --------------------------------------------- |
| `openclaw tasks flow list`            | Shows tracked flows with status and sync mode |
| `openclaw tasks flow show <id>`       | Inspect one flow by flow id or lookup key     |
| `openclaw tasks flow cancel <id>`     | Cancel a running flow and its active tasks    |

## How Flows Relate to Tasks

Flows coordinate tasks, not replace them. A single flow may drive multiple [[tasks|background tasks]] over its lifetime. Use `openclaw tasks` to inspect individual task records and `openclaw tasks flow` to inspect the orchestrating flow.

## Related

- [[tasks|Background Tasks]] — the detached work ledger that flows coordinate
- [[automation|Automation & Tasks]] — all automation mechanisms at a glance
- [[cron|Scheduled Tasks]] — scheduled jobs that may feed into flows
