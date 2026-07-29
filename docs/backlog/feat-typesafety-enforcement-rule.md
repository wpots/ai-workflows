# Feature: Add Reusable Type-Safety Enforcement Rule

## Status

done

Delivered (verified 2026-07-29): `rules/type-safety.md` exists with all seven trust boundaries, the unknown-validate-trust pattern, all eight recommended `tsconfig` flags, and all nine lint guardrails; it is indexed in `rules/rules.md` with loading guidance and closes with a "Relation To Other Surfaces" section.

## Ticket

AIW-102

## Priority

high

## Summary

Create a dedicated reusable rule file that captures the stronger type-safety policy discussed: strict compiler posture, unsafe-pattern linting, trust-boundary validation, and transport-to-domain separation.

## User Story

As a maintainer of `ai-workflows`, I want a focused rule that AI tools can load when working in TypeScript-heavy codebases, so that they can recommend consistent guardrails in code generation and review.

## Acceptance Criteria

- [x] A new rule file exists in `rules/` for TypeScript and boundary safety.
- [x] [rules/rules.md](/Users/wietekepots/Web/ai-workflows/rules/rules.md) indexes the new rule and states when to load it.
- [x] The rule covers trust boundaries such as API payloads, `JSON.parse`, env vars, database rows, files, queues, and third-party libraries.
- [x] The rule documents the preferred pattern: boundary data starts as `unknown`, is validated, and only then becomes a trusted domain type.
- [x] The rule includes recommended `tsconfig` flags such as `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `useUnknownInCatchVariables`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `noFallthroughCasesInSwitch`, and `noEmitOnError`.
- [x] The rule includes recommended lint guardrails such as `no-explicit-any`, `no-unsafe-assignment`, `no-unsafe-member-access`, `no-unsafe-call`, `no-unsafe-return`, `no-unsafe-argument`, `no-unnecessary-type-assertion`, `consistent-type-assertions`, and `switch-exhaustiveness-check`.
- [x] The rule distinguishes clearly between compact universal doctrine and deeper workflow enforcement guidance.

## Technical Notes

Add a focused file such as `rules/typescript-safety.md` or `rules/type-safety.md`. Keep it concrete and workflow-oriented rather than theoretical.

The document should help an AI answer questions like:

- which compiler flags strengthen apparent type safety
- which lint rules catch lost certainty
- how to review unsafe `as` usage
- how to separate DTOs from validated domain models

This rule should become the canonical reference for future skill and command updates instead of duplicating the checklist in multiple places.

## Out of Scope

- Shipping an actual ESLint config package from this repo
- Enforcing these rules automatically in every consumer repo
- Runtime schema-library selection for all projects

## Related

- [rules/rules.md](/Users/wietekepots/Web/ai-workflows/rules/rules.md)
- [rules/project.md](/Users/wietekepots/Web/ai-workflows/rules/project.md)
- [shared/core-rules.md](/Users/wietekepots/Web/ai-workflows/shared/core-rules.md)
