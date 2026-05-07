---
title: "Tools and Plugins"
category: tools
tags:
  - overview
  - tools
  - plugins
  - skills
sources:
  - "/opt/openclaw/data/workspace/refs/openclaw-docs/docs/tools/index.md"
summary: "OpenClaw tools and plugins overview: what the agent can do and how to extend it"
provenance:
  extracted: 1.0
  inferred: 0.0
  ambiguous: 0.0
---

# Tools and Plugins

Everything the agent does beyond generating text happens through **tools**. Tools are how the agent reads files, runs commands, browses the web, sends messages, and interacts with devices.

## Tools, Skills, and Plugins

OpenClaw has three layers that work together:

1. **Tools** are what the agent calls — typed functions like `exec`, `browser`, `web_search`, `message`. OpenClaw ships with built-in tools, and plugins can register additional ones.
2. **Skills** teach the agent when and how — markdown files (`SKILL.md`) injected into the system prompt with context, constraints, and step-by-step guidance.
3. **Plugins** package everything together — can register channels, model providers, tools, skills, speech, realtime transcription, media understanding, and more.

## Built-in Tools

These tools ship with OpenClaw and are available without installing plugins:

| Tool                                       | What it does                                                          | Page                                        |
| ------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------- |
| `exec` / `process`                         | Run shell commands, manage background processes                       | [[exec|Exec]]                               |
| `code_execution`                           | Run sandboxed remote Python analysis                                  | [[code-execution|Code Execution]]           |
| `browser`                                  | Control a Chromium browser (navigate, click, screenshot)              | [[browser|Browser]]                         |
| `web_search` / `x_search` / `web_fetch`    | Search the web, search X posts, fetch page content                    | [[web-search|Web Search]]                   |
| `read` / `write` / `edit`                  | File I/O in the workspace                                             |                                             |
| `apply_patch`                              | Multi-hunk file patches                                               | [[apply-patch|Apply Patch]]                 |
| `message`                                  | Send messages across all channels                                     | [[agent-send|Agent Send]]                   |
| `canvas`                                   | Drive node Canvas (present, eval, snapshot)                           |                                             |
| `nodes`                                    | Discover and target paired devices                                    |                                             |
| `cron` / `gateway`                         | Manage scheduled jobs; inspect, patch, restart, or update the gateway |                                             |
| `image` / `image_generate`                 | Analyze or generate images                                            | [[image-generation|Image Generation]]       |
| `music_generate`                           | Generate music tracks                                                 | [[music-generation|Music Generation]]       |
| `video_generate`                           | Generate videos                                                       |                                             |
| `tts`                                      | One-shot text-to-speech conversion                                    |                                             |
| `sessions_*` / `subagents` / `agents_list` | Session management, status, and sub-agent orchestration               | [[sub-agents|Sub-agents]]                   |
| `session_status`                           | Lightweight `/status`-style readback and session model override       |                                             |

## Plugin-provided Tools

Plugins can register additional tools. Some examples:
- [[diffs|Diffs]] — diff viewer and renderer
- [[llm-task|LLM Task]] — JSON-only LLM step for structured output
- [[lobster|Lobster]] — typed workflow runtime with resumable approvals
- [[openprose|OpenProse]] — markdown-first workflow orchestration
- [[tokenjuice|Tokenjuice]] — compact noisy `exec`/`bash` tool results

## Tool Configuration

### Allow and Deny Lists

Control which tools the agent can call via `tools.allow`/`tools.deny` in config. Deny always wins over allow:

```json5
{
  tools: {
    allow: ["group:fs", "browser", "web_search"],
    deny: ["exec"],
  },
}
```

### Tool Profiles

`tools.profile` sets a base allowlist before `allow`/`deny` is applied. Per-agent override: `agents.list[].tools.profile`.

| Profile     | What it includes                                                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `full`      | No restriction (same as unset)                                                                                                                    |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `music_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `minimal`   | `session_status` only                                                                                                                             |

### Tool Groups

Use `group:*` shorthands in allow/deny lists:

| Group              | Tools                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | exec, process, code_execution                                                                             |
| `group:fs`         | read, write, edit, apply_patch                                                                            |
| `group:sessions`   | sessions_list, sessions_history, sessions_send, sessions_spawn, sessions_yield, subagents, session_status |
| `group:memory`     | memory_search, memory_get                                                                                 |
| `group:web`        | web_search, x_search, web_fetch                                                                           |
| `group:ui`         | browser, canvas                                                                                           |
| `group:automation` | cron, gateway                                                                                             |
| `group:messaging`  | message                                                                                                   |
| `group:nodes`      | nodes                                                                                                     |
| `group:agents`     | agents_list                                                                                               |
| `group:media`      | image, image_generate, music_generate, video_generate, tts                                                |
| `group:openclaw`   | All built-in OpenClaw tools (excludes plugin tools)                                                       |

### Provider-specific Restrictions

Use `tools.byProvider` to restrict tools for specific providers without changing global defaults:

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
    },
  },
}
```

## Related

- [[plugin|Plugin System]]
- [[skills-config|Skills Configuration]]
- [[exec|Exec Tool]]
- [[lobster|Lobster]]
