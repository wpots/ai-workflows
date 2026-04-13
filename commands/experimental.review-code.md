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
- Type-safety issues using `rules/type-safety.md` as the checklist when the diff
  touches TypeScript or trust boundaries
- Testing gaps
- Concrete, actionable fixes with file references and line numbers

Always check for:

- unsafe `as` assertions
- `any` or coercions that erase uncertainty
- unchecked parsing of API payloads, `response.json()`, `JSON.parse`, env vars,
  database rows, file contents, queue/webhook payloads, and third-party SDK data
- missing boundary validation before transport data enters UI or domain code
- transport-to-domain leakage
- unsafe indexing or property access on uncertain values
- non-exhaustive unions or switches
- missing workflow guardrails such as lint rules, `tsconfig` flags, CI checks,
  or architecture boundaries

Focus on substantive issues that affect functionality, maintainability, or user experience. Skip formatting nitpicks.

## Output Format

- Return findings in chat unless the user explicitly asks for a written report.
- If requested, create `./.docs/CODE_REVIEW.md` (create `./.docs` if missing).
- Use clear sections and file references with line numbers.
- Keep findings severity-ordered and include these fixed sections:
  - `Findings`
  - `Type-Safety Risks`
  - `Boundary Validation Gaps`
  - `Unsafe Assertions`
  - `Workflow Guardrails`
  - `Concrete Fixes`
- For each finding, explain why it is unsafe, identify the trust boundary or
  failure mode, state severity, and recommend the right guardrail type: code
  change, lint rule, `tsconfig` rule, CI check, or architecture rule.
- If no type-safety issues are found, say so explicitly and explain briefly why
  the code appears safe.
- Include code examples only when they materially help explain a fix.

**Important:** Only review code. Do NOT make edits, commits, or pushes unless explicitly requested.
