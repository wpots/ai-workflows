# Feature: Add Project Sync Smoke Test

## Status

draft

## Ticket

AIW-107

## Priority

high

## Summary

Add a lightweight smoke test for project sync so the generated project setup can be validated end to end whenever the sync model changes.

## User Story

As a maintainer of `ai-workflows`, I want a repeatable project-sync verification step, so that changes to templates and sync logic do not silently break generated project scaffolding.

## Acceptance Criteria

- [ ] There is a documented or scripted smoke test that runs `scripts/sync.sh --project <temp-dir>` against a disposable target.
- [ ] The smoke test verifies creation or update of `AI-WORKFLOWS.md`, `CLAUDE.md`, `AGENTS.md`, `.github/copilot-instructions.md`, `.cursor/rules/conventions.mdc`, `rules/`, `commands/`, and `.github/prompts/`.
- [ ] The smoke test covers behavior when `CONVENTIONS.md` exists and when it is missing.
- [ ] The smoke test verifies that generated prompt files align with synced commands.
- [ ] Experimental inclusion behavior is covered or explicitly documented as out of scope for the first version.
- [ ] The smoke test is easy for a maintainer to run before merging repo-level workflow changes.

## Technical Notes

The main value is regression prevention, not a heavy test harness. A shell-based smoke test or documented validation workflow is enough if it is reliable.

Likely touchpoints:

- [scripts/sync.sh](/Users/wietekepots/Web/ai-workflows/scripts/sync.sh)
- [templates/project-ai-workflows.md](/Users/wietekepots/Web/ai-workflows/templates/project-ai-workflows.md)
- [templates/project-CLAUDE.md](/Users/wietekepots/Web/ai-workflows/templates/project-CLAUDE.md)
- [templates/project-AGENTS.md](/Users/wietekepots/Web/ai-workflows/templates/project-AGENTS.md)
- [templates/project-copilot-instructions.md](/Users/wietekepots/Web/ai-workflows/templates/project-copilot-instructions.md)

Start with a single happy-path smoke test and expand only if regressions keep escaping.

## Out of Scope

- Full integration tests for every supported external tool
- Networked validation against real IDEs
- Consumer project linting or building

## Related

- [scripts/sync.sh](/Users/wietekepots/Web/ai-workflows/scripts/sync.sh)
- [templates/project-ai-workflows.md](/Users/wietekepots/Web/ai-workflows/templates/project-ai-workflows.md)
