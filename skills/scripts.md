---
title: "OpenClaw Scripts"
summary: "Repository scripts: purpose, scope, and safety notes for local workflows and ops tasks"
category: skills
tags:
  - openclaw
  - scripts
  - automation
sources:
  - /opt/openclaw/data/workspace/refs/openclaw-docs/docs/help/scripts.md
provenance:
  extracted: 0.9
  inferred: 0.1
  ambiguous: 0.0
---

# Scripts

The `scripts/` directory contains helper scripts for local workflows and ops tasks.

## Conventions

- Scripts are **optional** unless referenced in docs or release checklists
- Prefer CLI surfaces when they exist (e.g., `openclaw models status --check`)
- Assume scripts are host-specific; read them before running on a new machine

## GitHub Read Helper

Use `scripts/gh-read` when you want `gh` to use a GitHub App installation token for repo-scoped read calls while leaving normal `gh` on your personal login for write actions.

### Required Environment Variables

- `OPENCLAW_GH_READ_APP_ID`
- `OPENCLAW_GH_READ_PRIVATE_KEY_FILE`

### Optional Environment Variables

- `OPENCLAW_GH_READ_INSTALLATION_ID` — skip repo-based installation lookup
- `OPENCLAW_GH_READ_PERMISSIONS` — comma-separated override for read permission subset

### Repo Resolution Order

1. `gh ... -R owner/repo`
2. `GH_REPO`
3. `git remote origin`

### Examples

```bash
scripts/gh-read pr view 123
scripts/gh-read run list -R openclaw/openclaw
scripts/gh-read api repos/openclaw/openclaw/pulls/123
```

## When Adding Scripts

- Keep scripts focused and documented
- Add a short entry in the relevant doc (or create one if missing)

## Related

- [[authentication|Authentication]] — auth monitoring and channel setup
- [[openclaw-help-index|Help Hub]] — quick fix paths
