---
name: cursor-cli
description: "Delegate coding tasks to Cursor AI agents via the CLI. Use when: (1) Spawning a coding agent to work on a specific task, (2) Running non-interactive code generation or review, (3) Continuing a previous Cursor session, (4) Handing off work to Cursor Cloud Agent for background processing, (5) Any request that mentions 'use cursor', 'cursor agent', 'spawn cursor', or delegating coding work to Cursor. NOT for: general terminal commands, non-Cursor AI tasks, or when ACP coding agents (HEP, Codex, Claude Code) are explicitly preferred."
allowed-tools: ["exec", "edit", "write", "read"]
---

# Cursor CLI Skill

This skill enables delegation of coding tasks to Cursor AI agents via the `agent` CLI command. Cursor provides specialized AI coding assistance that complements other ACP agents.

## When to Use

Use this skill when:
- User explicitly asks to "use Cursor" or mentions Cursor AI
- Delegating a coding task that benefits from Cursor's editor-integrated agent
- Running non-interactive code generation for scripts or CI pipelines
- Resuming or continuing a previous Cursor session
- Handing off long-running tasks to Cursor Cloud Agent
- User prefers Cursor over other ACP coding agents (HEP, Codex, Claude Code)

## Installation Check

Before using, verify Cursor CLI is installed:

```bash
which agent || curl https://cursor.com/install -fsS | bash
```

If not installed, run the install command and wait for completion.

## Core Commands

### Interactive Mode (Default)

Start a conversation with Cursor agent:

```bash
# Start interactive session
agent

# Start with initial prompt
agent "refactor the auth module to use JWT tokens"

# Continue previous session
agent --continue
```

### Non-Interactive Mode (for automation)

Use `-p` or `--print` flag for scripting:

```bash
# Run with specific prompt
agent -p "find and fix performance issues" --model "gpt-5.2"

# Review git changes
agent -p "review these changes for security issues" --output-format text
```

### Session Management

```bash
# List all previous chats
agent ls

# Resume latest conversation
agent resume

# Resume specific conversation
agent --resume="chat-id-here"
```

### Cloud Agent Handoff

For background processing:

```bash
# Start in cloud mode (runs while away)
agent -c "refactor the auth module and add comprehensive tests"

# Send specific task to Cloud Agent mid-conversation
agent "& refactor the auth module and add comprehensive tests"
```

Access Cloud Agent tasks at: https://cursor.com/agents

## Modes

| Mode | Flag | Use When |
|------|------|----------|
| Agent | (default) | Full coding tasks with tool access |
| Plan | `--mode=plan` or `/plan` | Design approach before coding |
| Ask | `--mode=ask` or `/ask` | Read-only exploration, no changes |

## Safety Controls

### Sandbox Mode

Control command execution:

```bash
# Enable sandbox (restricts commands)
agent --sandbox enabled

# Disable sandbox (allows any command)
agent --sandbox disabled
```

Toggle mid-session with `/sandbox` command.

### Sudo Passwords

When commands need elevated privileges, Cursor displays a secure password prompt. The AI never sees the password.

## Workflow

1. **Check installation** — Verify `agent` command exists
2. **Determine mode** — Interactive vs non-interactive based on context
3. **Set sandbox** — Enable if task involves untrusted code
4. **Execute** — Run appropriate agent command
5. **Report results** — Summarize what Cursor accomplished

## Examples

**Simple task:**
```bash
agent -p "add input validation to the login form"
```

**Complex task with context:**
```bash
agent -c "implement OAuth2 flow for Google sign-in, including token refresh"
```

**Review work:**
```bash
agent -p "review src/components for TypeScript errors" --output-format text
```

**Continue previous work:**
```bash
agent --continue
```

## Limitations

- Requires Cursor CLI installation (`agent` command)
- Cloud Agent requires Cursor account
- Some commands may require sandbox approval
- Max Mode availability depends on model support

## Integration with Other Agents

- **HEP**: Use HEP for heavy refactoring, architecture changes, multi-file coordination
- **Cursor**: Use Cursor for quick edits, single-file changes, editor-native workflows
- **Joy**: Joy handles email; Cursor handles code

When user asks for "the best coding agent" without preference, suggest HEP. When they mention Cursor specifically, use this skill.
