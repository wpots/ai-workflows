# Feature: Add Project Sync Smoke Test

## Status

done

Delivered (verified 2026-07-29): `scripts/smoke-test-project-sync.sh` runs sync against a disposable temp dir, asserts all eight generated paths in both the CONVENTIONS-present and CONVENTIONS-missing scenarios, and checks prompt/command alignment. Documented in the README ("Smoke test project sync") and wired into `scripts/validate-ai-instructions.sh`. The experimental-inclusion criterion is moot: `sync.sh` no longer has an experimental tier or flag.

## Ticket

AIW-107

## Priority

high

## Summary

Add a lightweight smoke test for project sync so the generated project setup can be validated end to end whenever the sync model changes.

## User Story

As a maintainer of `ai-workflows`, I want a repeatable project-sync verification step, so that changes to templates and sync logic do not silently break generated project scaffolding.

## Acceptance Criteria

- [x] There is a documented or scripted smoke test that runs `scripts/sync.sh --project <temp-dir>` against a disposable target.
- [x] The smoke test verifies creation or update of `AI-WORKFLOWS.md`, `CLAUDE.md`, `AGENTS.md`, `.github/copilot-instructions.md`, `.cursor/rules/conventions.mdc`, `rules/`, `commands/`, and `.github/prompts/`.
- [x] The smoke test covers behavior when `CONVENTIONS.md` exists and when it is missing.
- [x] The smoke test verifies that generated prompt files align with synced commands.
- [x] Experimental inclusion behavior is covered or explicitly documented as out of scope for the first version. (Moot: the experimental tier was removed from `sync.sh`; all commands, rules, and skills sync by default.)
- [x] The smoke test is easy for a maintainer to run before merging repo-level workflow changes.

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
