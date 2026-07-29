# Chore: Align Generator And Validator With The New Project Model

## Status

done

Delivered (verified 2026-07-29): `scripts/generate-adapters.sh` documents its three stages against the current model; `.vscode/tasks.json` is explicitly demoted to "a generated convenience surface, not a primary project-model artifact" in the generator, README, and FEATURES; `scripts/validate-ai-instructions.sh` now runs skill validation, adapter regeneration, the project-sync smoke test, and drift checks on all generated artifacts. Known residual (non-blocking): `.claude-plugin/*.json` is not yet validated, and the README one-liner for the validator understates what it runs.

## Ticket

AIW-105

## Priority

high

## Summary

Update the generator and validation scripts so they consistently reflect the current project model built around `AI-WORKFLOWS.md`, thin adapters, inline Copilot core rules, and the reduced role of `.vscode/tasks.json`.

## User Story

As a maintainer of `ai-workflows`, I want generation and drift validation to match the current architecture, so that automation no longer treats outdated artifacts as first-class and does not hide gaps in the newer project sync model.

## Acceptance Criteria

- [x] The responsibilities of [scripts/generate-adapters.sh](/Users/wietekepots/Web/ai-workflows/scripts/generate-adapters.sh) are reviewed against the current repo model.
- [x] A clear decision is made on whether `.vscode/tasks.json` remains a generated primary artifact, becomes optional, or is removed from the critical path.
- [x] [scripts/validate-ai-instructions.sh](/Users/wietekepots/Web/ai-workflows/scripts/validate-ai-instructions.sh) validates the artifacts that matter most in the current model.
- [x] Generated artifacts and validated artifacts are documented consistently.
- [x] If `.vscode/tasks.json` stays, its role is explicitly documented in the repo architecture.
- [x] If `.vscode/tasks.json` is de-emphasized or removed, the generator and validator are updated together so no stale drift checks remain.

## Technical Notes

The current gap is that the repo messaging has moved toward `AI-WORKFLOWS.md`, project adapters, and prompt generation, while the generator and validator still strongly center `.vscode/tasks.json`.

Review these files together:

- [scripts/generate-adapters.sh](/Users/wietekepots/Web/ai-workflows/scripts/generate-adapters.sh)
- [scripts/validate-ai-instructions.sh](/Users/wietekepots/Web/ai-workflows/scripts/validate-ai-instructions.sh)
- [README.md](/Users/wietekepots/Web/ai-workflows/README.md)

Keep the outcome simple. The main goal is not more automation, but automation that matches the actual product shape of the repo.

## Out of Scope

- Adding a full new build system
- Changing project sync behavior beyond what is needed for consistency
- Rewriting unrelated scripts

## Related

- [scripts/generate-adapters.sh](/Users/wietekepots/Web/ai-workflows/scripts/generate-adapters.sh)
- [scripts/validate-ai-instructions.sh](/Users/wietekepots/Web/ai-workflows/scripts/validate-ai-instructions.sh)
- [README.md](/Users/wietekepots/Web/ai-workflows/README.md)
