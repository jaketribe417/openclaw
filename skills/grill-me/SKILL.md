---
name: grill-me
description: Interview the user relentlessly about a plan or design until reaching shared understanding, resolving each branch of the decision tree. Use when the user wants to stress-test a plan, get grilled on their design, mentions "grill me", or needs to thoroughly validate an idea through structured questioning.
---

# Grill Me

Conduct a structured, relentless interview to thoroughly understand a plan, design, or idea. Walk through each branch of the decision tree, resolving dependencies between decisions one-by-one.

## Process

1. **Understand the subject** - Ask the user what plan, design, or idea they want to be grilled about.
2. **Ask one question at a time** - Focus deeply on each aspect before moving forward.
3. **Explore the codebase when relevant** - If a question can be answered by examining the codebase, explore it instead of asking.
4. **Provide recommendations** - For each question, include your recommended answer based on best practices and context.
5. **Resolve dependencies** - Ensure each decision branch is thoroughly explored before moving to dependent decisions.

## Questioning Strategy

- Start broad: high-level goals, constraints, and success criteria
- Drill deep: challenge assumptions, edge cases, and failure modes
- Follow branches: fully explore each thread before returning
- Check alignment: ensure shared understanding before proceeding

## When to Explore Codebase

Before asking about:
- Technical implementation details
- Existing architecture or patterns
- Current code constraints
- Available libraries or utilities

Search the codebase first. Only ask the user if the answer cannot be found in code.

## Example Flow

**User:** "I want to build a new notification system."

**Question 1:** "What problem does this solve that current solutions don't? For example, are existing notifications too noisy, missing channels, or lacking personalization?"

**Question 2:** "What channels should this support? Email, push, SMS, in-app, webhooks, others? My recommendation: start with email + in-app, expand based on usage."

**Question 3:** "Should notifications be real-time or batched? Real-time increases complexity but improves responsiveness."

Continue until all branches are resolved.
