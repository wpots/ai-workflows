# Chore: Integrate Type-Safety Guidance Across Sync, Docs, And Init Project

## Status

draft

## Ticket

AIW-104

## Priority

medium

## Summary

Wire the new type-safety guidance into the repo documentation and project bootstrap flow so teams can discover it, sync it, and see where it fits in generated project scaffolding.

## User Story

As a maintainer of `ai-workflows`, I want the new type-safety policy to be visible in docs and reflected in project setup guidance, so that teams understand how the baseline rules, detailed rules, and review workflows fit together.

## Acceptance Criteria

- [ ] [README.md](/Users/wietekepots/Web/ai-workflows/README.md) mentions the new type-safety baseline and where the deeper enforcement guidance lives.
- [ ] [FEATURES.md](/Users/wietekepots/Web/ai-workflows/FEATURES.md) lists the new rule and any new or upgraded review skill coverage.
- [ ] If a new rule file or skill is added, the repo’s inventory and trigger documentation are updated consistently.
- [ ] [skills/experimental.init-project/SKILL.md](/Users/wietekepots/Web/ai-workflows/skills/experimental.init-project/SKILL.md) is updated so new projects can surface TypeScript strictness, lint posture, and trust-boundary deviations in `CONVENTIONS.md` when relevant.
- [ ] The project bootstrap guidance distinguishes between universal baseline rules, detailed type-safety policy, and review-specific audit behavior.
- [ ] The resulting docs make clear that `ai-workflows` recommends compile-time strictness plus runtime validation at trust boundaries, not TypeScript-only confidence.

## Technical Notes

This item is mostly connective tissue. The repo already has a stronger split between compact baseline instructions and project-facing adapters, so the work here is to make the type-safety guidance discoverable instead of implicit.

Likely touchpoints:

- [README.md](/Users/wietekepots/Web/ai-workflows/README.md)
- [FEATURES.md](/Users/wietekepots/Web/ai-workflows/FEATURES.md)
- [skills/experimental.init-project/SKILL.md](/Users/wietekepots/Web/ai-workflows/skills/experimental.init-project/SKILL.md)
- Possibly [templates/project-ai-workflows.md](/Users/wietekepots/Web/ai-workflows/templates/project-ai-workflows.md) if project-facing explanation is needed

Use the init-project skill to surface deviations such as weak `tsconfig`, missing unsafe-type lint rules, or absent boundary-validation conventions without hard-coding one stack-specific implementation.

## Out of Scope

- Building a full project analyzer for every TypeScript variant
- Auto-modifying downstream `tsconfig` or ESLint files
- Creating a new sync mode

## Related

- [README.md](/Users/wietekepots/Web/ai-workflows/README.md)
- [FEATURES.md](/Users/wietekepots/Web/ai-workflows/FEATURES.md)
- [skills/experimental.init-project/SKILL.md](/Users/wietekepots/Web/ai-workflows/skills/experimental.init-project/SKILL.md)
- [templates/project-ai-workflows.md](/Users/wietekepots/Web/ai-workflows/templates/project-ai-workflows.md)
