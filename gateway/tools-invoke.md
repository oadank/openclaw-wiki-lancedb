---
title: "Tools Invoke API"
summary: "HTTP endpoint for invoking a single tool directly without running a full agent turn"
read_when:
  - Calling tools directly via HTTP for automation
  - Building external integrations that need tool access
category: gateway
tags: [gateway, http, api, tools, automation]
sources:
  - /opt/openclaw/data/workspace/refs/openclaw-docs/docs/gateway/tools-invoke-http-api.md
---

# Tools Invoke (HTTP)

Direct tool invocation via `POST /tools/invoke`. Always enabled, uses Gateway auth + tool policy.

## Request Body

```json
{
  "tool": "sessions_list",
  "action": "json",
  "args": {},
  "sessionKey": "main",
  "dryRun": false
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `tool` | Yes | Tool name |
| `action` | No | Mapped into args if tool schema supports it |
| `args` | No | Tool-specific arguments |
| `sessionKey` | No | Target session (defaults to main) |
| `dryRun` | No | Reserved, currently ignored |

## Auth & Security

Same as [[gateway/openai-http-api]] — valid bearer token = full operator access.

## Policy + Routing

Tool availability filtered through same policy chain as agents:
- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.deny`
- Agent-level overrides
- Group policies
- Subagent policy

If tool not allowed by policy → **404**.

## Hard Deny List (Default)

These tools are **always blocked** over HTTP `/tools/invoke`:

| Tool | Reason |
|------|--------|
| `exec`, `spawn`, `shell` | RCE surface |
| `fs_write`, `fs_delete`, `fs_move`, `apply_patch` | Arbitrary file mutation |
| `sessions_spawn`, `sessions_send` | Session orchestration / RCE |
| `cron` | Persistent automation control |
| `gateway` | Gateway control plane |
| `nodes` | Can reach system.run on paired hosts |
| `whatsapp_login` | Interactive setup (hangs on HTTP) |

Customize via `gateway.tools.deny` / `gateway.tools.allow`.

## Responses

| Status | Meaning |
|--------|---------|
| 200 | `{ ok: true, result }` |
| 400 | Invalid request or tool input error |
| 401 | Unauthorized |
| 404 | Tool not available (not found or not allowlisted) |
| 429 | Auth rate-limited |
| 500 | Unexpected tool execution error |

## Example

```bash
curl -sS http://127.0.0.1:18789/tools/invoke \
  -H 'Authorization: Bearer secret' \
  -H 'Content-Type: application/json' \
  -d '{"tool":"sessions_list","action":"json","args":{}}'
```

## Related

- [[gateway/openai-http-api]] — Chat Completions endpoint
- [[gateway/openresponses-api]] — OpenResponses endpoint
- [[gateway/security]] — security considerations
