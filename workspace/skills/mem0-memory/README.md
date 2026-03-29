# Mem0 Memory Skill

Hybrid memory system using local memory-core + Mem0 OSS for cross-session persistence.

## Status

⚠️ **Requires Mem0 configuration** - Mem0 needs local embedder setup

## Configuration Required

Mem0 OSS is trying to use OpenAI for embeddings but failing. You need to configure it to use Ollama instead:

### Option 1: Environment Variables in Docker

Add to your Mem0 Docker environment:
```yaml
environment:
  - EMBEDDING_PROVIDER=ollama
  - OLLAMA_HOST=http://host.docker.internal:11434
  - OLLAMA_MODEL=nomic-embed-text
```

### Option 2: Mem0 Config File

Create/update `config.yaml` in your Mem0 Docker:
```yaml
embedder:
  provider: ollama
  config:
    model: nomic-embed-text
    ollama_base_url: http://host.docker.internal:11434
```

## Quick Start

```bash
# Test connection
node scripts/mem0-client.js health

# Capture memory (after configuring Ollama embedder)
node scripts/mem0-client.js capture --content "Important learning" --category learning

# Search memories
node scripts/mem0-client.js search --query "learning"

# List all memories
node scripts/mem0-client.js list [--limit 10]
```

## Files

```
skills/mem0-memory/
├── SKILL.md              # Documentation
├── README.md             # This file
└── scripts/
    ├── mem0-client.js   # Mem0 HTTP client
    └── demo.js          # Demo/test script
```

## Environment Variables

- `MEM0_HOST` - Mem0 host (default: localhost)
- `MEM0_PORT` - Mem0 port (default: 8888)

## Dual Memory Architecture

```
┌─────────────────┐
│  Session Memory │  ← Local (memory-core)
│  (Context)      │
└────────┬────────┘
         │
    Important learning?
         │
    ┌────┴────┐
    ↓         ↓
┌─────────┐ ┌─────────┐
│  Mem0   │ │ Discard │
│  (Long  │ │         │
│  term)  │ │         │
└─────────┘ └─────────┘
```

## Next Steps

1. Configure Mem0 OSS with Ollama embedder
2. Restart Mem0 container
3. Test memory capture
4. Use for cross-session persistence
