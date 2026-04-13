---
name: code-review
description: Review current branch changes against remote base branch and produce a structured, severity-ordered review with file references and actionable fixes.
---

# Code Review Skill

Use this skill when the user requests review of current changes.

This skill is the canonical workflow source for code review on skill-aware
tools. The matching command runbook is a compatibility and fallback surface.
The current design decision is to keep one general review workflow and extend it
with an explicit type-safety audit instead of creating a separate type-safety
review skill.

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
- Type-safety risks and missing guardrails
3. When the diff includes TypeScript or boundary-heavy code, use
   `rules/type-safety.md` as the checklist source.
4. Always check for:
- unsafe `as` assertions
- `any` or certainty-erasing coercion
- unchecked parsing (`JSON.parse`, `response.json()`, env vars, database rows,
  files, queue/webhook payloads, third-party SDK data)
- missing boundary validation
- transport-to-domain leakage
- unsafe indexing or property access on uncertain values
- non-exhaustive unions or switches
- missing guardrails that should have caught the issue earlier (`tsconfig`,
  lint, CI, architecture rules)
5. Provide concrete file references with line numbers.
6. For each finding, explain:
- why the code is unsafe
- the trust boundary or failure mode
- severity
- the best guardrail type: code change, lint rule, `tsconfig` rule, CI check, or architecture rule
7. Include targeted fixes or examples for high-impact findings.
8. If requested, write report to `./.docs/CODE_REVIEW.md`.

## Output Format

Keep findings first and severity-ordered, then use these fixed sections:

1. `Findings`
2. `Type-Safety Risks`
3. `Boundary Validation Gaps`
4. `Unsafe Assertions`
5. `Workflow Guardrails`
6. `Concrete Fixes`

If a section has no issues, say `None found.` If no type-safety issues are
found, explain briefly why the code appears safe, for example validated
boundaries, no unsafe assertions, and exhaustive handling of variants.

## Constraints

- Focus on substantive issues; skip style-only nitpicks.
- Do not edit code unless explicitly requested.
