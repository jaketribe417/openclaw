# QMD Memory System — Query, Memory, Decision

## Overview

The QMD (Query, Memory, Decision) memory system enhances my ability to retrieve and utilize information through a three-stage pipeline:

1. **Query** — Transform user input into optimized search queries
2. **Memory** — Retrieve relevant context from multiple sources
3. **Decision** — Synthesize and act on the retrieved information

## Architecture

### Stage 1: Query

**Input:** User message  
**Process:**
- Parse intent and extract key entities
- Generate multiple query variations for comprehensive coverage
- Apply query expansion techniques

**Tools:**
- Intent classification
- Named entity recognition
- Query rewriting

### Stage 2: Memory

**Input:** Processed queries  
**Sources:**
- `MEMORY.md` — Long-term curated memories
- `memory/YYYY-MM-DD.md` — Daily notes and logs
- Session transcripts — Recent conversation history
- External knowledge bases (when configured)

**Retrieval Strategy:**
- **Embedding-based search** using `gemma:300m` (fast, efficient 300M parameter model)
- **Semantic similarity** matching with configurable thresholds
- **Reranking** using `qwen3-reranker-8b` (8B parameter specialized reranker)
- **Hybrid scoring** combining semantic + lexical matching

**Reranker Configuration:**
- Model: `ollama/qwen3-reranker-8b:latest`
- Top-K candidates: 10 (retrieved → reranked → top 10)
- Reranking improves precision by scoring query-document relevance with a cross-encoder

### Stage 3: Decision

**Input:** Retrieved memory snippets  
**Process:**
- Synthesize across multiple sources
- Weight by recency and relevance
- Detect conflicts or gaps
- Generate response or action plan

**Output:** Informed response with citations when helpful

## Workflow

```
User Input
    ↓
[Query Processing]
    ↓
[Embedding Search] → gemma:300m
    ↓
[Initial Retrieval] → Top 50 candidates
    ↓
[Reranking] → qwen3-reranker-8b
    ↓
[Final Selection] → Top 10
    ↓
[Synthesis & Response]
    ↓
Answer with citations
```

## Configuration

```json
"memorySearch": {
  "provider": "ollama",
  "model": "gemma:300m",
  "rerank": {
    "enabled": true,
    "model": "qwen3-reranker-8b:latest",
    "topK": 10
  }
}
```

## Benefits

1. **Speed** — 300M embedding model is fast for initial retrieval
2. **Precision** — 8B reranker provides high-quality relevance scoring
3. **Efficiency** — Two-stage approach balances speed and accuracy
4. **Scalability** — Can handle larger memory stores without latency issues

## Model Roles

| Model | Parameters | Role | Why |
|-------|-----------|------|-----|
| gemma:300m | 300M | Embedding | Fast, efficient for initial candidate retrieval |
| qwen3-reranker-8b | 8B | Reranking | Cross-encoder precision for final relevance scoring |

## Best Practices

- Reranking is applied automatically on all memory searches
- Citations include source path and line numbers when helpful
- Low-confidence results are flagged
- Multiple sources are synthesized rather than concatenated

---

*Configured: March 29, 2026*
