---
title: "FAQ: Sessions and Chats"
summary: "Session management, multi-agent routing, compaction, and chat configuration"
category: references
tags:
  - openclaw
  - faq
  - sessions
  - chats
sources:
  - /opt/openclaw/data/workspace/refs/openclaw-docs/docs/help/faq.md
provenance:
  extracted: 0.85
  inferred: 0.15
  ambiguous: 0.0
---

# FAQ: Sessions and Chats

Answers about session management, multi-agent routing, compaction, and chat configuration.

## Session Management

### Starting a Fresh Conversation

Send `/new` or `/reset` as a standalone message.

### Automatic Session Reset

Sessions can expire after `session.idleMinutes`, but this is **disabled by default** (default **0**). Set to a positive value to enable idle expiry:

```json5
{
  session: {
    idleMinutes: 240, // 4 hours
  },
}
```

The next message after the idle period starts a fresh session id for that chat key. This does not delete transcripts.

### Completely Resetting OpenClaw

Use the reset command:

```bash
openclaw reset
```

Non-interactive full reset:

```bash
openclaw reset --scope full --yes --non-interactive
```

Then re-run setup:

```bash
openclaw onboard --install-daemon
```

## Multi-Agent Setup

### Creating a Team of OpenClaw Instances

Use **multi-agent routing** and **sub-agents**:
- Create one coordinator agent and several worker agents with their own workspaces and models
- This is best seen as a **fun experiment** — it is token heavy and often less efficient than using one bot with separate sessions

### Sub-Agents for Parallel Work

Use sub-agents for long or parallel tasks:
- Sub-agents run in their own session, return a summary, and keep your main chat responsive
- Ask: "spawn a sub-agent for this task" or use `/subagents` command
- Use `/status` to see Gateway activity
- Set a cheaper model for sub-agents via `agents.defaults.subagents.model`

## Context Management

### Context Truncated Mid-Task - Prevention

Session context is limited by the model window. Long chats, large tool outputs, or many files can trigger compaction or truncation.

What helps:
- Ask the bot to summarize the current state and write it to a file
- Use `/compact` before long tasks, and `/new` when switching topics
- Keep important context in the workspace and ask the bot to read it back
- Use sub-agents for long or parallel work
- Pick a model with a larger context window if this happens often

### "Context Too Large" Errors - Fix

Options:

1. **Compact** (keeps conversation but summarizes older turns):
   ```
   /compact
   ```
   Use `/compact <instructions>` to guide the summary.

2. **Reset** (fresh session ID for the same chat key):
   ```
   /new
   /reset
   ```

If it keeps happening:
- Enable or tune **session pruning** (`agents.defaults.contextPruning`) to trim old tool output
- Use a model with a larger context window

### "LLM request rejected: messages.content.tool_use.input field required" Error

This is a provider validation error: the model emitted a `tool_use` block without the required `input`. It usually means the session history is stale or corrupted.

**Fix:** start a fresh session with `/new` (standalone message).

## Heartbeat Configuration

### Frequent Heartbeat Messages

Heartbeats run every **30m** by default (**1h** when using OAuth auth). Tune or disable:

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "2h", // or "0m" to disable
      },
    },
  },
}
```

If `HEARTBEAT.md` exists but is effectively empty, OpenClaw skips the heartbeat run to save API calls.

## Chat Configuration

### WhatsApp Group Setup

You don't need to add a "bot account" to a WhatsApp group — OpenClaw runs on **your own account**. By default, group replies are blocked until you allow senders:

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"], // your phone number
    },
  },
}
```

### Discord Thread Binding

You can bind a Discord thread to a subagent or session target so follow-up messages stay on that bound session:

1. Spawn with `sessions_spawn` using `thread: true`
2. Or manually bind with `/focus <target>`
3. Use `/agents` to inspect binding state
4. Use `/unfocus` to detach the thread

## Related

- [[sessions|Session Management]] — full session documentation
- [[multi-agent|Multi-agent Routing]] — multi-agent setup and configuration
- [[compaction|Context Compaction]] — how context compaction works
- [[faq-automation|FAQ: Skills and Automation]] — automation and sub-agent questions
