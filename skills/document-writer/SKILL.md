---
name: document-writer
version: 1.0.0
description: Structured workflow for creating long documents, reports, and articles. Manages outline, drafts, assembly, and quality review.
tags: [writing, documents, reports, drafts, long-form]
author: openclaw
---

# Document Writer Skill

Structured workflow for producing high-quality long documents.

## When to Use
- Reports longer than 500 words
- Multi-section documents (research reports, guides, proposals)
- Any deliverable that benefits from planning before writing

## Workflow

### Step 1: Initialize Project
```bash
python ~/.openclaw/skills/document-writer/scripts/doc_init.py --title "My Report" --sections "Intro,Analysis,Results,Conclusion" --output ~/.openclaw/workspace/drafts
```
This creates:
```
drafts/
├── outline.md          # Section outline with goals
├── section_01_intro.md  # Empty section file
├── section_02_analysis.md
├── section_03_results.md
├── section_04_conclusion.md
└── metadata.json        # Title, created date, status
```

### Step 2: Write Each Section
- Write content into each `section_XX_*.md` file
- Focus on ONE section at a time
- Reference outline.md for section goals
- Save research/sources alongside in `drafts/sources.md`

### Step 3: Assemble Final Document
```bash
python ~/.openclaw/skills/document-writer/scripts/doc_assemble.py --drafts ~/.openclaw/workspace/drafts --output ~/.openclaw/workspace/final_report.md
```
This:
- Combines all sections in order
- Adds title and table of contents
- Removes draft markers
- Outputs final document

### Step 4: Quality Review
Before delivering, check against writing.md quality rules:
- [ ] Clear title and introduction
- [ ] Every section has purpose
- [ ] Claims are sourced
- [ ] Consistent formatting
- [ ] Actionable recommendations

## Notes
- Always work section-by-section, never write entire document at once
- Save intermediate work to files — never hold full document in context
- Use this for ANY document over 500 words
- Pairs with the writing quality rules in the system prompt
