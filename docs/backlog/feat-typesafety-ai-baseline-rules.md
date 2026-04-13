# Feature: Add Type-Safety Baseline To Shared AI Rules

## Status

draft

## Ticket

AIW-101

## Priority

high

## Summary

Add a compact type-safety doctrine to the shared AI baseline so generated code defaults to safer TypeScript and JavaScript patterns, not just superficially correct typings.

## User Story

As a maintainer of `ai-workflows`, I want the shared AI rules to prefer real type safety by default, so that generated code across projects avoids unsafe assertions and treats external input as untrusted until validated.

## Acceptance Criteria

- [ ] `shared/core-rules.md` includes a concise baseline covering untrusted boundary data, avoidance of broad `as`, avoidance of `any`, and preference for narrowing over coercion.
- [ ] The baseline keeps the always-loaded guidance compact and does not duplicate a full TypeScript handbook.
- [ ] The wording applies to both generated code and refactors, not only to code review.
- [ ] The rule explicitly prefers discriminated unions and validated boundary parsing over loose optional shapes and asserted certainty.
- [ ] The updated baseline is reflected in generated adapters that already inline `core-rules`, including [.github/copilot-instructions.md](/Users/wietekepots/Web/ai-workflows/.github/copilot-instructions.md).
- [ ] The repo documentation explains that this is the universal default and that deeper type-safety policy lives in a dedicated rule or review workflow.

## Technical Notes

Update the compact baseline in [shared/core-rules.md](/Users/wietekepots/Web/ai-workflows/shared/core-rules.md) first, because that content is already injected into Copilot-facing instructions and acts as the smallest cross-project doctrine.

Keep the additions short and durable. Good candidates are:

- treat external input as untrusted until validated
- avoid `any`
- avoid broad `as` assertions except narrow, justified adapter cases
- prefer `unknown` plus narrowing at boundaries
- prefer discriminated unions over loose optional-state objects

Check whether a small companion note also belongs in [rules/project.md](/Users/wietekepots/Web/ai-workflows/rules/project.md) so non-Copilot flows inherit the same default posture without overloading the shared core fragment.

## Out of Scope

- Defining the full lint and `tsconfig` policy in the compact baseline
- Rewriting existing review skills in this item
- Adding project-specific exceptions for individual repos

## Related

- [shared/core-rules.md](/Users/wietekepots/Web/ai-workflows/shared/core-rules.md)
- [.github/copilot-instructions.md](/Users/wietekepots/Web/ai-workflows/.github/copilot-instructions.md)
- [templates/project-copilot-instructions.md](/Users/wietekepots/Web/ai-workflows/templates/project-copilot-instructions.md)
