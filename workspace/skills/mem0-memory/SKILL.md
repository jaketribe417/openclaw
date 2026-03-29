# Mem0 Memory

Hybrid memory system using local memory + Mem0 OSS for cross-session persistence.

## Purpose

Provides dual-layer memory:
- **Local**: Session context via memory-core
- **Mem0**: Cross-session persistence via local Mem0 OSS instance

## When to Use

**USE for:**
- Capturing important decisions, preferences, learnings
- Cross-session recall of past conversations
- Long-term memory persistence
- Entity and preference tracking

**DON'T use for:**
- Immediate session context (use local memory)
- Large file storage
- Sensitive data without encryption

## Configuration

Mem0 endpoint: `http://localhost:8888`

## Tools

### mem0_capture

Store a memory in Mem0.

**Parameters:**
- `content` (string, required): The memory content to store
- `category` (string, optional): Category (preference, learning, fact, task)
- `metadata` (object, optional): Additional metadata

**Returns:** Memory ID and confirmation

### mem0_search

Search memories in Mem0.

**Parameters:**
- `query` (string, required): Search query
- `limit` (number, optional): Max results (default: 5)

**Returns:** Array of matching memories

### mem0_list

List all memories.

**Parameters:**
- `limit` (number, optional): Max results (default: 10)

**Returns:** Array of memories

### mem0_delete

Delete a memory by ID.

**Parameters:**
- `memory_id` (string, required): Memory ID to delete

**Returns:** Deletion confirmation

## Best Practices

- Capture after significant decisions or learnings
- Use clear, searchable content
- Add relevant metadata for filtering
- Search before asking clarifying questions

## Integration with Local Memory

```
Session (local memory-core)
    ↓
Important learning/decision
    ↓
Capture to Mem0 (cross-session)
    ↓
Next session: Recall from Mem0
```

## API Reference

Mem0 OSS API docs: http://localhost:8888/docs
