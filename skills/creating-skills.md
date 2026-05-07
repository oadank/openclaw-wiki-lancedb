---
title: "Creating Skills"
summary: "Build and test custom workspace skills with SKILL.md"
tags: ["skills", "workspace", "customization"]
sources: ["/opt/openclaw/data/workspace/refs/openclaw-docs/docs/tools/creating-skills.md"]
provenance: {
  extracted: 1.0,
  inferred: 0.0,
  ambiguous: 0.0
}
---

# Creating Skills

Skills teach the agent how and when to use tools. Each skill is a directory
containing a `SKILL.md` file with YAML frontmatter and markdown instructions.

## Create your first skill

1. **Create the skill directory**:
   ```bash
   mkdir -p ~/.openclaw/workspace/skills/hello-world
   ```

2. **Write SKILL.md**: Create `SKILL.md` with frontmatter and instructions:
   ```markdown
   ---
   name: hello_world
   description: A simple skill that says hello.
   ---
   
   # Hello World Skill
   
   When the user asks for a greeting, use the `echo` tool to say
   "Hello from your custom skill!".
   ```

3. **Add tools (optional)**: Define custom tool schemas in frontmatter or instruct
   the agent to use existing tools.

4. **Load the skill**: Start a new session or restart the gateway:
   ```bash
   openclaw gateway restart
   openclaw skills list  # verify
   ```

5. **Test it**:
   ```bash
   openclaw agent --message "give me a greeting"
   ```

## Skill metadata reference

| Field                               | Required | Description                                 |
| ----------------------------------- | -------- | ------------------------------------------- |
| `name`                              | Yes      | Unique identifier (snake_case)              |
| `description`                       | Yes      | One-line description shown to the agent     |
| `metadata.openclaw.os`              | No       | OS filter (`["darwin"]`, `["linux"]`, etc.) |
| `metadata.openclaw.requires.bins`   | No       | Required binaries on PATH                   |
| `metadata.openclaw.requires.config` | No       | Required config keys                        |

## Where skills live

| Location                        | Precedence | Scope                 |
| ------------------------------- | ---------- | --------------------- |
| `<workspace>/skills/`           | Highest    | Per-agent             |
| `<workspace>/.agents/skills/`   | High       | Per-workspace agent   |
| `~/.agents/skills/`             | Medium     | Shared agent profile  |
| `~/.openclaw/skills/`           | Medium     | Shared (all agents)   |
| Bundled (shipped with OpenClaw) | Low        | Global                |
| `skills.load.extraDirs`         | Lowest     | Custom shared folders |

## Best practices

- **Be concise** — instruct the model on _what_ to do, not how to be an AI
- **Safety first** — if your skill uses `exec`, ensure prompts don't allow arbitrary command injection from untrusted input
- **Test locally** — use `openclaw agent --message "..."` to test before sharing
- **Use ClawHub** — browse and contribute skills at [clawhub.ai](https://clawhub.ai)

## Related

- [[features|Features]]
- [[agent|Agent Runtime]]
