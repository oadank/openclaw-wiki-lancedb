---
title: "Cron: Managing Jobs"
summary: "CLI commands for listing, showing, editing, running, and deleting cron jobs; model overrides and agent selection"
category: references
tags:
  - openclaw
  - automation
  - cron
  - cli
sources:
  - /opt/openclaw/data/workspace/refs/openclaw-docs/docs/automation/cron-jobs.md
provenance: extracted
---

# Cron: Managing Jobs

## Managing Jobs

```bash
# List all jobs
openclaw cron list

# Show one job, including resolved delivery route
openclaw cron show <jobId>

# Edit a job
openclaw cron edit <jobId> --message "Updated prompt" --model "opus"

# Force run a job now
openclaw cron run <jobId>

# Run only if due
openclaw cron run <jobId> --due

# View run history
openclaw cron runs --id <jobId> --limit 50

# Delete a job
openclaw cron remove <jobId>

# Agent selection (multi-agent setups)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops
openclaw cron edit <jobId> --clear-agent
```

## Model Override

- `openclaw cron add|edit --model ...` changes the job's selected model
- If the model is allowed, that exact provider/model reaches the isolated agent run
- If it is not allowed, cron warns and falls back to the job's agent/default model selection
- Configured fallback chains still apply, but a plain `--model` override with no explicit per-job fallback list no longer falls through to the agent primary as a silent extra retry target

## CLI Examples

### One-Shot Reminder (Main Session)

```bash
openclaw cron add \
  --name "Calendar check" \
  --at "20m" \
  --session main \
  --system-event "Next heartbeat: check calendar." \
  --wake now
```

### Recurring Isolated Job

```bash
openclaw cron add \
  --name "Morning brief" \
  --cron "0 7 * * *" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Summarize overnight updates." \
  --announce \
  --channel slack \
  --to "channel:C1234567890"
```

### Isolated Job with Model and Thinking Override

```bash
openclaw cron add \
  --name "Deep analysis" \
  --cron "0 6 * * 1" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Weekly deep analysis of project progress." \
  --model "opus" \
  --thinking high \
  --announce
```

## Related Pages

- [[cron-jobs|Scheduled Tasks]] — overview and cron basics
- [[cron-schedules|Cron: Schedule Types]] — schedule types and expressions
- [[cron-delivery|Cron: Delivery and Output]] — delivery modes and notification
