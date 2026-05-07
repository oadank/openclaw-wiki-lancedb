---
title: "OpenResponses API"
summary: "OpenResponses-compatible /v1/responses endpoint: item-based input, client tools, files, and streaming"
read_when:
  - Integrating clients using the OpenResponses API format
  - Sending files or images to the Gateway
category: gateway
tags: [gateway, http, api, responses, compatibility]
sources:
  - /opt/openclaw/data/workspace/refs/openclaw-docs/docs/gateway/openresponses-http-api.md
---

# OpenResponses API (HTTP)

Gateway serves an OpenResponses-compatible `POST /v1/responses` endpoint. **Disabled by default.**

## Enable

```json5
{
  gateway: { http: { endpoints: { responses: { enabled: true } } } }
}
```

Same auth/security rules as [[gateway/openai-http-api]].

## Request Shape (Supported)

| Field | Notes |
|-------|-------|
| `input` | String or array of item objects |
| `instructions` | Merged into system prompt |
| `tools` | Client function tool definitions |
| `tool_choice` | Filter or require client tools |
| `stream` | Enables SSE streaming |
| `max_output_tokens` | Best-effort output limit |
| `user` | Stable session routing |
| `previous_response_id` | Reuses earlier response session |

Ignored but accepted: `max_tool_calls`, `reasoning`, `metadata`, `store`, `truncation`.

## Items (Input)

| Item type | Behavior |
|-----------|----------|
| `message` (system/developer) | Appended to system prompt |
| `message` (user/assistant) | Current message + history context |
| `function_call_output` | Send tool results back to model |

## Client Tools

```json
{ "type": "function", "function": { "name": "get_weather", "parameters": {...} } }
```

Model returns `function_call` output item → send follow-up with `function_call_output`.

## Images (input_image)

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

Allowed MIME: `image/jpeg`, `png`, `gif`, `webp`, `heic`, `heif`. Max: 10MB.
HEIC/HEIF normalized to JPEG.

## Files (input_file)

```json
{
  "type": "input_file",
  "source": { "type": "base64", "media_type": "text/plain", "data": "..." }
}
```

Allowed MIME: `text/plain`, `text/markdown`, `text/html`, `text/csv`, `application/json`, `application/pdf`. Max: 5MB.

File content added to **system prompt** (ephemeral, not persisted). Wrapped as **untrusted external content** with boundary markers.

PDFs parsed for text first. If little text, first pages rasterized to images.

## Configurable Limits

```json5
{
  gateway: { http: { endpoints: { responses: {
    maxBodyBytes: 20000000,
    maxUrlParts: 8,
    files: { maxBytes: 5242880, maxChars: 200000 },
    images: { maxBytes: 1048560 },
  }}}}
}
```

URL fetch: `files.allowUrl: true`, `images.allowUrl: true` by default. Optional hostname allowlists. Private IP blocking always enforced.

## Streaming Events

`response.created`, `response.in_progress`, `response.output_item.added`, `response.output_text.delta`, `response.output_text.done`, `response.content_part.done`, `response.output_item.done`, `response.completed`, `response.failed`.

## Session Behavior

Stateless per request by default. Include `user` string for stable session routing.

## Related

- [[gateway/openai-http-api]] — Chat Completions endpoint
- [[gateway/tools-invoke]] — direct tool invocation
