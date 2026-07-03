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
5. If the diff touches route/page/layout files, page-level templates, modules,
   or components (per the detected stack rule, e.g. `src/app/**/page.tsx`,
   `src/app/**/layout.tsx`, `src/templates/**`, `src/modules/**`,
   `src/components/**` for Next.js), run the **Definition of Done** checklist
   from the stack rule (e.g. `rules/stacks/nextjs-payload.md`) over the changed
   files and report violations as findings instead of only flagging generic
   guardrail gaps:
   - page = route control flow + `<Template/>` only (no markup, fetch, or
     view-model derivation)
   - fetch + view-model derivation in `templates/<Name>/load<Name>.ts`; pure
     raw → props mapping in `Transform*.ts`
   - paths via the project's central route helper (no hand-written,
     locale-prefixed URL strings)
   - component prop interfaces in `types.ts`, never inline in the `.tsx`
   - one transform per module; hooks hold client state only
   If a violation is pre-existing neighbour code the diff didn't introduce,
   note it as a suggested follow-up rather than a blocking finding (see
   "Conform to the rule, not the neighbour" in `rules/clean-architecture.md`).
6. Provide concrete file references with line numbers.
7. For each finding, explain:
- why the code is unsafe
- the trust boundary or failure mode
- severity
- the best guardrail type: code change, lint rule, `tsconfig` rule, CI check, or architecture rule
8. Include targeted fixes or examples for high-impact findings.
9. If requested, write report to `./.docs/CODE_REVIEW.md`.

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
