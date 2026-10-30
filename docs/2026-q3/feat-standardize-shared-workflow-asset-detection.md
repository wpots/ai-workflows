# Feature: Standardize Shared Workflow Asset Detection

## Status

done

Delivered (verified 2026-07-29): `shared/workflow-assets.md` is the single canonical list, injected into all four adapters via the `SHARED:workflow-assets` markers by `scripts/sync.sh`; `commands/create-pr.md`, `skills/create-pr/SKILL.md`, and `skills/upstream-rules/SKILL.md` all defer to the `Shared Workflow Assets` section in `AI-WORKFLOWS.md` as the source of truth. Known residual nits (non-blocking): `.claude/settings.json` is in the canonical list but missing from the upstream-rules trigger list and mapping table, and the create-pr fallback list is still a hand-written subset.

## Ticket

AIW-106

## Priority

high

## Summary

Standardize which files count as reusable shared workflow assets so commands, skills, and templates consistently recognize when a change should be upstreamed into `ai-workflows`.

## User Story

As a maintainer of `ai-workflows`, I want all upstream-aware workflows to use the same definition of shared workflow assets, so that PR guidance and upstream suggestions are consistent across tools.

## Acceptance Criteria

- [x] A single canonical definition of shared workflow assets is chosen.
- [x] The definition includes the current project model, including `AI-WORKFLOWS.md`, `commands/**`, `rules/**`, `.github/prompts/**`, and relevant adapter files.
- [x] [commands/create-pr.md](/Users/wietekepots/Web/ai-workflows/commands/create-pr.md) uses the updated definition.
- [x] [skills/create-pr/SKILL.md](/Users/wietekepots/Web/ai-workflows/skills/create-pr/SKILL.md) uses the updated definition.
- [x] [skills/upstream-rules/SKILL.md](/Users/wietekepots/Web/ai-workflows/skills/upstream-rules/SKILL.md) is checked for consistency with the same terminology and file mapping.
- [x] Shared-asset wording in templates does not conflict with workflow behavior.

## Technical Notes

The repo has already moved toward a clearer split between project-owned conventions and synced shared workflow assets, but the PR-related workflows still use an older subset.

Look at these files together:

- [commands/create-pr.md](/Users/wietekepots/Web/ai-workflows/commands/create-pr.md)
- [skills/create-pr/SKILL.md](/Users/wietekepots/Web/ai-workflows/skills/create-pr/SKILL.md)
- [skills/upstream-rules/SKILL.md](/Users/wietekepots/Web/ai-workflows/skills/upstream-rules/SKILL.md)
- [templates/project-AGENTS.md](/Users/wietekepots/Web/ai-workflows/templates/project-AGENTS.md)
- [templates/project-CLAUDE.md](/Users/wietekepots/Web/ai-workflows/templates/project-CLAUDE.md)
- [templates/project-copilot-instructions.md](/Users/wietekepots/Web/ai-workflows/templates/project-copilot-instructions.md)

Prefer one reusable definition source over repeating slightly different lists in many files.

## Out of Scope

- Automatic upstreaming without user confirmation
- Changing GitHub or GitLab execution logic
- Project-specific conventions in `CONVENTIONS.md`

## Related

- [commands/create-pr.md](/Users/wietekepots/Web/ai-workflows/commands/create-pr.md)
- [skills/create-pr/SKILL.md](/Users/wietekepots/Web/ai-workflows/skills/create-pr/SKILL.md)
- [skills/upstream-rules/SKILL.md](/Users/wietekepots/Web/ai-workflows/skills/upstream-rules/SKILL.md)
