# OpenClaw Multi-Agent Discord Configuration

## Overview

This gateway runs 4 isolated agents on a single OpenClaw instance, each with their own Discord bot account, workspace, and channel bindings. Agents communicate with the user directly via dedicated channels and with each other via `#agent-hub`.

---

## Agents

| Agent ID | Role | OpenClaw Account ID |
|----------|------|-------------|
| `jake` | Main Agent | `jaketribe_bot` |
| `joy` | Email Agent | `Joy-email` |
| `harlan` | Chief of Staff | `harlan-chief` |
| `hep` | Coder | `heb-coder` |

---

## Step 1: Create Agent Workspaces

Run the following commands to scaffold each agent's workspace and state directory:

```bash
openclaw agents add jake
openclaw agents add joy
openclaw agents add harlan
openclaw agents add hep
```

This creates isolated directories for each agent:

```
~/.openclaw/
├── workspace-jake/
│   ├── AGENTS.md
│   ├── SOUL.md
│   └── USER.md
├── workspace-joy/
├── workspace-harlan/
└── workspace-hep/
```

> **Critical:** Never reuse or copy agent directories between agents. Each must have its own workspace and agentDir to prevent session and auth collisions.

---

## Step 2: Full Configuration File

Replace your `openclaw.config` with the following. Insert each bot's token where indicated.

```json
{
  "agents": {
    "list": [
      {
        "id": "jake",
        "workspace": "~/.openclaw/workspace-jake"
      },
      {
        "id": "joy",
        "workspace": "~/.openclaw/workspace-joy"
      },
      {
        "id": "harlan",
        "workspace": "~/.openclaw/workspace-harlan"
      },
      {
        "id": "hep",
        "workspace": "~/.openclaw/workspace-hep"
      }
    ]
  },

  "bindings": [
    { "agentId": "jake",   "match": { "channel": "discord", "accountId": "jaketribe_bot" } },
    { "agentId": "joy",    "match": { "channel": "discord", "accountId": "Joy-email" } },
    { "agentId": "harlan", "match": { "channel": "discord", "accountId": "harlan-chief" } },
    { "agentId": "hep",    "match": { "channel": "discord", "accountId": "heb-coder" } }
  ],

  "channels": {
    "discord": {
      "groupPolicy": "allowlist",
      "allowBots": true,
      "replyToMode": "first",

      "accounts": {

        "jaketribe_bot": {
          "token": "JAKE_BOT_TOKEN_HERE",
          "guilds": {
            "YOUR_GUILD_ID": {
              "requireMention": false,
              "channels": {
                "JAKE_MAIN_CHANNEL_ID":  { "allow": true, "requireMention": false },
                "AGENT_HUB_CHANNEL_ID":  { "allow": true, "requireMention": true },
                "GENERAL_CHANNEL_ID":    { "allow": true, "requireMention": true }
              }
            }
          }
        },

        "Joy-email": {
          "token": "JOY_BOT_TOKEN_HERE",
          "guilds": {
            "YOUR_GUILD_ID": {
              "requireMention": false,
              "channels": {
                "JOY_EMAIL_CHANNEL_ID":  { "allow": true, "requireMention": false },
                "AGENT_HUB_CHANNEL_ID":  { "allow": true, "requireMention": true },
                "GENERAL_CHANNEL_ID":    { "allow": true, "requireMention": true }
              }
            }
          }
        },

        "harlan-chief": {
          "token": "HARLAN_BOT_TOKEN_HERE",
          "guilds": {
            "YOUR_GUILD_ID": {
              "requireMention": false,
              "channels": {
                "HARLAN_CHIEF_CHANNEL_ID": { "allow": true, "requireMention": false },
                "AGENT_HUB_CHANNEL_ID":    { "allow": true, "requireMention": true },
                "TASK_QUEUE_CHANNEL_ID":   { "allow": true, "requireMention": false },
                "AGENT_LOGS_CHANNEL_ID":   { "allow": true, "requireMention": false },
                "GENERAL_CHANNEL_ID":      { "allow": true, "requireMention": true }
              }
            }
          }
        },

        "heb-coder": {
          "token": "HEP_BOT_TOKEN_HERE",
          "guilds": {
            "YOUR_GUILD_ID": {
              "requireMention": false,
              "channels": {
                "HEB_CODER_CHANNEL_ID":  { "allow": true, "requireMention": false },
                "AGENT_HUB_CHANNEL_ID":  { "allow": true, "requireMention": true },
                "GENERAL_CHANNEL_ID":    { "allow": true, "requireMention": true }
              }
            }
          }
        }

      }
    }
  }
}
```

---

## Step 3: Find Your Channel and Guild IDs

In Discord, enable Developer Mode first:

1. Go to **User Settings → Advanced → Developer Mode** → toggle ON
2. Right-click your server name → **Copy Server ID** → this is `YOUR_GUILD_ID`
3. Right-click each channel → **Copy Channel ID** → replace the placeholder values above

| Placeholder | Channel |
|-------------|---------|
| `JAKE_MAIN_CHANNEL_ID` | `#jake-main` |
| `JOY_EMAIL_CHANNEL_ID` | `#joy-email` |
| `HARLAN_CHIEF_CHANNEL_ID` | `#harlan-chief` |
| `HEB_CODER_CHANNEL_ID` | `#heb-coder` |
| `AGENT_HUB_CHANNEL_ID` | `#agent-hub` |
| `TASK_QUEUE_CHANNEL_ID` | `#task-queue` |
| `AGENT_LOGS_CHANNEL_ID` | `#agent-logs` |
| `GENERAL_CHANNEL_ID` | `#general` |

---

## Step 4: Known Bug — Bot-to-Bot Filtering

There is an active bug (issue #11199) where OpenClaw filters messages from all configured bot accounts, not just each agent's own bot. This blocks direct @mention communication between agents in Discord.

**Workaround until patched:**

First, update OpenClaw to the latest version in case the fix has been released:

```bash
npm update openclaw
openclaw gateway restart
```

If the bug persists, route inter-agent communication through `#agent-hub` using the `sessions_send` internal delegation method, or have agents post results addressed to you so you can relay them. Inter-agent visibility will still appear in channel logs even if direct mention delivery is unreliable.

---

## Step 5: Start and Verify

```bash
# Restart the gateway with new config
openclaw gateway restart

# Confirm all agents are registered with correct bindings
openclaw agents list --bindings

# Check all Discord accounts are connected
openclaw channels status --probe
```

Expected output for `agents list --bindings`:

```
jake    →  discord / jaketribe_bot
joy     →  discord / Joy-email
harlan  →  discord / harlan-chief
hep     →  discord / heb-coder
```

---

## Channel Routing Summary

| Channel | Agent Listening | requireMention |
|---------|----------------|----------------|
| `#jake-main` | Jake | No — responds to everything |
| `#joy-email` | Joy | No — responds to everything |
| `#harlan-chief` | Harlan | No — responds to everything |
| `#heb-coder` | HEB | No — responds to everything |
| `#agent-hub` | All agents | Yes — must be @mentioned |
| `#task-queue` | Harlan | No |
| `#agent-logs` | Harlan | No |
| `#general` | All agents | Yes — must be @mentioned |

---

## Notes

- Each agent's personality and behavior is defined in its own `SOUL.md` and `AGENTS.md` files inside its workspace directory
- `USER.md` in each workspace tells the agent about you and your preferences
- Harlan should be configured in `SOUL.md` to monitor `#agent-logs` and `#task-queue` proactively
- The `#mission` channel is read-only for all agents — pin standing orders there for persistent context
- `allowBots: true` is required at the top-level discord config for any agent-to-agent messaging to work at all

---

*OpenClaw Multi-Agent Discord Config v1.0 — 4-agent setup: Jake, Joy, Harlan, HEB*
