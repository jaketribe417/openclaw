# Qmd Memory Skill

**Description:** Local semantic search engine for OpenClaw memory using Qmd. Indexes daily notes, curated memories, and project files for fast hybrid search (BM25 + vector + reranking).

**Location:** `skills/qmd-memory/`

## Overview

Qmd provides local, private search across all memory files with:
- **BM25** keyword search for exact matches
- **Vector semantic search** for meaning-based retrieval
- **LLM reranking** for result quality

## Prerequisites

Qmd must be installed:
```bash
npm install -g @tobilu/qmd
# or
bun install -g @tobilu/qmd
```

Verify: `qmd --version` should return `2.0.1` or higher.

## Setup

### 1. Initialize Collections

Run once to create search collections:

```bash
# Daily memory notes
qmd collection add /Users/Jack/.openclaw/workspace/memory --name openclaw-memory

# Long-term curated memory
qmd collection add /Users/Jack/.openclaw/workspace --name openclaw-docs

# Workspace projects
qmd collection add /Users/Jack/.openclaw/workspace/projects --name openclaw-projects
```

### 2. Add Context

```bash
qmd context add qmd://openclaw-memory "Daily activity logs and session notes"
qmd context add qmd://openclaw-docs "Curated long-term memories and documentation"
qmd context add qmd://openclaw-projects "Project files and code repositories"
```

### 3. Generate Embeddings

```bash
qmd embed
```

This indexes all files for semantic search.

## Usage

### Quick Search

```bash
# Keyword search (fastest)
qmd search "discord bot" --collection openclaw-memory

# Semantic search
qmd vsearch "HEP agent responsibilities" --collection openclaw-docs

# Hybrid + reranking (best quality)
qmd query "Mission Control dashboard features"
```

### Agent Integration

Use from any agent:

```bash
# Search and return structured JSON for the agent
qmd search "HEP updates" --json -n 5 --collection openclaw-memory

# Get specific document
qmd get "memory/2026-03-29.md" --collection openclaw-memory

# Search across all collections with minimum score
qmd query "heartbeat configuration" --all --files --min-score 0.3
```

### Scripts

**scripts/memory-search.js** — Search memory with smart defaults:

```bash
node skills/qmd-memory/scripts/memory-search.js "HEP soul update"
```

**scripts/memory-index.js** — Reindex all memory collections:

```bash
node skills/qmd-memory/scripts/memory-index.js
```

## Maintenance

**Reindex after significant changes:**
```bash
qmd embed
```

**Check status:**
```bash
qmd status
```

## Integration Points

- **Heartbeat:** Can be called during heartbeat to index recent memory changes
- **Agent startup:** Auto-search relevant context before responding
- **Memory flush:** Index new daily notes after writing

## Notes

- All processing is local via node-llama-cpp with GGUF models
- No OpenAI or external API calls required
- Context-aware: parent directory context improves search relevance
- Supports glob patterns and docid-based retrieval
