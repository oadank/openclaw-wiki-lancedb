---
title: "Testing: E2E Suite"
summary: "End-to-end testing: Gateway stability tests, Docker integration runners, and real-world scenario validation"
category: skills
tags:
  - openclaw
  - testing
  - e2e-tests
sources:
  - /opt/openclaw/data/workspace/refs/openclaw-docs/docs/help/testing.md
provenance: extracted
---

# Testing: E2E Suite

End-to-end testing for OpenClaw, covering Gateway stability and Docker integration runners.

## Gateway Stability Tests

### Command

```bash
pnpm test:stability:gateway
```

Config: `vitest.gateway.config.ts`, forced to one worker.

### Scope

Star-shaped Gateway scenarios:
- Gateway starts on clean config
- Wizard flows over WebSocket
- Auth token writes and persistence
- Channel plugin discovery and activation
- Gateway restart resilience

## Docker Integration Runners

Docker runners split into two buckets:

### Live-Model Runners

Run matching profile-key live files inside the repo Docker image:

- **Direct models:** `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- **ACP bind smoke:** `pnpm test:docker:live-acp-bind`
- **CLI backend smoke:** `pnpm test:docker:live-cli-backend`
- **Gateway + dev agent:** `pnpm test:docker:live-gateway`

Default smoke caps:
- `test:docker:live-models` defaults to `OPENCLAW_LIVE_MAX_MODELS=12`
- `test:docker:live-gateway` defaults to `OPENCLAW_LIVE_GATEWAY_SMOKE=1`, max models=8

### Container Smoke Runners

- `pnpm test:docker:openwebui` — Open WebUI integration smoke
- `pnpm test:docker:onboard` — onboarding wizard (TTY, full scaffolding)
- `pnpm test:docker:gateway-network` — two containers, WS auth + health
- `pnpm test:docker:mcp-channels` — MCP channel bridge
- `pnpm test:docker:pi-bundle-mcp-tools` — Pi bundle MCP tools
- `pnpm test:docker:plugins` — plugin install smoke
- `pnpm test:docker:bundled-channel-deps` — bundled plugin runtime deps

### Docker Commands

- **All Docker tests:** `pnpm test:docker:all` — builds live Docker image once, runs all Docker lanes
- **Skip Docker rebuild:** `OPENCLAW_SKIP_DOCKER_BUILD=1`

## Useful Docker Environment Variables

- `OPENCLAW_CONFIG_DIR=...` — mounted to `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` — mounted to `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` — mounted to `/home/node/.profile`, sourced before tests
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` — narrow the run
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` — ensure creds come from profile store

## Related

- [[testing|Testing Overview]] — main testing documentation
- [[testing-unit|Testing: Unit Suite]] — unit and integration tests
- [[testing-live|Testing: Live Suite]] — live model/provider tests
- [[testing-docker|Testing: Docker Runners]] — Docker-backed test runners
