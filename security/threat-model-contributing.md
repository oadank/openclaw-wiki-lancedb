---
title: "Contributing to the Threat Model"
category: security
tags: [security, threat-model, contributing, atlus, atlas]
sources:
  - /opt/openclaw/data/workspace/refs/openclaw-docs/docs/security/CONTRIBUTING-THREAT-MODEL.md
created: "2026-04-24T16:30:00Z"
updated: "2026-04-24T16:30:00Z"
summary: "How to contribute security findings, threat scenarios, and mitigations to the OpenClaw threat model."
provenance:
  extracted: 1.0
  inferred: 0.0
  ambiguous: 0.0
---

# Contributing to the Threat Model

## Overview

The OpenClaw threat model is a living document mapping OpenClaw's security surface to the MITRE ATLAS framework. Everyone is encouraged to contribute new findings, edge cases, or refinements.

## Submission Process

1. **Identify the threat** — document the attack vector, affected components, and potential impact
2. **Map to ATLAS** — reference the relevant MITRE ATLAS technique ID
3. **Assess mitigations** — describe current mitigations and residual risk
4. **Propose improvements** — suggest concrete recommendations
5. **Submit** — open an issue or PR with the threat scenario

## Threat Document Template

| Field | Description |
|-------|-------------|
| **ATLAS ID** | MITRE ATLAS technique ID (e.g., AML.T0051.001) |
| **Description** | What the threat does and how it works |
| **Attack Vector** | How the attack is executed |
| **Affected Components** | Which parts of OpenClaw are involved |
| **Current Mitigations** | Existing security controls |
| **Residual Risk** | Risk level after existing mitigations |
| **Recommendations** | Suggested improvements |

## Risk Levels

| Level | Description |
|-------|-------------|
| **Critical** | Immediate risk of data breach, RCE, or system compromise |
| **High** | Significant risk with some existing controls |
| **Medium** | Moderate risk; likely requires user interaction or specific conditions |
| **Low** | Limited risk; requires specific configuration or circumstances |

## See Also

- [[threat-model|OpenClaw Threat Model]] — Full threat model document
- [[formal-verification|Formal Verification]] — Machine-checked security models
- [[security|OpenClaw Security]] — Security hardening guide
