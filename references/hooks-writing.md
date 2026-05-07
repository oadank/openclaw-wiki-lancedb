---
title: "Writing Hooks"
summary: "How to write OpenClaw hooks: directory structure, HOOK.md metadata, handler implementation, and event context details"
category: references
tags:
  - openclaw
  - automation
  - hooks
  - development
sources:
  - /opt/openclaw/data/workspace/refs/openclaw-docs/docs/automation/hooks.md
provenance: extracted
---

# Writing Hooks

## Hook Structure

Each hook is a directory containing two files:

```
my-hook/
├── HOOK.md          # Metadata + documentation
└── handler.ts       # Handler implementation
```

## HOOK.md Format

```markdown
---
name: my-hook
description: "Short description of what this hook does"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook

Detailed documentation goes here.
```

**Metadata fields** (`metadata.openclaw`):

| Field      | Description                                          |
| ---------- | ---------------------------------------------------- |
| `emoji`    | Display emoji for CLI                                |
| `events`   | Array of events to listen for                        |
| `export`   | Named export to use (defaults to `"default"`)        |
| `os`       | Required platforms (e.g., `["darwin", "linux"]`)     |
| `requires` | Required `bins`, `anyBins`, `env`, or `config` paths |
| `always`   | Bypass eligibility checks (boolean)                  |
| `install`  | Installation methods                                 |

## Handler Implementation

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  // Your logic here

  // Optionally send message to user
  event.messages.push("Hook executed!");
};

export default handler;
```

Each event includes: `type`, `action`, `sessionKey`, `timestamp`, `messages` (push to send to user), and `context` (event-specific data).

## Event Context Highlights

**Command events** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`.

**Message events** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (provider-specific data including `senderId`, `senderName`, `guildId`).

**Message events** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`.

**Message events** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`.

**Message events** (`message:preprocessed`): `context.bodyForAgent` (final enriched body), `context.from`, `context.channelId`.

**Bootstrap events** (`agent:bootstrap`): `context.bootstrapFiles` (mutable array), `context.agentId`.

**Session patch events** (`session:patch`): `context.sessionEntry`, `context.patch` (only changed fields), `context.cfg`. Only privileged clients can trigger patch events.

**Compaction events**: `session:compact:before` includes `messageCount`, `tokenCount`. `session:compact:after` adds `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`.

## Hook Packs

Hook packs are npm packages that export hooks via `openclaw.hooks` in `package.json`. Install with:

```bash
openclaw plugins install <path-or-spec>
```

Npm specs are registry-only (package name + optional exact version or dist-tag). Git/URL/file specs and semver ranges are rejected.

## Plugin Hooks

Plugins can register hooks through the Plugin SDK for deeper integration: intercepting tool calls, modifying prompts, controlling message flow, and more. The Plugin SDK exposes 28 hooks covering model resolution, agent lifecycle, message flow, tool execution, subagent coordination, and gateway lifecycle.

## Per-Hook Environment Variables

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "my-hook": {
          "enabled": true,
          "env": { "MY_CUSTOM_VAR": "value" }
        }
      }
    }
  }
}
```

## Extra Hook Directories

```json
{
  "hooks": {
    "internal": {
      "load": {
        "extraDirs": ["/path/to/more/hooks"]
      }
    }
  }
}
```

## Related Pages

- [[hooks-overview|Hooks]] — event types, discovery, bundled hooks
- [[hooks-cli|Hooks CLI Reference]] — CLI commands
