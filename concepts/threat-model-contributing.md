---
title: "Contributing to the Threat Model"
category: concepts
tags: [security, threat-model, contributing]
sources:
  - /opt/openclaw/data/workspace/refs/openclaw-docs/docs/security/CONTRIBUTING-THREAT-MODEL.md
created: "2026-04-23T10:11:00Z"
updated: "2026-04-23T10:11:00Z"
summary: Guidelines for contributing security findings, threat scenarios, and mitigations to the OpenClaw threat model
provenance:
  extracted: 0.9
  inferred: 0.1
  ambiguous: 0.0
---

# Contributing to the Threat Model

The OpenClaw threat model (see [[threat-model]]) is a living document. Anyone can contribute — you don't need to be a security expert.

## Ways to Contribute

### Add a Threat

Spotted an attack vector or risk not yet covered? Open an issue on [openclaw/trust](https://github.com/openclaw/trust/issues) and describe it in your own words.

**Helpful to include (not required):**

- The attack scenario and exploitation method
- Affected components (CLI, gateway, channels, ClawHub, MCP servers, etc.)
- Severity estimate (low / medium / high / critical)
- Links to related research, CVEs, or real-world examples

Maintainers handle ATLAS mapping, threat IDs, and risk assessment during review.^[inferred]

> **This is for adding to the threat model, not reporting live vulnerabilities.** For exploitable vulnerabilities, see the [Trust page](https://trust.openclaw.ai) for responsible disclosure.

### Suggest a Mitigation

Have an idea for addressing an existing threat? Open an issue or PR referencing the threat. Useful mitigations are specific and actionable — e.g., "per-sender rate limiting of 10 messages/minute at the gateway" is better than "implement rate limiting."

### Propose an Attack Chain

Attack chains show how multiple threats combine into realistic attack scenarios. Describe the steps and how an attacker would chain them together. A short narrative of how the attack unfolds is more valuable than a formal template.^[inferred]

### Fix or Improve Existing Content

Typos, clarifications, outdated info, better examples — PRs welcome, no issue needed.

## Framework & Taxonomy

The threat model uses [[MITRE ATLAS]] as its foundation. You don't need to know ATLAS to contribute — submissions are mapped during review.^[inferred]

### Threat ID Categories

| Code | Category |
|------|----------|
| RECON | Reconnaissance — information gathering |
| ACCESS | Initial access — gaining entry |
| EXEC | Execution — running malicious actions |
| PERSIST | Persistence — maintaining access |
| EVADE | Defense evasion — avoiding detection |
| DISC | Discovery — learning about the environment |
| EXFIL | Exfiltration — stealing data |
| IMPACT | Impact — damage or disruption |

IDs (e.g., `T-EXEC-003`) are assigned by maintainers during review.^[inferred]

### Risk Levels

| Level | Meaning |
|-------|---------|
| **Critical** | Full system compromise, or high likelihood + critical impact |
| **High** | Significant damage likely, or medium likelihood + critical impact |
| **Medium** | Moderate risk, or low likelihood + high impact |
| **Low** | Unlikely and limited impact |

## Review Process

1. **Triage** — New submissions reviewed within 48 hours
2. **Assessment** — Feasibility verified, ATLAS mapping and threat ID assigned, risk level validated
3. **Documentation** — Formatting and completeness ensured
4. **Merge** — Added to threat model and visualization

## Resources

- [ATLAS Techniques](https://atlas.mitre.org/techniques/)
- [ATLAS Case Studies](https://atlas.mitre.org/studies/)
- [OpenClaw Threat Model](/security/THREAT-MODEL-ATLAS) → [[threat-model]]
- Discord #security channel for general discussion

## Recognition

Contributors are recognized in threat model acknowledgments, release notes, and the OpenClaw security hall of fame for significant contributions.^[extracted]

Related: [[threat-model]] · [[faq-security]]
