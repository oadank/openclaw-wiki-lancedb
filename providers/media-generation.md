---
title: "Media Generation Providers"
category: "providers"
tags: ["comfyui", "runway", "fal", "deepgram", "image-generation", "video-generation", "speech"]
sources: ["refs/openclaw-docs/docs/providers/comfy.md", "refs/openclaw-docs/docs/providers/runway.md", "refs/openclaw-docs/docs/providers/fal.md", "refs/openclaw-docs/docs/providers/deepgram.md"]
updated: "2026-04-24"
summary: "Media generation: ComfyUI workflows, Runway video, fal image/video, Deepgram transcription"
provenance:
  extracted: 0.9
  inferred: 0.1
  ambiguous: 0.0
---

# Media Generation Providers

Providers specialized in image, video, music generation and audio transcription.

## ComfyUI

| Property | Value |
|----------|-------|
| Provider | `comfy` |
| Model | `comfy/workflow` |
| Auth | None (local) or `COMFY_API_KEY` / `COMFY_CLOUD_API_KEY` |
| Surfaces | `image_generate`, `video_generate`, `music_generate` |

Entirely workflow-driven — OpenClaw does not map generic controls onto your graph. Supports local (`http://127.0.0.1:8188`) and Comfy Cloud modes.

Config per capability (`image`, `video`, `music`):
- `workflowPath` — workflow JSON file
- `promptNodeId` — node receiving text prompt
- `outputNodeId` — node to read output from (omit for all matching nodes)
- `inputImageNodeId` — for reference image editing

Legacy flat config (top-level `workflowPath`) still works for image-only setups.

## Runway

| Property | Value |
|----------|-------|
| Provider | `runway` |
| Auth | `RUNWAYML_API_SECRET` or `RUNWAY_API_KEY` |
| API | Task-based (`GET /v1/tasks/{id}` polling) |

| Mode | Model | Reference Input |
|------|-------|----------------|
| Text-to-video | `gen4.5` | None |
| Image-to-video | `gen4.5` | 1 local or remote image |
| Video-to-video | `gen4_aleph` | 1 local or remote video |

## fal

| Property | Value |
|----------|-------|
| Provider | `fal` |
| Auth | `FAL_KEY` (or `FAL_API_KEY`) |

**Image:** Default `fal/fal-ai/flux/dev`. Max 4 images, edit mode with 1 reference. ⚠️ Edit endpoint does NOT support `aspectRatio`.

**Video:** Default `fal/fal-ai/minimax/video-01-live`. Queue-backed submit/status/result flow. Also supports HeyGen video-agent and Seedance 2.0 models.

## Deepgram (Audio Transcription)

| Property | Value |
|----------|-------|
| Provider | `deepgram` |
| Auth | `DEEPGRAM_API_KEY` |
| Default model | `nova-3` |
| Type | Pre-recorded (not streaming) |

Used for inbound voice note transcription via `tools.media.audio`:
```json5
{ tools: { media: { audio: { enabled: true, models: [{ provider: "deepgram", model: "nova-3" }] } } } }
```

Options: `language`, `detect_language`, `punctuate`, `smart_format`. Output follows shared audio rules (size caps, timeouts, transcript injection with `{{Transcript}}` + `[Audio]` block).

## Related
- [[image-generation-providers]] — More image providers (MiniMax, xAI, etc.)
- [[video-generation-providers]] — More video providers
- [[speech-providers]] — More speech providers
