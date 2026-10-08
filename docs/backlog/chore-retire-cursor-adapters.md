# Chore: Retire The Cursor Adapters

## Status

draft

Filed 2026-10-08 from the October 2026 stack review. Not `ready`: it removes
something synced projects have today, so it waits for an explicit go from the
maintainer. Background: the team uses Claude and Codex and Cursor is out
(recorded maintainer decision, 2026-10-08); `spike-ratify-claude-skill-status-and-cursor-pointer.md`
only makes the docs say so.

## Priority

low

## Summary

Stop generating and syncing the Cursor-only files — `.cursor/rules/conventions.mdc`,
`.cursor/rules/graphify.mdc`, `.cursor/mcp.json` — and remove Cursor from the
workflow text, so nothing is kept working for a tool nobody on the team runs.

## User Story

As the maintainer of the shared workflow assets, I want to stop paying for a tool
the team does not use, so that every change to sync, setup and the docs touches
one adapter fewer.

## Acceptance Criteria

Sliced because it exceeds the file budget in `rules/mr-sizing.md`:

- [ ] **Slice 1 — stop emitting.** `scripts/sync.sh` (22 Cursor references),
      `skills/setup-ai-workflows` step 8 (the `.cursor/mcp.json` mirror),
      `commands/setup-ai-workflows.md`, the two `templates/project-cursor-*.mdc`
      files, `scripts/project-sync-freshness.sh` (its `ADAPTER_TEMPLATES` list names
      both templates) and the smoke tests no longer produce or expect Cursor files.
- [ ] **Slice 2 — wording.** The one-line Cursor mentions in about nine skills
      and three commands, `shared/workflow-assets.md` and `rules/rules.md` go;
      regenerate the adapters.
- [ ] **Slice 3 — docs.** `docs/how-it-works.md`, `docs/keep-current.md`,
      `docs/adopt-*.md`, `docs/setup-machine.md`, `docs/tooling.md`, `README.md`,
      `FEATURES.md`, `AGENTS.md` and `templates/project-ai-workflows.md` drop
      Cursor; `docs/pipeline-map.md` is updated.

## Technical Notes

Decide before slice 1 what happens to `.cursor/` files that synced projects
already hold. Leaving them is the safe default; deleting them on the next sync
is a behaviour change for projects the sync does not otherwise touch.

The freshness stamp is a digest of the source set a sync delivered. Removing
templates changes the digest, so every synced project reads as stale once and the
`SessionStart` hook prompts a re-sync in each; say so in the plugin changelog
fragment.

## Out of Scope

- Copilot, Codex and Claude adapters.
- Deleting Cursor files from projects that already have them, unless the decision
  above says so.

## Related

- [spike-ratify-claude-skill-status-and-cursor-pointer.md](spike-ratify-claude-skill-status-and-cursor-pointer.md)
- [../../scripts/sync.sh](../../scripts/sync.sh)
- [../../skills/setup-ai-workflows/SKILL.md](../../skills/setup-ai-workflows/SKILL.md)
- [../skills-first-migration-plan.md](../skills-first-migration-plan.md)
