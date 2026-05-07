---
title: "Threat Model (MITRE ATLAS)"
category: concepts
tags: [security, threat-model, atlas, risk-assessment]
sources:
  - /opt/openclaw/data/workspace/refs/openclaw-docs/docs/security/THREAT-MODEL-ATLAS.md
created: "2026-04-23T10:11:00Z"
updated: "2026-04-23T10:11:00Z"
summary: OpenClaw threat model mapped to MITRE ATLAS framework, covering 16 threats across 8 tactics from reconnaissance to impact
provenance:
  extracted: 0.85
  inferred: 0.15
  ambiguous: 0.0
---

# Threat Model (MITRE ATLAS)

> OpenClaw Threat Model v1.0-draft | Last updated 2026-02-04
> Framework: [MITRE ATLAS](https://atlas.mitre.org/) (Adversarial Threat Landscape for AI Systems)

## Overview

This threat model documents adversarial threats to the OpenClaw AI agent platform and ClawHub skill marketplace, using the [[MITRE ATLAS]] framework designed specifically for AI/ML systems. See [[threat-model-contributing]] for how to contribute.

## Scope

| Component | Included | Notes |
|-----------|----------|-------|
| OpenClaw Agent Runtime | Yes | Core agent execution, tool calls, sessions |
| Gateway | Yes | Authentication, routing, channel integration |
| Channel Integrations | Yes | WhatsApp, Telegram, Discord, Signal, Slack, etc. |
| ClawHub Marketplace | Yes | Skill publishing, moderation, distribution |
| MCP Servers | Yes | External tool providers |
| User Devices | Partial | Mobile apps, desktop clients |

## Trust Boundaries

The system has 5 trust boundaries from outside to inside:

```
UNTRUSTED ZONE: WhatsApp, Telegram, Discord, ...
  │
  ▼ Trust Boundary 1: Channel Access (Device Pairing, AllowFrom, Token/Password/Tailscale auth)
  │
  ▼ Trust Boundary 2: Session Isolation (Session key = agent:channel:peer, tool policies)
  │
  ▼ Trust Boundary 3: Tool Execution (Docker sandbox, exec-approvals, SSRF protection)
  │
  ▼ Trust Boundary 4: External Content (XML-wrapped fetched URLs, security notices)
  │
  ▼ Trust Boundary 5: Supply Chain (ClawHub skill publishing, moderation, scanning)
```

Key data flows:

| Flow | Source | Destination | Protection |
|------|--------|-------------|------------|
| F1 | Channel | Gateway | TLS, AllowFrom |
| F2 | Gateway | Agent | Session isolation |
| F3 | Agent | Tools | Policy enforcement |
| F4 | Agent | External | SSRF blocking |
| F5 | ClawHub | Agent | Moderation, scanning |
| F6 | Agent | Channel | Output filtering |

## Threats by ATLAS Tactic

### Reconnaissance (AML.TA0002)

| ID | Description | Risk |
|----|-------------|------|
| T-RECON-001 | Agent endpoint discovery via network scanning/Shodan | Medium |
| T-RECON-002 | Channel integration probing to identify AI-managed accounts | Low |

### Initial Access (AML.TA0004)

| ID | Description | Risk |
|----|-------------|------|
| T-ACCESS-001 | Pairing code interception during grace period (1h DM / 5m node) | Medium |
| T-ACCESS-002 | AllowFrom identity spoofing (channel-dependent) | Medium |
| T-ACCESS-003 | Token theft from config files (stored in plaintext) | **High** |

### Execution (AML.TA0005)

| ID | Description | Risk |
|----|-------------|------|
| T-EXEC-001 | Direct prompt injection via crafted channel messages | **Critical** P0 |
| T-EXEC-002 | Indirect prompt injection via malicious URLs, poisoned emails | **High** P1 |
| T-EXEC-003 | Tool argument injection through prompt manipulation | **High** |
| T-EXEC-004 | Exec approval bypass via command obfuscation/alias exploitation | **High** P1 |

### Persistence (AML.TA0006)

| ID | Description | Risk |
|----|-------------|------|
| T-PERSIST-001 | Malicious skill published to ClawHub | **Critical** P0 |
| T-PERSIST-002 | Skill update poisoning (compromised popular skill) | Medium |
| T-PERSIST-003 | Agent configuration tampering for persistent access | Medium |

### Defense Evasion (AML.TA0007)

| ID | Description | Risk |
|----|-------------|------|
| T-EVADE-001 | Moderation pattern bypass (homoglyphs, encoding tricks) | Medium |
| T-EVADE-002 | Content wrapper escape (XML tag manipulation) | Medium |

### Discovery (AML.TA0008)

| ID | Description | Risk |
|----|-------------|------|
| T-DISC-001 | Tool enumeration via "what tools do you have?" prompts | Low |
| T-DISC-002 | Session data extraction from context window | Medium |

### Collection & Exfiltration (AML.TA0009, AML.TA0010)

| ID | Description | Risk |
|----|-------------|------|
| T-EXFIL-001 | Data theft via web_fetch — agent POSTs data to attacker URL | **High** P1 |
| T-EXFIL-002 | Unauthorized message sending with sensitive data | Medium |
| T-EXFIL-003 | Credential harvesting by malicious skill running with agent privileges | **Critical** P0 |

### Impact (AML.TA0011)

| ID | Description | Risk |
|----|-------------|------|
| T-IMPACT-001 | Unauthorized command execution on user system | **High** P1 |
| T-IMPACT-002 | Resource exhaustion / DoS (API credit drain) | **High** P1 |
| T-IMPACT-003 | Reputation damage — agent sends harmful content | Medium |

## Critical Attack Chains

Three critical-path attack chains combine multiple threats:

1. **Skill-Based Data Theft**: `T-PERSIST-001 → T-EVADE-001 → T-EXFIL-003`
   Publish malicious skill → evade moderation → harvest credentials

2. **Prompt Injection to RCE**: `T-EXEC-001 → T-EXEC-004 → T-IMPACT-001`
   Inject prompt → bypass exec approval → execute arbitrary commands

3. **Indirect Injection via Fetched Content**: `T-EXEC-002 → T-EXFIL-001`
   Poison URL content → agent fetches and follows instructions → exfiltrate data

## ClawHub Supply Chain Analysis

### Current Security Controls

| Control | Effectiveness | Notes |
|---------|--------------|-------|
| GitHub Account Age | Medium | Raises bar for new attackers |
| Path Sanitization | High | Prevents path traversal |
| File Type Validation | Medium | Text-only, but can still be malicious |
| Size Limits (50MB) | High | Prevents resource exhaustion |
| Pattern Moderation | Low | Simple regex, easily bypassed |

Current moderation patterns only check slug, displayName, summary, frontmatter, metadata, and file paths — **not actual skill code content**. Patterns cover: known-bad identifiers, suspicious keywords (malware, phish, keylogger), credential patterns, webhook/discord links, pipe-to-shell commands, and URL shorteners.

### Planned Improvements

| Improvement | Status |
|-------------|--------|
| VirusTotal Code Insight | In Progress |
| Community Reporting | Partial (skillReports table exists) |
| Audit Logging | Partial (auditLogs table exists) |
| Badge System | Implemented (highlighted, official, deprecated, redactionApproved) |

## Risk Matrix Summary

| Threat | Likelihood | Impact | Risk Level | Priority |
|--------|-----------|--------|------------|----------|
| T-EXEC-001 | High | Critical | **Critical** | P0 |
| T-PERSIST-001 | High | Critical | **Critical** | P0 |
| T-EXFIL-003 | Medium | Critical | **Critical** | P0 |
| T-IMPACT-001 | Medium | Critical | **High** | P1 |
| T-EXEC-002 | High | High | **High** | P1 |
| T-EXEC-004 | Medium | High | **High** | P1 |
| T-ACCESS-003 | Medium | High | **High** | P1 |
| T-EXFIL-001 | Medium | High | **High** | P1 |
| T-IMPACT-002 | High | Medium | **High** | P1 |

## Recommendations

### Immediate (P0)

| ID | Recommendation | Addresses |
|----|---------------|-----------|
| R-001 | Complete VirusTotal integration | T-PERSIST-001, T-EVADE-001 |
| R-002 | Implement skill sandboxing | T-PERSIST-001, T-EXFIL-003 |
| R-003 | Add output validation for sensitive actions | T-EXEC-001, T-EXEC-002 |

### Short-term (P1)

| ID | Recommendation | Addresses |
|----|---------------|-----------|
| R-004 | Implement per-sender rate limiting | T-IMPACT-002 |
| R-005 | Add token encryption at rest | T-ACCESS-003 |
| R-006 | Improve exec approval UX and validation | T-EXEC-004 |
| R-007 | Implement URL allowlisting for web_fetch | T-EXFIL-001 |

### Medium-term (P2)

| ID | Recommendation | Addresses |
|----|---------------|-----------|
| R-008 | Add cryptographic channel verification | T-ACCESS-002 |
| R-009 | Implement config integrity verification | T-PERSIST-003 |
| R-010 | Add update signing and version pinning | T-PERSIST-002 |

## Key Security Files

| Path | Purpose | Risk |
|------|---------|------|
| `src/infra/exec-approvals.ts` | Command approval logic | Critical |
| `src/gateway/auth.ts` | Gateway authentication | Critical |
| `src/infra/net/ssrf.ts` | SSRF protection | Critical |
| `src/security/external-content.ts` | Prompt injection mitigation | Critical |
| `src/agents/sandbox/tool-policy.ts` | Tool policy enforcement | Critical |

## Glossary

| Term | Definition |
|------|-----------|
| ATLAS | MITRE's Adversarial Threat Landscape for AI Systems |
| ClawHub | OpenClaw skill marketplace |
| Gateway | Message routing and authentication layer |
| MCP | Model Context Protocol — tool provider interface |
| Prompt Injection | Attack where malicious instructions are embedded in input |
| Skill | Downloadable extension for OpenClaw agents |
| SSRF | Server-Side Request Forgery |

Related: [[threat-model-contributing]] · [[formal-verification]] · [[faq-security]]
