# Spike: Decide Cursor Parity For AI-WORKFLOWS Guide

## Status

draft

## Ticket

AIW-109

## Priority

medium

## Summary

Decide whether Cursor should explicitly read `AI-WORKFLOWS.md` in synced projects or whether its current convention adapter should stay intentionally minimal.

## User Story

As a maintainer of `ai-workflows`, I want an intentional Cursor strategy, so that the project adapters either stay minimal by design or align more closely with the rest of the tool-loading model.

## Acceptance Criteria

- [ ] The current Cursor behavior is documented from the actual generated project files.
- [ ] The team decides whether [templates/project-cursor-conventions.mdc](/Users/wietekepots/Web/ai-workflows/templates/project-cursor-conventions.mdc) should also point to `AI-WORKFLOWS.md`.
- [ ] The trade-off is written down: minimal context versus stronger parity with other tools.
- [ ] If parity is chosen, the template and related docs are updated.
- [ ] If minimalism is chosen, the docs explicitly say this is intentional rather than an omission.
- [ ] The decision does not conflict with [templates/project-ai-workflows.md](/Users/wietekepots/Web/ai-workflows/templates/project-ai-workflows.md) or the repo’s explanation of tool-loading behavior.

## Technical Notes

This is a decision item first, implementation second. The current setup points Cursor to `CONVENTIONS.md` and `rules/`, while other tools also route through `AI-WORKFLOWS.md`.

Relevant files:

- [templates/project-cursor-conventions.mdc](/Users/wietekepots/Web/ai-workflows/templates/project-cursor-conventions.mdc)
- [templates/project-ai-workflows.md](/Users/wietekepots/Web/ai-workflows/templates/project-ai-workflows.md)
- [README.md](/Users/wietekepots/Web/ai-workflows/README.md)

Choose the simpler option unless there is a concrete benefit to Cursor parity beyond conceptual neatness.

## Out of Scope

- Rewriting Cursor support broadly
- Adding Cursor-only behavior unrelated to project loading
- Changing other tool adapters only to mimic Cursor

## Related

- [templates/project-cursor-conventions.mdc](/Users/wietekepots/Web/ai-workflows/templates/project-cursor-conventions.mdc)
- [templates/project-ai-workflows.md](/Users/wietekepots/Web/ai-workflows/templates/project-ai-workflows.md)
- [README.md](/Users/wietekepots/Web/ai-workflows/README.md)
