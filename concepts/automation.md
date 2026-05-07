---
title: "Automation & Tasks"
category: concepts
tags: [automation, scheduling]
summary: "Overview of automation mechanisms: tasks, cron, hooks, standing orders, and Task Flow"
sources: ["/opt/openclaw/data/workspace/refs/openclaw-docs/docs/automation/index.md"]
updated: "2026-04-23T10:00:00Z"
provenance:
  extracted: 0.8
  inferred: 0.2
  ambiguous: 0.0
---

# Automation & Tasks

OpenClaw runs work in the background through multiple mechanisms: [[tasks|tasks]], [[cron|scheduled cron jobs]], [[hooks|event hooks]], [[taskflow|Task Flow]], and standing orders. This page helps you choose the right mechanism.

## Decision Guide

| Use case                                | Recommended            | Why                                              |
| --------------------------------------- | ---------------------- | ------------------------------------------------ |
| Send daily report at 9 AM sharp         | [[cron|Scheduled Tasks]] | Exact timing, isolated execution                 |
| Remind me in 20 minutes                 | [[cron|Scheduled Tasks]] | One-shot with precise timing                     |
| Run weekly deep analysis                | [[cron|Scheduled Tasks]] | Standalone task, different model possible        |
| Check inbox every 30 min                | [[heartbeat|Heartbeat]]  | Batches with other checks, context-aware         |
| Monitor calendar for upcoming events    | [[heartbeat|Heartbeat]]  | Natural fit for periodic awareness               |
| Inspect status of a subagent or ACP run | [[tasks|Background Tasks]] | Tracks all detached work                    |
| Multi-step research then summarize      | [[taskflow|Task Flow]]   | Durable orchestration, revision tracking       |
| Run a script on session reset           | [[hooks|Hooks]]          | Event-driven, fires on lifecycle events          |
| Always check compliance before replying | Standing Orders        | Injected into every session automatically        |

### Cron vs Heartbeat

| Dimension       | [[cron|Scheduled Tasks]]      | [[heartbeat|Heartbeat]]                |
| --------------- | ------------------- | -------------------------- |
| Timing          | Exact (cron expr, one-shot)  | Approximate (~30 min)          |
| Session context | Fresh (isolated) or shared   | Full main-session context      |
| Task records    | Always created               | Never created                |
| Delivery        | Channel, webhook, or silent  | Inline in main session       |
| Best for        | Reports, reminders, background jobs | Inbox, calendar, notifications |

## How They Work Together

- **[[cron|Cron]]** handles precise schedules (daily reports, weekly reviews) and one-shot reminders. Every cron execution creates a [[tasks|task record]].
- **[[heartbeat|Heartbeat]]** handles routine monitoring (inbox, calendar, notifications) in one batched turn.
- **[[hooks|Hooks]]** react to specific events (tool calls, session resets, compaction) with custom scripts.
- **Standing orders** give the agent persistent context and authority boundaries.
- **[[taskflow|Task Flow]]** coordinates multi-step flows above individual [[tasks|tasks]].
- **[[tasks|Tasks]]** automatically track all detached work for inspection and audit.

## Related

- [[cron|Scheduled Tasks (Cron)]] — precise scheduling and one-shot reminders
- [[tasks|Background Tasks]] — task ledger for all detached work
- [[taskflow|Task Flow]] — durable multi-step flow orchestration
- [[hooks|Hooks]] — event-driven lifecycle scripts
- [[gmail-pubsub|Gmail PubSub Integration]] — Gmail triggers via Google PubSub
- [[heartbeat|Heartbeat]] — periodic main-session turns
- [[faq-automation|FAQ: Skills and Automation]] — skills customization, sub-agents, cron scheduling
- [[troubleshooting|Troubleshooting OpenClaw]] — symptom-first troubleshooting guide
