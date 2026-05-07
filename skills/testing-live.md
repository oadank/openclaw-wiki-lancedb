---
title: "Testing: Live Suite"
summary: "Live testing: Model/provider probes, media generation, and real API integration tests"
category: skills
tags:
  - openclaw
  - testing
  - live-tests
  - models
sources:
  - /opt/openclaw/data/workspace/refs/openclaw-docs/docs/help/testing.md
provenance: extracted
---

# Testing: Live Suite

Live testing for OpenClaw, covering model and provider integration, media generation, and real API calls.

## Running Live Tests

### Basic Commands

- **Full live suite:** `pnpm test:live`
- **Target specific file:** `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- **Moonshot/Kimi cost smoke:** With `MOONSHOT_API_KEY` set, run:
  ```bash
  openclaw models list --provider moonshot --json
  openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json
  ```
  Verify JSON reports Moonshot/K2.6 and usage cost.

### Environment Variables

- `OPENCLAW_LIVE_TEST=1` — enable live tests
- `OPENCLAW_LIVE_MAX_MODELS=<number>` — limit number of models to test
- `OPENCLAW_LIVE_PROVIDERS=<provider1,provider2>` — filter providers
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` — force profile store auth, ignore env overrides

## Media Generation Live Tests

### Image Generation

- **Test:** `src/image-generation/runtime.live.test.ts`
- **Command:** `pnpm test:live src/image-generation/runtime.live.test.ts`
- **Harness:** `pnpm test:live:media image`
- **Scope:** Exercises every registered image-generation provider plugin
- **Supported providers:** OpenAI, Google, XAI
- **Optional narrowing:**
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,xai:default-generate,xai:default-edit"`

### Music Generation

- **Test:** `extensions/music-generation-providers.live.test.ts`
- **Enable:** `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- **Harness:** `pnpm test:live:media music`
- **Scope:** Exercises shared bundled music-generation provider path
- **Supported providers:** Google, MiniMax
- **Optional narrowing:**
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`

### Video Generation

- **Test:** `extensions/video-generation-providers.live.test.ts`
- **Enable:** `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- **Harness:** `pnpm test:live:media video`
- **Scope:** Exercises shared bundled video-generation provider path
- **Default smoke path:** Non-FAL providers, 1 text-to-video request per provider
- **Include FAL:** `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`
- **Full modes:** `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` to run image-to-video and video-to-video where supported
- **Optional narrowing:**
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`

### Media Live Harness

- **Command:** `pnpm test:live:media`
- **Purpose:** Runs shared image, music, video live suites through one repo-native entrypoint
- **Features:**
  - Auto-loads missing provider env vars from `~/.profile`
  - Auto-narrows to providers with usable auth by default
  - Reuses `scripts/test-live.mjs` for consistent behavior
- **Examples:**
  ```bash
  pnpm test:live:media
  pnpm test:live:media image video --providers openai,google,minimax
  pnpm test:live:media video --video-providers openai,runway --all-providers
  pnpm test:live:media music --quiet
  ```

## Provider-Specific Live Tests

### ComfyUI Workflow Media

- **Test:** `extensions/comfy/comfy.live.test.ts`
- **Enable:** `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- **Scope:** Exercises bundled comfy image, video, and `music_generate` paths
- **Skips:** Capability if not configured in the provider

### Vydra Video

- **Enable:** `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
- **Scope:** Runs `veo3` text-to-video plus `kling` lane with remote image URL fixture by default

## Related

- [[testing|Testing Overview]] — main testing documentation
- [[models|Models Configuration]] — model provider setup
- [[testing-docker|Testing: Docker Runners]] — Docker-backed live test runners
