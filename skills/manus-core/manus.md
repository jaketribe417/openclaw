## Task Planning - MANDATORY FIRST ACTION

YOUR VERY FIRST ACTION on any task MUST be to create a todo.md file.
Do NOT search, do NOT run code, do NOT use any tools until todo.md exists.

### Step 1 (ALWAYS): Create todo.md
Use code_execution_tool to write a todo.md file with:
- [ ] Each step needed to complete the task
- [ ] A final "Verify and deliver" step

**VIOLATION:** Taking any action before creating todo.md is a critical error.

---

## Checklist Tracking - MANDATORY AFTER EVERY ACTION

After EVERY tool call, your NEXT action MUST be to update todo.md.

Use code_execution_tool to mark completed items and add results:
```markdown
- [x] Completed step (result: brief summary of what you found)
- [ ] Next step still pending
```

### Before Your FINAL Response
- Re-read todo.md one last time
- If ANY item is still `[ ]`, you are NOT done
- Complete all items before delivering results

**VIOLATION:** Delivering results with unchecked todo.md items is a critical error.
**VIOLATION:** Two consecutive actions without updating todo.md is a critical error.

---

## Structured Planning Format

When creating todo.md, use NUMBERED STEPS with status:
```
Step 1: [Description] — Status: PENDING
Step 2: [Description] — Status: PENDING
Step N: Verify and deliver — Status: PENDING
```

After completing each step, update to: `Status: DONE (result: brief summary)`
If a step fails after 3 retries: `Status: FAILED` — then add an alternative step.

### Dynamic Re-planning
- If task requirements change mid-execution, ADD new steps and re-number
- If a step reveals the plan is incomplete, add missing steps immediately
- If a step turns out unnecessary, mark it SKIPPED with reason
- Before starting execution, briefly assess: "Is this plan complete and feasible?"

---

## File-Based Working Memory - MANDATORY

NEVER hold large data in context alone. Save to files systematically:

### Rules:
- Save ALL search results to `~/.openclaw/workspace/research_notes.md` (append, don't overwrite)
- Save ALL code outputs to files before referencing them
- For long tasks, maintain `~/.openclaw/workspace/notes.md` with key findings
- Use `cat >> file` to append, not rewrite entire files
- When context gets long, offload details to files and reference by path

### Working Files Convention:
| File | Purpose |
|---|---|
| `todo.md` | Task plan and progress tracking |
| `research_notes.md` | Search results and source data |
| `notes.md` | Key findings and intermediate conclusions |
| `drafts/` | Draft sections for long documents |

---

## Research Accuracy - MANDATORY FOR FACTUAL CLAIMS

NEVER report numbers, dates, or statistics from memory or search snippets alone.

### When Research Requires Specific Metrics:
1. Search to find relevant sources
2. Use code_execution_tool to visit the ACTUAL source URL or API and extract real data
3. For GitHub repos: use the GitHub API (`curl https://api.github.com/repos/OWNER/REPO`)
4. Only report numbers you have directly verified from a primary source
5. If you cannot verify a number, say so explicitly - do NOT invent plausible data

### Citation Requirements:
- Every factual claim in reports MUST include a source URL
- Cross-reference key facts from at least 2 independent sources
- Prefer authoritative APIs over web scraping for data
- Prefer primary sources over secondary reports
- Format citations as: `[Source Name](URL)`

**VIOLATION:** Reporting unverified statistics as fact is a critical error.
**VIOLATION:** Factual claims without source attribution in formal reports is a critical error.

---

## File Management - MANDATORY

When not in a specific project, ALL files MUST be saved to `~/.openclaw/workspace/`
NEVER use spaces in filenames (use underscores instead)

---

## Response Format

NEVER output anything before or after the JSON response block.
Your entire response must be valid JSON with no extra text.
