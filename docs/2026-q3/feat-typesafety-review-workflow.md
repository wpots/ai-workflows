# Feature: Upgrade Review Workflow For Real Type Safety

## Status

done

Delivered (verified 2026-07-29): `skills/code-review/SKILL.md` and `commands/review-code.md` both carry the explicit type-safety audit, all seven mandatory checks, the five fixed output sections, per-finding guardrail classification, and the clean-report requirement. The design decision (extend the general review workflow rather than add a separate skill) is documented in the skill itself.

## Ticket

AIW-103

## Priority

critical

## Summary

Extend the existing review workflow so code reviews consistently audit runtime trust boundaries, unsafe assertions, and missing enforcement guardrails instead of only checking surface-level TypeScript style.

## User Story

As a developer using `ai-workflows` for code review, I want review output to flag where type certainty is actually lost, so that review feedback catches unsafe assertions and missing validation close to the real failure point.

## Acceptance Criteria

- [x] The review skill in [skills/code-review/SKILL.md](/Users/wietekepots/Web/ai-workflows/skills/code-review/SKILL.md) explicitly reviews for real type safety, not only syntax-level TypeScript quality.
- [x] The review command in [commands/review-code.md](/Users/wietekepots/Web/ai-workflows/commands/review-code.md) includes mandatory checks for unsafe `as`, `any`, unchecked parsing, missing boundary validation, transport/domain leakage, unsafe indexing, and non-exhaustive unions.
- [x] Review output requires fixed sections such as `Type-Safety Risks`, `Boundary Validation Gaps`, `Unsafe Assertions`, `Workflow Guardrails`, and `Concrete Fixes`.
- [x] Each finding must explain why the code is unsafe, identify the trust boundary or failure mode, classify severity, and recommend the relevant guardrail type: code change, lint rule, `tsconfig` rule, CI check, or architecture rule.
- [x] The workflow states what to report when no issues are found, including why the code appears safe.
- [x] The design decision is documented: either extend the existing review skill or add a dedicated type-safety review skill, with the simpler option preferred unless overlap becomes unmanageable.

## Technical Notes

The current review assets already mention type safety, but only lightly. The gap is in specificity and output structure.

Start by upgrading the existing assets before adding a new skill:

- [skills/code-review/SKILL.md](/Users/wietekepots/Web/ai-workflows/skills/code-review/SKILL.md)
- [commands/review-code.md](/Users/wietekepots/Web/ai-workflows/commands/review-code.md)

Use the new dedicated type-safety rule as the checklist source so review logic does not drift from the written policy.

If the expanded review scope becomes too heavy for the generic review workflow, split it into a separate skill such as `typesafe-review` and keep the generic review skill as the broad entry point.

## Out of Scope

- Automatically fixing review findings
- Enforcing runtime validators in downstream projects
- Replacing the general review workflow with a type-safety-only workflow for every use case

## Related

- [skills/code-review/SKILL.md](/Users/wietekepots/Web/ai-workflows/skills/code-review/SKILL.md)
- [commands/review-code.md](/Users/wietekepots/Web/ai-workflows/commands/review-code.md)
- [rules/rules.md](/Users/wietekepots/Web/ai-workflows/rules/rules.md)
