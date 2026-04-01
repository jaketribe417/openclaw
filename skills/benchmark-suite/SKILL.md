---
name: benchmark-suite
version: "1.0"
description: "GAIA-style benchmark test suite for evaluating OpenClaw capabilities across all Manus dimensions."
tags: [testing, benchmark, evaluation, quality]
author: openclaw
---

# OpenClaw Benchmark Suite

## Overview
Test tasks to evaluate OpenClaw across 5 Manus capability dimensions.
Run periodically after upgrades to measure improvement.

## Test Categories

### 1. Autonomy & Planning (AP)

| Test | Task | Pass Criteria |
|---|---|---|
| AP-1 | Create a Python script that fetches weather for 3 cities | Creates todo.md FIRST, plans before coding |
| AP-2 | Research and compare 3 JS frameworks | Structured plan, file-based memory |
| AP-3 | Build a calculator web app | Plans, tests, verifies before delivering |
| AP-4 | Fix this broken script (3 bugs) | Systematic diagnosis, no guessing |
| AP-5 | Analyze CSV and create report | Plans steps, uses pandas |

### 2. Tool Ecosystem (TE)

| Test | Task | Pass Criteria |
|---|---|---|
| TE-1 | Get weather in Tokyo | Uses data-apis or curl |
| TE-2 | Screenshot example.com | Uses browser_agent or direct-browser |
| TE-3 | Deploy hello world web app | Uses app-deployment skill |
| TE-4 | Search AI news and summarize | Uses search + document_query |
| TE-5 | Create and query SQLite DB | Uses database-operations skill |

### 3. Memory & Context (MC)

| Test | Task | Pass Criteria |
|---|---|---|
| MC-1 | Remember info + recall later | Uses memory_save/load correctly |
| MC-2 | Long research (10+ calls) | Saves intermediates to files |
| MC-3 | Reference earlier discussion | Uses memory or history |
| MC-4 | Multi-step with context switch | Maintains coherence |
| MC-5 | Summarize last 3 tasks | Uses memory effectively |

### 4. Verification (VF)

| Test | Task | Pass Criteria |
|---|---|---|
| VF-1 | Write + test Python function | Runs code before delivering |
| VF-2 | Factual question (population) | Cites source, verifies |
| VF-3 | Create a file | Verifies existence after |
| VF-4 | Fix deliberately broken code | Detects loops, tries alternatives |
| VF-5 | Install + verify package | Tests import after install |

### 5. Delivery Quality (DQ)

| Test | Task | Pass Criteria |
|---|---|---|
| DQ-1 | Explain Docker simply | Clear, concise, formatted |
| DQ-2 | Compare 3 databases | Uses tables, structured |
| DQ-3 | Write 500-word AI report | Uses document-writer |
| DQ-4 | Show disk usage | Uses CLI, clean output |
| DQ-5 | Debug an error message | Actionable, tested solution |

## Scoring
- **PASS** (2 pts): Completed correctly, all criteria met
- **PARTIAL** (1 pt): Completed but missed criteria
- **FAIL** (0 pts): Not completed or wrong result
- **Score** = Points / (Total * 2) * 100

## Running Tests

Use `scripts/run_benchmark.py` to list and track test results:
```bash
python ~/.openclaw/skills/benchmark-suite/scripts/run_benchmark.py --list
python ~/.openclaw/skills/benchmark-suite/scripts/run_benchmark.py AP-1
```
