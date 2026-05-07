---
title: "Node + tsx __name Crash"
category: debug
tags: [debugging, node, tsx, esbuild, runtime]
sources:
  - /opt/openclaw/data/workspace/refs/openclaw-docs/docs/debug/node-issue.md
created: "2026-04-24T16:30:00Z"
updated: "2026-04-24T16:30:00Z"
summary: "Node + tsx runtime crash fix reference for __name is not a function startup error in OpenClaw dev scripts."
provenance:
  extracted: 1.0
  inferred: 0.0
  ambiguous: 0.0
---

# Node + tsx "__name is not a function" Crash

Running OpenClaw via Node with `tsx` fails at startup with:

```
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

## Root Cause

This began after switching dev scripts from Bun to `tsx` (commit `2871657e`, 2026-01-06). The error occurs because:

- `tsx` uses esbuild to transform TypeScript/ESM files
- esbuild's `keepNames` option emits a `__name` helper function that wraps function definitions
- The crash indicates this helper is missing or overwritten during Node runtime module loading

## Affected Environments

| Environment | Status |
|-------------|--------|
| Node v25.3.0 | ❌ Fails |
| Node v22.22.0 (Homebrew) | ❌ Fails |
| Bun | ✅ Works |
| Built output (tsgo) | ✅ Works |

## Reproduction Steps

### Node-only repro:
```bash
# in repo root
node --version
pnpm install
node --import tsx src/entry.ts status
```

### Minimal repo repro:
```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

## Workarounds

1. **Use Bun for dev scripts (preferred temporary fix):**
   ```bash
   bun src/entry.ts status
   ```

2. **Use built output:**
   ```bash
   pnpm tsgo
   node openclaw.mjs status
   ```

3. **Test Node LTS variants:**
   - Node 24 status pending verification
   - Node 22/25 have confirmed failures

## Upstream References

- [esbuild keepNames documentation](https://esbuild.github.io/api/#keep-names)
- [OpenNext keepNames howto](https://opennext.js.org/cloudflare/howtos/keep_names)
- [esbuild issue #1031 - keepNames behavior](https://github.com/evanw/esbuild/issues/1031)

## Next Steps

1. Verify Node 24 behavior
2. Test `tsx` nightly releases for regression fixes
3. File upstream minimal repro if issue persists on LTS
4. Evaluate exposing esbuild `keepNames` toggle via tsx config

## See Also

- [[debugging|Debugging OpenClaw]] - General debugging tools
- [[troubleshooting|Troubleshooting Guide]] - Symptom-first issue resolution
