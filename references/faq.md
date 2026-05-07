---
title: "OpenClaw FAQ"
summary: "Frequently asked questions about OpenClaw setup, configuration, and usage"
category: references
tags:
  - openclaw
  - faq
  - troubleshooting
sources:
  - /opt/openclaw/data/workspace/refs/openclaw-docs/docs/help/faq.md
provenance: extracted
---

# FAQ

Quick answers plus deeper troubleshooting for real-world setups.

## First 60 Seconds if Something is Broken

1. **Quick status:** `openclaw status`
2. **Pasteable report:** `openclaw status --all`
3. **Daemon + port state:** `openclaw gateway status`
4. **Deep probes:** `openclaw status --deep`
5. **Tail logs:** `openclaw logs --follow`
6. **Run doctor:** `openclaw doctor`
7. **Gateway snapshot:** `openclaw health --json`

## FAQ Categories

- [[faq-installation|Installation FAQ]] — first-run setup, install issues, Windows/Linux tips
- [[faq-models|FAQ: Models]] — defaults, selection, aliases, failover
- [[faq-gateway|FAQ: Gateway]] — ports, remote mode, daemon management
- [[faq-sessions|FAQ: Sessions]] — session management and memory
- [[faq-env|FAQ: Environment]] — env vars, .env loading, paths
- [[faq-automation|FAQ: Automation]] — skills, cron, heartbeat
- [[faq-security|FAQ: Security]] — access control, permissions
- [[faq-sandboxing|FAQ: Sandboxing]] — sandbox configuration and memory
- [[faq-debugging|FAQ: Debugging]] — debugging tips and tricks

## Quick Links

- [[troubleshooting|Troubleshooting]] — symptom-first guide
- [[openclaw-help-index|Help Hub]] — help directory index
- [[debugging|Debugging]] — watch mode, raw streams
- [[testing|Testing]] — test suites and runners

## Related Documentation

- [[installation|Installation]] — full installation guide
- [[configuration|Configuration]] — config reference
- [[gateway|Gateway]] — gateway documentation
- [[channels|Channels]] — channel setup and troubleshooting
