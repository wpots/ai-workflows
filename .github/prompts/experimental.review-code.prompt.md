---
name: experimental.review-code
description: "Code Review"
---

# Code Review

This runbook is the compatibility and fallback surface for the canonical
`experimental.code-review` skill.

Preferred path:

1. If the current tool supports skills reliably, use
   `skills/experimental.code-review/SKILL.md` as the primary workflow.
2. Use this runbook for prompt-first tools such as Copilot, or when the skill
   path is unavailable.

Review current code changes against the best available remote base branch.

## Base Branch Resolution

Resolve in this order and use the first branch that exists:

1. `origin/development`
2. `origin/main`
3. `origin/master`

If none exist, stop and ask the user which base branch to use.

## Fallback Review Scope

Compare all changes between current branch and the resolved base branch and provide:

- Severity-ordered findings first
- Functional regressions and correctness risks
- Security concerns
- Performance issues
- Accessibility gaps
- Type-safety issues
- Testing gaps
- Concrete, actionable fixes with file references and line numbers

Focus on substantive issues that affect functionality, maintainability, or user experience. Skip formatting nitpicks.

## Output Format

- Return findings in chat unless the user explicitly asks for a written report.
- If requested, create `./.docs/CODE_REVIEW.md` (create `./.docs` if missing).
- Use clear sections and file references with line numbers.
- Include code examples only when they materially help explain a fix.

**Important:** Only review code. Do NOT make edits, commits, or pushes unless explicitly requested.
