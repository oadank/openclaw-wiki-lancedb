---
title: "Flows (redirect)"
category: cli
tags:
  - cli
sources:
  - "/opt/openclaw/data/workspace/refs/openclaw-docs/docs/cli/flows.md"
summary: "Redirect: flow commands live under `openclaw tasks flow`"
read_when:
  - You encounter openclaw flows in older docs or release notes
---


# `openclaw tasks flow`

Flow commands are subcommands of `openclaw tasks`, not a standalone `flows` command.

```bash
openclaw tasks flow list [--json]
openclaw tasks flow show <lookup>
openclaw tasks flow cancel <lookup>
```

For full documentation see [Task Flow](/automation/taskflow) and the [tasks CLI reference](/cli/tasks).

## Related

- [CLI reference](/cli)
- [Automation](/automation)
