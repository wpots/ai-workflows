---
name: code-review
description: Review current branch changes against remote base branch and produce a structured, severity-ordered review with file references and actionable fixes.
---

# Code Review Skill

Use this skill when the user requests review of current changes.

## Base Branch Resolution

Use the first existing branch in this order:

1. `origin/development`
2. `origin/main`
3. `origin/master`

If none exists, ask the user which base branch to use.

## Workflow

1. Compare current branch against resolved base branch.
2. Prioritize findings by severity:
- Functional bugs/regressions
- Security risks
- Performance issues
- Accessibility and maintainability gaps
3. Provide concrete file references with line numbers.
4. Include targeted fixes or examples for high-impact findings.
5. If requested, write report to `./.docs/CODE_REVIEW.md`.

## Constraints

- Focus on substantive issues; skip style-only nitpicks.
- Do not edit code unless explicitly requested.
