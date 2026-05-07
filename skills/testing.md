---
title: "Testing OpenClaw"
summary: "Testing kit overview: unit/e2e/live suites, Docker runners, and what each test covers"
category: skills
tags:
  - openclaw
  - testing
  - development
sources:
  - /opt/openclaw/data/workspace/refs/openclaw-docs/docs/help/testing.md
provenance: extracted
---

# Testing

OpenClaw has three Vitest suites (unit/integration, e2e, live) and Docker runners.

## Quick Start

### Common Commands

- **Full gate (before push):** `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- **Fast local run:** `pnpm test:max`
- **Direct Vitest watch:** `pnpm test:watch`
- **Direct file targeting:** `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- **Docker QA site:** `pnpm qa:lab:up`
- **Linux VM QA lane:** `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

### When Touching Tests

- **Coverage gate:** `pnpm test:coverage`
- **E2E suite:** `pnpm test:e2e`

### Live/Debugging

- **Live suite:** `pnpm test:live`
- **Target one live file:** `pnpm test:live -- src/agents/models.profiles.live.test.ts`

## Test Suites Overview

### Unit / Integration Suite

- **Command:** `pnpm test`
- **Scope:** Pure unit tests, in-process integration tests (gateway auth, routing, tooling, parsing, config)
- **Requirements:** No real keys, fast and stable
- **Runs in CI:** Yes

### E2E Suite

- **Command:** `pnpm test:e2e`
- **Scope:** End-to-end behavior, browser automation, multi-step workflows
- **Requirements:** May need real keys for some scenarios

### Live Suite

- **Command:** `pnpm test:live`
- **Scope:** Model/provider probes, gateway tool/image tests, real API calls
- **Requirements:** Real API keys, opt-in via env vars

## Related Pages

- [[testing-unit|Testing: Unit Suite]] — unit and integration test details
- [[testing-e2e|Testing: E2E Suite]] — end-to-end test details
- [[testing-live|Testing: Live Suite]] — live model/provider tests
- [[testing-docker|Testing: Docker Runners]] — Docker-backed test runners
- [[testing-qa|Testing: QA Scenarios]] — QA scenario system
