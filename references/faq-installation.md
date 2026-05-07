---
title: "FAQ: Installation"
summary: "Frequently asked questions about installing OpenClaw on different platforms, troubleshooting common issues"
category: references
tags:
  - openclaw
  - faq
  - installation
sources:
  - /opt/openclaw/data/workspace/refs/openclaw-docs/docs/help/faq.md
provenance:
  extracted: 0.85
  inferred: 0.15
  ambiguous: 0.0
---

# FAQ: Installation

Quick answers about installing and setting up OpenClaw.

## Recommended Way to Install and Set Up OpenClaw

The repo recommends running from source and using onboarding:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
openclaw onboard --install-daemon
```

### From Source (Contributors/Dev)

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
pnpm ui:build
openclaw onboard
```

## Difference Between Stable and Beta

**Stable** and **beta** are **npm dist-tags**, not separate code lines:

- `latest` = stable
- `beta` = early build for testing

Usually a stable release lands on **beta** first, then an explicit promotion step moves that same version to `latest`.

## How to Install the Beta Version and Difference Between Beta and Dev

- **Beta** is the npm dist-tag `beta` (may match `latest` after promotion)
- **Dev** is the moving head of `main` (git); when published, it uses the npm dist-tag `dev`

### One-Liners (macOS/Linux)

```bash
# Beta install
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta

# Dev install (git checkout)
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
```

### Windows Installer (PowerShell)

```powershell
# Run from: https://openclaw.ai/install.ps1
```

## How to Try the Latest Bits

### Option 1: Dev Channel (Git Checkout)

```bash
openclaw update --channel dev
```

### Option 2: Hackable Install

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
```

## How Long Does Install and Onboarding Usually Take?

- **Install:** 2-5 minutes
- **Onboarding:** 5-15 minutes depending on how many channels/models you configure

## Installer Stuck? How to Get More Feedback

Re-run the installer with **verbose output**:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
```

### Beta Install with Verbose

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
```

### Windows (PowerShell) Equivalent

```powershell
Set-PSDebug -Trace 1
& ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
Set-PSDebug -Trace 0
```

## Windows Install: Git Not Found or OpenClaw Not Recognized

### 1) npm error spawn git / git not found

- Install **Git for Windows** and make sure `git` is on your PATH
- Close and reopen PowerShell, then re-run the installer

### 2) openclaw is not recognized after install

- Check the path: `npm config get prefix`
- Add that directory to your user PATH (typically `%AppData%\npm`)
- Close and reopen PowerShell after updating PATH

## Windows Exec Output Shows Garbled Chinese Text

This is usually a console code page mismatch on native Windows shells.

### Quick Workaround in PowerShell

```powershell
chcp 65001
[Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)
```

Then restart the Gateway:

```powershell
openclaw gateway restart
```

## Recommended Runtime

Node **>= 22** is required. `pnpm` is recommended. Bun is **not recommended** for the Gateway.

## Does It Run on Raspberry Pi?

Yes. The Gateway is lightweight:

- **512MB-1GB RAM**, **1 core**, and about **500MB** disk are enough for personal use
- A **Raspberry Pi 4 can run it**
- **2GB is recommended** for extra headroom (logs, media, other services)

Tip: a small Pi/VPS can host the Gateway, and you can pair **nodes** on your laptop/phone for local screen/camera/canvas or command execution.

## Raspberry Pi Install Tips

- Use a **64-bit** OS and keep Node >= 22
- Prefer the **hackable (git) install** for visibility and fast updates
- Start without channels/skills, then add them one by one
- Weird binary issues are usually **ARM compatibility** problems

## Migrating Setup to a New Machine

1. Install OpenClaw on the new machine
2. Copy `$OPENCLAW_STATE_DIR` (default: `~/.openclaw`) from the old machine
3. Copy your workspace (default: `~/.openclaw/workspace`)
4. Run `openclaw doctor` and restart the Gateway service

**Important:** committing/pushing only your workspace to GitHub backs up **memory + bootstrap files**, but **not** session history or auth. Those live under `~/.openclaw/` (e.g., `~/.openclaw/agents/<agentId>/sessions/`).

## Cannot Access docs.openclaw.ai (SSL Error)

Some Comcast/Xfinity connections incorrectly block `docs.openclaw.ai` via Xfinity Advanced Security. Disable it or allowlist `docs.openclaw.ai`.

Docs are mirrored on GitHub: `https://github.com/openclaw/openclaw/tree/main/docs`

## Where Things Live on Disk

- **State directory:** `~/.openclaw/` (or `$OPENCLAW_STATE_DIR`)
- **Workspace:** `~/.openclaw/workspace/`
- **Config:** `~/.openclaw/openclaw.json`
- **Sessions:** `~/.openclaw/agents/<agentId>/sessions/`
- **Auth profiles:** `~/.openclaw/auth-profiles.json`
- **Logs:** `/tmp/openclaw/openclaw-*.log` (file logs) and service logs

## Related

- [[faq|FAQ]] — main FAQ index
- [[installation|Installation Guide]] — full installation documentation
- [[platforms|Supported Platforms]] — platform-specific instructions
