# OpenClaw System Prompt Injection - Implementation Guide

## Investigation Results

OpenClaw does NOT have a direct `system_file` or `persona` field in `openclaw.json` like the Manus guide assumes. Instead, OpenClaw builds system context from:

1. **Workspace identity files**: `SOUL.md`, `IDENTITY.md`, `AGENTS.md`, `USER.md`
2. **Agent-specific files**: Under `~/.openclaw/agents/{agent}/agent/`
3. **Skill context**: Loaded when skills are invoked

## Recommended Implementation Approaches

### Option 1: Enhanced SOUL.md (Recommended)

Prepend the combined Manus persona content to the existing `SOUL.md`:

```bash
# Backup existing SOUL.md
cp ~/.openclaw/workspace/SOUL.md ~/.openclaw/workspace/SOUL.md.bak.$(date +%s)

# Prepend Manus system prompt
cat ~/.openclaw/skills/manus-core/combined_system.md ~/.openclaw/workspace/SOUL.md > ~/.openclaw/workspace/SOUL.md.new
mv ~/.openclaw/workspace/SOUL.md.new ~/.openclaw/workspace/SOUL.md
```

**Pros:** 
- Native OpenClaw mechanism
- Automatically loaded on every session
- No config changes needed

**Cons:**
- Modifies existing identity file
- May affect other agents if they share workspace

### Option 2: Agent-Specific Enhancement

Create enhanced agent configurations under `~/.openclaw/agents/`:

```
~/.openclaw/agents/manus-enhanced/
├── agent/
│   ├── SOUL.md          # Manus-enhanced persona
│   ├── IDENTITY.md      # Agent identity
│   └── AGENTS.md        # Capabilities
└── skills/              # Agent-specific skills
```

Then reference this agent in `openclaw.json`.

**Pros:**
- Non-destructive to existing setup
- Can have multiple agent profiles
- Clean separation

**Cons:**
- Requires `openclaw.json` modification
- More complex setup

### Option 3: Skill-Based Injection

Create a special skill that, when loaded, injects the system prompt into context:

```yaml
# skills/manus-injector/SKILL.md
---
name: manus-injector
description: Injects Manus-level system prompt into current session
---

When this skill is loaded, prepend the following to your system context:
[content of combined_system.md]
```

**Pros:**
- Opt-in per session
- No permanent changes
- Can be toggled on/off

**Cons:**
- Must be explicitly loaded each time
- Not automatic

## Implementation Decision

I recommend **Option 1 (Enhanced SOUL.md)** for immediate effect, with backups for rollback.

The skills created (Phase 3B, 3C, 4) will work regardless — they provide tools and workflows that don't depend on system prompt injection.

## Files Ready for Implementation

All skills are created and verified:
- ✅ 4 Persona files (manus.md, pev.md, tips.md, writing.md)
- ✅ Combined system prompt (~18KB)
- ✅ 6 Core skills (app-deployment, knowledge-base, data-apis, document-writer, model-routing, benchmark-suite)
- ✅ 6 Extension skills (knowledge-inject, auto-offload, context-enhancer, smart-context, event-logger, parallel-tasks)
- ✅ 1 Utility (browser_state.py)
- ✅ All backups created
- ✅ Change log maintained

## Next Step

Choose your preferred injection method:
1. **Enhanced SOUL.md** — I can prepend the combined prompt now
2. **Agent-specific** — Create a new agent profile
3. **Skill-based** — Use as-needed
4. **Manual** — Document how to do it yourself

All skills are ready to use immediately regardless of system prompt method.
