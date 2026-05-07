---
title: "FAQ: Security and Access Control"
summary: "Security best practices, DM pairing, prompt injection mitigation, and access control"
category: references
tags:
  - openclaw
  - faq
  - security
  - access-control
sources:
  - /opt/openclaw/data/workspace/refs/openclaw-docs/docs/help/faq.md
provenance:
  extracted: 0.85
  inferred: 0.15
  ambiguous: 0.0
---

# FAQ: Security and Access Control

Answers about security, DM pairing, prompt injection, and safe access control.

## Direct Messages and Access

### Is It Safe to Expose OpenClaw to Inbound DMs?

Treat inbound DMs as untrusted input. Default DM-capable channels use **pairing**:

- Unknown senders receive a pairing code; the bot does not process their message
- Approve with: `openclaw pairing approve --channel <channel> [--account <id>] <code>`
- Pending requests are capped at **3 per channel**
- Opening DMs publicly requires explicit opt-in (`dmPolicy: "open"` and allowlist `"*"`)

Run `openclaw doctor` to surface risky DM policies.

### I Ran /start in Telegram But Did Not Get a Pairing Code

Pairing codes are sent **only** when an unknown sender messages the bot and `dmPolicy: "pairing"` is enabled. `/start` by itself doesn't generate a code.

Check pending requests:
```bash
openclaw pairing list telegram
```

### WhatsApp: Will It Message My Contacts? How Does Pairing Work?

Default WhatsApp DM policy is **pairing**. Unknown senders only get a pairing code and their message is **not processed**. OpenClaw only replies to chats it receives or to explicit sends you trigger.

Approve pairing with:
```bash
openclaw pairing approve whatsapp <code>
```

List pending requests:
```bash
openclaw pairing list whatsapp
```

## Prompt Injection

### Is Prompt Injection Only a Concern for Public Bots?

No. Prompt injection is about **untrusted content**, not just who can DM the bot. If your assistant reads external content (web search, browser pages, emails, docs, attachments), that content can include hijacking instructions.

### Reducing Blast Radius

- Use a read-only or tool-disabled "reader" agent to summarize untrusted content
- Keep `web_search` / `web_fetch` / `browser` off for tool-enabled agents
- Treat decoded file/document text as untrusted — OpenResponses `input_file` and media-attachment extraction wrap extracted text in explicit external-content boundary markers
- Use sandboxing and strict tool allowlists

## Account Isolation

### Should My Bot Have Its Own Email, GitHub, or Phone Number?

Yes, for most setups. Isolating the bot with separate accounts reduces the blast radius if something goes wrong. This makes it easier to rotate credentials or revoke access without impacting personal accounts.

Start small. Give access only to the tools and accounts you actually need, and expand later.

### Can I Give It Autonomy Over My Text Messages?

We do **not** recommend full autonomy over personal messages. Safest pattern:
- Keep DMs in **pairing mode** or a tight allowlist
- Use a **separate number or account** if you want it to message on your behalf
- Let it draft, then **approve before sending**

## Model Security

### Using Cheaper Models for Personal Assistant Tasks

Yes, **if** the agent is chat-only and the input is trusted. Smaller tiers are more susceptible to instruction hijacking, so avoid them for tool-enabled agents or when reading untrusted content. If you must use a smaller model, lock down tools and run inside a sandbox.

## Related

- [[security|Security Documentation]] — full security reference
- [[pairing|Channel Pairing]] — DM pairing configuration
- [[faq|FAQ]] — main FAQ index
