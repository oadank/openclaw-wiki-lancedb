---
title: "Hooks: Troubleshooting"
summary: "Troubleshooting OpenClaw hooks: discovery issues, eligibility checks, execution problems, and common fixes"
category: references
tags:
  - openclaw
  - automation
  - hooks
  - troubleshooting
sources:
  - /opt/openclaw/data/workspace/refs/openclaw-docs/docs/automation/hooks.md
provenance: extracted
---

# Hooks: Troubleshooting

## Hook Not Discovered

```bash
# Verify directory structure
ls -la ~/.openclaw/hooks/my-hook/
# Should show: HOOK.md, handler.ts

# List all discovered hooks
openclaw hooks list
```

## Hook Not Eligible

```bash
openclaw hooks info my-hook
```

Check for missing binaries (PATH), environment variables, config values, or OS compatibility.

## Hook Not Executing

1. Verify the hook is enabled: `openclaw hooks list`
2. Restart your gateway process so hooks reload
3. Check gateway logs: `./scripts/clawlog.sh | grep hook`

## Gateway Startup Hook (boot-md)

The `boot-md` hook runs `BOOT.md` from the active workspace when the gateway starts. If you want workspace-specific boot logic, create a `BOOT.md` file in your workspace directory and ensure `boot-md` is enabled.

## Session Memory Hook Details

Extracts the last 15 user/assistant messages, generates a descriptive filename slug via LLM, and saves to `<workspace>/memory/YYYY-MM-DD-slug.md`. Requires `workspace.dir` to be configured.

## Command Logger Details

Logs every slash command to `~/.openclaw/logs/commands.log`.

## Bootstrap Extra Files Config

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "bootstrap-extra-files": {
          "enabled": true,
          "paths": ["packages/*/AGENTS.md", "packages/*/TOOLS.md"]
        }
      }
    }
  }
}
```

Paths resolve relative to workspace. Only recognized bootstrap basenames are loaded (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`).

## Related Pages

- [[hooks-overview|Hooks]] — overview and event types
- [[hooks-writing|Writing Hooks]] — hook development
- [[troubleshooting|Troubleshooting OpenClaw]] — general troubleshooting guide
