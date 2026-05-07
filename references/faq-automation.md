---
title: "FAQ: Skills and Automation"
summary: "Skills customization, sub-agents, cron jobs, scheduling, and automation workflows"
category: references
tags:
  - openclaw
  - faq
  - skills
  - automation
sources:
  - /opt/openclaw/data/workspace/refs/openclaw-docs/docs/help/faq.md
provenance:
  extracted: 0.85
  inferred: 0.15
  ambiguous: 0.0
---

# FAQ: Skills and Automation

Answers about skills customization, sub-agents, cron jobs, scheduling, and automation.

## Skills

### Customizing Skills Without Keeping the Repo Dirty

Use managed overrides instead of editing the repo copy:

- Put changes in `~/.openclaw/skills/<name>/SKILL.md`
- Add custom folders via `skills.load.extraDirs` in `openclaw.json`

Precedence:
`<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → bundled → `skills.load.extraDirs`

Managed overrides win over bundled skills without touching git.

### Loading Skills from a Custom Folder

Add extra directories via `skills.load.extraDirs` in `openclaw.json` (lowest precedence). Pair with `agents.defaults.skills` or `agents.list[].skills` to restrict skill visibility to specific agents.

### Installing Skills on Linux

Use native `openclaw skills` commands:

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills install <skill-slug> --version <version>
openclaw skills update --all
openclaw skills list --eligible
```

Skills are written to the active workspace `skills/` directory. For shared installs across agents, put skills under `~/.openclaw/skills`.

### Running Apple macOS-Only Skills from Linux

Three supported patterns:

1. **Run Gateway on a Mac** (simplest) — connect from Linux in remote mode or over Tailscale
2. **Use a macOS node** — pair a macOS node (menubar app) and run skills via the `nodes` tool
3. **Proxy macOS binaries over SSH** — create SSH wrappers for required binaries and override skill metadata to allow Linux

## Task Management and Automation

### Using Different Models for Different Tasks

Supported patterns:

- **Cron jobs**: set a `model` override per job
- **Sub-agents**: route tasks to separate agents with different default models
- **On-demand switch**: use `/model` to switch the current session model at any time

### Offloading Heavy Work Without Freezing the Bot

Use **sub-agents** for long or parallel tasks. Sub-agents run in their own session, return a summary, and keep your main chat responsive.

- Ask: "spawn a sub-agent for this task"
- Use `/subagents` command
- Use `/status` to see Gateway activity
- Set a cheaper model for sub-agents via `agents.defaults.subagents.model`

### Thread-Bound Subagent Sessions on Discord

Basic flow:
- Spawn with `sessions_spawn` using `thread: true`
- Or manually bind with `/focus <target>`
- Use `/agents` to inspect binding state
- Use `/session idle <duration|off>` and `/session max-age <duration|off>` to control auto-unfocus
- Use `/unfocus` to detach the thread

Required config:
- Global defaults: `session.threadBindings.*`
- Discord overrides: `channels.discord.threadBindings.*`
- Auto-bind on spawn: `channels.discord.threadBindings.spawnSubagentSessions: true`

## Cron Jobs and Scheduling

### Cron/Reminders Not Firing

Checklist:
1. Cron is enabled (`cron.enabled`) and `OPENCLAW_SKIP_CRON` is not set
2. Gateway is running 24/7 (no sleep/restarts)
3. Timezone settings match for the job and host

Debug:
```bash
openclaw cron run <jobId>
openclaw cron runs --id <jobId> --limit 50
```

### Cron Fired But Nothing Sent to Channel

Common reasons:
- `--no-deliver` / `delivery.mode: "none"` set on job
- Missing or invalid announce target (`channel` / `to`)
- Channel auth failures (`unauthorized`, `Forbidden`)
- Silent isolated result (`NO_REPLY` / `no_reply` only)
- Agent already sent directly with `message` tool

### Isolated Cron Run Switched Models or Retried

Isolated cron can persist a runtime model handoff and retry when the active run throws `LiveSessionModelSwitchError`. The retry keeps the switched provider/model and any auth profile override.

Retry loop is bounded: initial attempt plus 2 switch retries before abort.

## Heartbeat

### Heartbeat Keeps Skipping - Reasons

- `quiet-hours`: outside the configured active-hours window
- `empty-heartbeat-file`: `HEARTBEAT.md` exists but only contains blank/header-only scaffolding
- `no-tasks-due`: `HEARTBEAT.md` task mode is active but none of the task intervals are due yet
- `alerts-disabled`: all heartbeat visibility is disabled (`showOk`, `showAlerts`, and `useIndicator` are all off)

In task mode, due timestamps are only advanced after a real heartbeat run completes. Skipped runs do not mark tasks as completed.

## Related

- [[skills|Skills Documentation]] — comprehensive skill development guide
- [[automation|Automation and Tasks]] — task scheduling and automation reference
- [[sub-agents|Sub-agents]] — sub-agent configuration and usage
- [[cron-jobs|Cron Jobs]] — scheduled task documentation
