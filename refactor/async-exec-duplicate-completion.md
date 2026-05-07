---
title: "Async Exec Duplicate Completion Investigation"
category: refactor
tags: [debugging, race-conditions, exec, sessions]
sources:
  - /opt/openclaw/data/workspace/refs/openclaw-docs/docs/refactor/async-exec-duplicate-completion-investigation.md
created: "2026-04-24T16:30:00Z"
updated: "2026-04-24T16:30:00Z"
summary: "Investigation into duplicate async exec completion recordings — most likely caused by duplicate session injection via exec.finished path without runId idempotency check."
provenance:
  extracted: 1.0
  inferred: 0.0
  ambiguous: 0.0
---

# Async Exec Duplicate Completion Investigation

## Scope

- Session: `agent:main:telegram:group:-1003774691294:topic:1`
- Symptom: Same async exec completion for session/run `keen-nexus` recorded twice in LCM as user turns
- Goal: Identify whether this is duplicate session injection or outbound delivery retry

## Conclusion

Most likely **duplicate session injection**, not plain outbound delivery retry.

The strongest gateway-side gap is in the **node exec completion path**:

1. Node-side exec finish emits `exec.finished` with full `runId`
2. Gateway `server-node-events` converts to system event and requests heartbeat
3. Heartbeat run injects drained system event block into agent prompt
4. Embedded runner persists that prompt as a new user turn in session transcript

**Missing idempotency check:** If the same `exec.finished` reaches the gateway twice for the same `runId` (replay, reconnect duplicate, upstream resend), OpenClaw has **no idempotency check keyed by `runId`/`contextKey`** on this path.

## Exact Code Path

### 1. Producer: node exec completion event

- `src/node-host/invoke.ts:340-360`
  - `sendExecFinishedEvent(...)` emits `node.event` with `exec.finished`
  - Payload includes `sessionKey` and full `runId`

### 2. Gateway event ingestion

- `src/gateway/server-node-events.ts:574-640`
  - Handles `exec.finished`
  - Enqueues via `enqueueSystemEvent(text, { sessionKey, contextKey: runId ? \`exec:${runId}\` : "exec", trusted: false })`
  - Requests wake: `requestHeartbeatNow(scopedHeartbeatWakeOptions(sessionKey, { reason: "exec-event" }))`

### 3. System event dedupe weakness

- `src/infra/system-events.ts:90-115`
  - Only suppresses **consecutive duplicate text**: `if (entry.lastText === cleaned) return false`
  - Stores `contextKey` but does **not** use it for idempotency
  - After drain, duplicate suppression resets

### 4. Wake handling (not primary duplicator)

- `src/infra/heartbeat-wake.ts:79-117`
  - Wakes coalesced by `(agentId, sessionKey)`
  - Duplicate wake requests collapse to one pending entry

### 5. Transcript injection point

- `src/agents/pi-embedded-runner/run/attempt.ts:2000-2017`
  - `activeSession.prompt(effectivePrompt)` submits full prompt to embedded PI session
  - This is where completion-derived prompt becomes a persisted user turn

## Why Outbound Delivery Retry is Less Likely

- Outbound failure in heartbeat runner (`src/infra/heartbeat-runner.ts:1194-1242`)
- System event queue already drained before outbound delivery
- Channel send retry would not recreate the exact same queued event

## Secondary Possibility

Full-run retry loop in agent runner (`src/auto-reply/reply/agent-runner-execution.ts:741-1473`) could duplicate a persisted user prompt within the same reply execution if the prompt was already appended before the retry condition triggered.

## See Also

- [[session|Session Management]] — Session lifecycle and routing
- [[exec|Exec Tool]] — Command execution details
- [[heartbeat|Heartbeat]] — Heartbeat polling and wake mechanism
