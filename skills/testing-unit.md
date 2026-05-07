---
title: "Testing: Unit Suite"
summary: "Unit and integration testing: commands, project shards, and best practices for local development"
category: skills
tags:
  - openclaw
  - testing
  - unit-tests
sources:
  - /opt/openclaw/data/workspace/refs/openclaw-docs/docs/help/testing.md
provenance: extracted
---

# Testing: Unit Suite

Comprehensive guide to unit and integration testing in OpenClaw.

## Commands

- **Default run:** `pnpm test`
- **Fast iteration:** `pnpm test:changed`
- **Watch mode:** `pnpm test:watch`
- **Full run:** `pnpm test:max`
- **Coverage gate:** `pnpm test:coverage`

## Project Architecture

The test suite runs as eleven smaller shard configs instead of one giant process:

- `core-unit-src`
- `core-unit-security`
- `core-unit-ui`
- `core-unit-support`
- `core-support-boundary`
- `core-contracts`
- `core-bundled`
- `core-runtime`
- `agentic`
- `auto-reply`
- `extensions`

This cuts peak RSS on loaded machines and avoids auto-reply/extension work starving unrelated suites.

## File Locations

Tests are located in:
- `src/**/*.test.ts`
- `packages/**/*.test.ts`
- `test/**/*.test.ts`
- Whitelisted UI node tests in `vitest.unit.config.ts`

## Changed-Mode Testing

Smart local gate for narrow work:

- `pnpm check:changed` — classifies diff into core, extensions, apps, docs, then runs matching typecheck/lint/test lanes
- `pnpm test:changed` — routes through scoped lanes when changed paths map cleanly to smaller suites
- Pre-commit hook runs `pnpm check:changed --staged` after staged formatting/linting

## Performance Profiling

- `pnpm test:perf:imports` — enables Vitest import-duration reporting plus import-breakdown output
- `pnpm test:perf:imports:changed` — scopes profiling to files changed since `origin/main`
- `pnpm test:perf:changed:bench` — compares routed tests against native root-project path for wall time + max RSS
- `pnpm test:perf:profile:main` — writes main-thread CPU profile for Vitest/Vite startup
- `pnpm test:perf:profile:runner` — writes runner CPU+heap profiles

## Contract Tests

Verify that every registered plugin and channel conforms to its interface contract.

### Commands

- **All contracts:** `pnpm test:contracts`
- **Channel contracts only:** `pnpm test:contracts:channels`
- **Provider contracts only:** `pnpm test:contracts:plugins`

### When to Run

- After changing plugin-sdk exports or subpaths
- After adding or modifying a channel or provider plugin
- After refactoring plugin registration or discovery

Contract tests run in CI and do not require real API keys.

## Offline Regressions (CI-Safe)

Real pipeline regressions without real providers:

- Gateway tool calling (mock OpenAI, real gateway + agent loop): `src/gateway/gateway.test.ts`
- Gateway wizard (WS `wizard.start`/`wizard.next`): `src/gateway/gateway.test.ts`

## Agent Reliability Evals

CI-safe tests that behave like "agent reliability evals":
- Mock tool-calling through real gateway + agent loop
- End-to-end wizard flows validating session wiring

## Related

- [[testing|Testing Overview]] — main testing documentation
- [[testing-e2e|Testing: E2E Suite]] — end-to-end test details
- [[testing-live|Testing: Live Suite]] — live model/provider tests
