---
name: knowledge-base
version: 1.0.0
description: Curated best practices and expert knowledge for coding, research, data analysis, and writing tasks. Provides domain-specific context to improve task quality.
tags: [knowledge, best-practices, coding, research, writing, data]
author: openclaw
---

# Knowledge Base Skill

Curated expert knowledge to inject into task planning and execution.
Load this skill when starting complex tasks to access domain best practices.

## How to Use
1. Load this skill at the START of complex tasks
2. Identify which domain applies to the current task
3. Follow the relevant best practices section
4. Reference the checklists before delivering results

## Domain: Software Development

### Architecture Best Practices
- Start with the simplest solution that works; add complexity only when needed
- Separate concerns: data, logic, presentation
- Use environment variables for configuration, never hardcode secrets
- Write functions that do ONE thing well (Single Responsibility)
- Handle errors explicitly — never silently swallow exceptions

### Code Quality Checklist
- [ ] Code runs without errors (tested)
- [ ] No hardcoded values — use variables/config
- [ ] Error handling for all external calls (API, file I/O, network)
- [ ] Comments explain WHY, not WHAT
- [ ] No unused imports or dead code
- [ ] Consistent naming conventions
- [ ] Input validation on user-facing functions

### Python Best Practices
- Use `pathlib` over `os.path` for file operations
- Use `with` statements for file/resource handling
- Prefer f-strings over .format() or %
- Use type hints for function signatures
- Use `logging` module over `print()` for production code
- Virtual environments for project isolation

### JavaScript/Node Best Practices
- Use `const` by default, `let` when needed, never `var`
- Use async/await over raw Promises
- Use template literals for string interpolation
- Handle Promise rejections explicitly
- Use `===` over `==` for comparisons

## Domain: Research & Analysis

### Research Methodology
1. **Define** the question precisely before searching
2. **Search** using 3+ different queries/angles
3. **Verify** facts from primary sources (not secondary reports)
4. **Cross-reference** key claims from 2+ independent sources
5. **Document** sources with URLs as you find them
6. **Synthesize** — don't just list findings, draw conclusions

### Data Analysis Best Practices
- Always inspect data first: shape, types, nulls, distributions
- Clean data BEFORE analysis: handle missing values, outliers
- Use appropriate chart types: bar (comparison), line (trends), scatter (correlation)
- State sample size and methodology with every statistic
- Correlation is not causation — be careful with claims
- Show your work: save intermediate data files

### Source Credibility Hierarchy
1. Official APIs and primary databases (most reliable)
2. Peer-reviewed papers and official reports
3. Established news outlets and industry publications
4. Company blogs and documentation
5. Community forums and social media (least reliable)

## Domain: Writing & Documentation

### Report Structure Template
```
1. Executive Summary (what, why, key findings)
2. Background/Context (what reader needs to know)
3. Methodology (how you did it)
4. Findings (organized by theme, with evidence)
5. Analysis (what the findings mean)
6. Recommendations (specific, actionable)
7. Appendix (raw data, detailed tables)
```

### Technical Writing Rules
- Lead with the conclusion, then support it
- One idea per paragraph
- Use concrete examples for abstract concepts
- Define acronyms on first use
- Use consistent terminology throughout
- Tables for structured data, prose for narratives

### Email/Communication Templates
- **Status Update**: What was done, what's next, any blockers
- **Request**: Context, specific ask, deadline, why it matters
- **Report**: Summary, key findings, recommendations, next steps

## Domain: System Administration

### Security Practices
- Never store secrets in code or plain text files
- Use environment variables or secret managers
- Validate all user input (assume hostile)
- Keep packages updated: `apt-get update && apt-get upgrade`
- Use HTTPS for all external communications
- Principle of least privilege for permissions

### Performance Debugging
1. Measure first — don't optimize without data
2. Check: CPU, memory, disk I/O, network in that order
3. Tools: `top`, `htop`, `iostat`, `netstat`, `strace`
4. Profile code before optimizing: `cProfile`, `py-spy`
5. Cache expensive operations, batch I/O operations

### Deployment Checklist
- [ ] Code tested and passing
- [ ] Environment variables configured
- [ ] Dependencies listed (requirements.txt / package.json)
- [ ] Health check endpoint available
- [ ] Logging configured
- [ ] Backup/rollback plan defined
