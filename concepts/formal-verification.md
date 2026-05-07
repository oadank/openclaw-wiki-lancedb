---
title: "Formal Verification (Security Models)"
category: concepts
tags: [security, formal-verification, tla+, model-checking]
sources:
  - /opt/openclaw/data/workspace/refs/openclaw-docs/docs/security/formal-verification.md
created: "2026-04-23T10:11:00Z"
updated: "2026-04-23T10:11:00Z"
summary: Machine-checked security models (TLA+/TLC) for OpenClaw's highest-risk paths — gateway exposure, node exec, pairing, routing
provenance:
  extracted: 0.9
  inferred: 0.1
  ambiguous: 0.0
---

# Formal Verification (Security Models)

OpenClaw maintains **formal security models** using TLA+/TLC to provide machine-checked arguments that critical security properties hold under explicit assumptions. See [[threat-model]] for the broader threat landscape.

> Models repo: [vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models)

## What This Is

- An **executable, attacker-driven security regression suite**
- Each claim has a runnable model-check over a finite state space
- Many claims have paired **negative models** that produce counterexample traces for realistic bug classes^[inferred]

## What This Is Not (Yet)

- A proof that "OpenClaw is secure in all respects"
- A proof that the full TypeScript implementation is correct^[inferred]

## Important Caveats

- These are **models**, not the full implementation — drift between model and code is possible^[inferred]
- Results are bounded by TLC's state space — "green" does not imply security beyond modeled assumptions^[extracted]
- Some claims rely on explicit environmental assumptions (correct deployment, correct configuration inputs)^[extracted]

## Models Overview

### Gateway Exposure

**Claim:** Binding beyond loopback without auth can enable remote compromise; token/password blocks unauthenticated attackers (per model assumptions).

| Run | Command |
|-----|---------|
| Green | `make gateway-exposure-v2` |
| Green (protected) | `make gateway-exposure-v2-protected` |
| Red (expected) | `make gateway-exposure-v2-negative` |

### Node Exec Pipeline

**Claim:** `exec host=node` requires (a) node command allowlist + declared commands and (b) live approval when configured; approvals are tokenized to prevent replay.

| Run | Command |
|-----|---------|
| Green | `make nodes-pipeline` |
| Green | `make approvals-token` |
| Red (expected) | `make nodes-pipeline-negative` |
| Red (expected) | `make approvals-token-negative` |

### Pairing Store (DM Gating)

**Claim:** Pairing requests respect TTL and pending-request caps.

| Run | Command |
|-----|---------|
| Green | `make pairing` |
| Green | `make pairing-cap` |
| Red (expected) | `make pairing-negative` |
| Red (expected) | `make pairing-cap-negative` |

### Ingress Gating

**Claim:** In group contexts requiring mention, unauthorized "control commands" cannot bypass mention gating.

| Run | Command |
|-----|---------|
| Green | `make ingress-gating` |
| Red (expected) | `make ingress-gating-negative` |

### Routing / Session-Key Isolation

**Claim:** DMs from distinct peers do not collapse into the same session unless explicitly linked/configured.

| Run | Command |
|-----|---------|
| Green | `make routing-isolation` |
| Red (expected) | `make routing-isolation-negative` |

## v1++ Additional Bounded Models

These follow-on models tighten fidelity around real-world failure modes.

### Pairing Store Concurrency / Idempotency

**Claims:**

- Under concurrent requests, can't exceed `MaxPending` per channel
- Repeated requests/refreshes for same `(channel, sender)` don't create duplicate pending rows

| Run | Command |
|-----|---------|
| Green | `make pairing-race` |
| Green | `make pairing-idempotency` |
| Green | `make pairing-refresh` |
| Green | `make pairing-refresh-race` |
| Red (expected) | `make pairing-race-negative` — non-atomic begin/commit cap race |
| Red (expected) | `make pairing-idempotency-negative` |
| Red (expected) | `make pairing-refresh-negative` |
| Red (expected) | `make pairing-refresh-race-negative` |

### Ingress Trace Correlation / Idempotency

**Claims:**

- When one external event becomes multiple internal messages, every part keeps the same trace/event identity
- Retries don't cause double-processing
- Missing provider event IDs fall back to safe dedup key (e.g., trace ID)

| Run | Command |
|-----|---------|
| Green | `make ingress-trace` |
| Green | `make ingress-trace2` |
| Green | `make ingress-idempotency` |
| Green | `make ingress-dedupe-fallback` |
| Red (expected) | `make ingress-trace-negative` |
| Red (expected) | `make ingress-trace2-negative` |
| Red (expected) | `make ingress-idempotency-negative` |
| Red (expected) | `make ingress-dedupe-fallback-negative` |

### Routing dmScope Precedence + IdentityLinks

**Claims:**

- Channel-specific dmScope overrides win over global defaults
- identityLinks collapse only within explicit linked groups

| Run | Command |
|-----|---------|
| Green | `make routing-precedence` |
| Green | `make routing-identitylinks` |
| Red (expected) | `make routing-precedence-negative` |
| Red (expected) | `make routing-identitylinks-negative` |

## Reproducing Results

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models
# Java 11+ required (TLC runs on JVM)
make <target>
```

The repo vendors a pinned `tla2tools.jar` and provides `bin/tlc` + Make targets.^[extracted]

## Relationship to Threat Model

The formal models address specific threats from the [[threat-model]], particularly:

- **T-ACCESS-001** (pairing code interception) → pairing store models verify TTL/cap enforcement
- **T-EXEC-004** (exec approval bypass) → node exec pipeline models verify tokenized approval flow
- **T-DISC-002** (session data extraction) → routing isolation models verify session separation
- Gateway exposure models relate to the Trust Boundary 1 controls in the threat model^[inferred]

Future work: CI-run models with public artifacts (counterexample traces, run logs), and a hosted "run this model" workflow for small bounded checks.^[inferred]

Related: [[threat-model]] · [[threat-model-contributing]] · [[faq-security]]
