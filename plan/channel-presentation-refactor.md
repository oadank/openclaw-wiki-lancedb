---
title: "Channel Presentation Refactor Plan"
category: plan
tags: [refactoring, channels, presentation, architecture]
sources:
  - /opt/openclaw/data/workspace/refs/openclaw-docs/docs/plan/ui-channels.md
created: "2026-04-24T16:30:00Z"
updated: "2026-04-24T16:30:00Z"
summary: "Refactor plan decoupling semantic message presentation from channel native UI renderers across Discord, Slack, Telegram, and other channels."
provenance:
  extracted: 0.95
  inferred: 0.05
  ambiguous: 0.0
---

# Channel Presentation Refactor Plan

## Status

Implemented for the shared agent, CLI, plugin capability, and outbound delivery surfaces:

- `ReplyPayload.presentation` carries semantic message UI
- `ReplyPayload.delivery.pin` carries sent-message pin requests
- Shared message actions expose `presentation`, `delivery`, and `pin` instead of provider-native `components`, `blocks`, `buttons`, or `card`
- Core renders or auto-degrades presentation through plugin-declared outbound capabilities
- Discord, Slack, Telegram, Mattermost, MS Teams, and Feishu renderers consume the generic contract
- Discord channel control-plane code no longer imports Carbon-backed UI containers

Canonical docs now live in [[message-presentation|Message Presentation]].

## Problem

Channel UI is split across several incompatible surfaces:

- Core owns a Discord-shaped cross-context renderer hook through `buildCrossContextComponents`
- Discord `channel.ts` can import native Carbon UI through `DiscordUiContainer`
- The agent and CLI expose native payload escape hatches for various channel types
- `ReplyPayload.channelData` carries both transport hints and native UI envelopes
- Generic `interactive` model exists but is narrower than richer layouts used across channels

## Goals

- Core decides semantic presentation from declared capabilities
- Extensions declare capabilities and render semantic presentation into native transport payloads
- Web Control UI remains separate from chat native UI
- Native channel payloads not exposed through shared agent or CLI
- Unsupported presentation auto-degrades to best text representation
- Delivery behavior (pinning) is generic delivery metadata, not presentation

## Target Model

Core-owned `presentation` field added to `ReplyPayload` with semantic types:

- `MessagePresentationTone` — neutral, info, success, warning, danger
- `MessagePresentation` — title, tone, and blocks array
- Block types: text, context, divider, buttons, select

`interactive` becomes a subset of `presentation` during migration.

## Delivery Metadata

Core-owned `delivery` field for send behavior:

```ts
delivery.pin?: boolean | { enabled: boolean; notify?: boolean; required?: boolean }
```

Semantics: `true` means pin the first successfully delivered message.

## Refactor Steps

1. Reapply Discord release fix splitting ui-colors.ts from Carbon-backed UI
2. Add presentation and delivery to ReplyPayload
3. Add MessagePresentation schema and parser helpers
4. Replace message capabilities with semantic presentation capabilities
5. Add runtime outbound adapter hooks
6. Remove agent and CLI native payload params
7. Migrate all channel renderers (Discord, Slack, Telegram, Mattermost, MS Teams, Feishu, LINE)

## Tests

- Presentation normalization and auto-degrade tests
- Cross-context marker tests
- Channel render matrix tests for all channels and text fallback
- Message tool schema tests proving native fields are gone
- CLI tests proving native flags are gone
- Discord entrypoint import-laziness regression
- Delivery pin tests

## Open Questions

- Should `delivery.pin` be implemented for Discord, Slack, MS Teams, and Feishu in first pass, or only Telegram?
- Should `delivery` absorb existing fields like `replyToId`, `replyToCurrent`, `silent`?
- Should presentation support images or file references directly?

## See Also

- [[message-presentation|Message Presentation]] — Canonical guide for presentation contract
- [[hooks-writing|Writing Hooks]] — Hook implementation details
- [[creating-skills|Creating Skills]] — Skill development
