---
name: mempalace
description: "MemPalace — local AI memory (semantic search, temporal KG, palace wings/rooms). Use with MCP tools mempalace_*."
version: 3.1.0
homepage: https://github.com/MemPalace/mempalace
user-invocable: true
metadata:
  openclaw:
    emoji: "\U0001F3DB"
    os:
      - darwin
      - linux
      - win32
    requires:
      anyBins:
        - python3
    install:
      - id: mempalace-venv
        kind: shell
        label: "Create Python 3.12 venv and install MemPalace (avoids PEP 668 + Python 3.14/Chroma issues)"
        run: |
          cd ~/.openclaw && rm -rf .venv-mempalace && uv venv .venv-mempalace --python 3.12 && uv pip install -p .venv-mempalace/bin/python 'mempalace>=3.1.0'
        bins:
          - mempalace
---

# MemPalace — Local AI Memory (OpenClaw)

MemPalace runs as an **MCP server** (`mempalace_*` tools). It stores verbatim content in ChromaDB and optional temporal facts in a local knowledge graph — no cloud, no API keys for retrieval.

## Scope in this OpenClaw setup

**All agents** share the same MCP server when the gateway exposes it.

**Do not duplicate work across two memory layers:**

| Layer | Use for |
| --- | --- |
| **`memory_search` / `memory_get`**, **memory-core / memory-lancedb**, **`memory/YYYY-MM-DD.md`**, **`MEMORY.md`** | This workspace, OpenClaw-ingested notes, compaction flush, LanceDB index — **search here first** for day-to-day agent context. |
| **`mempalace_search`**, **`mempalace_kg_*`**, **`mempalace_*` navigation/diary** | Mined transcripts/exports, palace **wings/rooms**, **verbatim** long-arc history, **temporal KG** facts — use when the question depends on **palace-ingested** data or cross-wing recall. |

**Order:** Native OpenClaw memory first; if the answer is not there and the topic matches mined/palace scope, use MemPalace. Avoid firing identical queries in both unless native results are empty and the question fits the palace.

## Protocol (when MemPalace tools are available)

1. **Session:** Call `mempalace_status` once when you plan to use the palace (overview + AAAK spec).
2. **Before stating facts** about people, projects, or past events **that live in mined history:** `mempalace_search` or `mempalace_kg_query` — do not guess.
3. **When facts change:** `mempalace_kg_invalidate` then `mempalace_kg_add` as appropriate.
4. **Optional continuity:** `mempalace_diary_write` / `mempalace_diary_read` for agent-scoped session diary (see upstream docs).

## Architecture (palace)

- **Wings** — people or projects (e.g. `wing_alice`, `wing_myproject`)
- **Halls** — categories (facts, events, preferences, advice)
- **Rooms** — topics (e.g. `auth-migration`)
- **Drawers** — memory chunks (verbatim text)
- **Knowledge graph** — entity relationships with time validity

## Tools (summary)

**Search & browse:** `mempalace_search`, `mempalace_status`, `mempalace_list_wings`, `mempalace_list_rooms`, `mempalace_get_taxonomy`, `mempalace_check_duplicate`, `mempalace_get_aaak_spec`

**Write:** `mempalace_add_drawer`, `mempalace_delete_drawer`

**Knowledge graph:** `mempalace_kg_query`, `mempalace_kg_add`, `mempalace_kg_invalidate`, `mempalace_kg_timeline`, `mempalace_kg_stats`

**Navigation:** `mempalace_traverse`, `mempalace_find_tunnels`, `mempalace_graph_stats`

**Diary:** `mempalace_diary_write`, `mempalace_diary_read`

## Install & MCP (this machine)

Homebrew **Python 3.14** breaks Chroma/MemPalace today; use a **Python 3.12 venv** under `~/.openclaw/.venv-mempalace`:

```bash
cd ~/.openclaw && uv venv .venv-mempalace --python 3.12 && uv pip install -p .venv-mempalace/bin/python 'mempalace>=3.1.0'
```

**OpenClaw MCP** (already configured if you used this path):

```bash
openclaw mcp set mempalace '{"command":"/Users/Jack/.openclaw/.venv-mempalace/bin/python","args":["-m","mempalace.mcp_server"]}'
```

Generic upstream variant (if `mempalace` is on your `PATH`):

```bash
openclaw mcp set mempalace '{"command":"python3","args":["-m","mempalace.mcp_server"]}'
```

**Populate the palace** (CLI):

```bash
~/.openclaw/.venv-mempalace/bin/mempalace init ~/path/to/world
~/.openclaw/.venv-mempalace/bin/mempalace mine ~/path/to/world
```

Full upstream reference: [integrations/openclaw/SKILL.md](https://github.com/MemPalace/mempalace/blob/develop/integrations/openclaw/SKILL.md)

## License

MemPalace is MIT licensed. See the project repository.
