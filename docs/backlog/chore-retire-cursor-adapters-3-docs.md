# Chore: Docs Stop Describing Cursor Delivery

## Status

<!-- draft | ready | in-progress | done -->

in-progress

Go given by the maintainer on 2026-10-13. Slice 1 merged (!188), because these
docs describe what sync generates.

## Ticket

<!-- no tracker ticket: this repo's own backlog -->

## Slice

3/3 — docs

## Priority

low

## Summary

After slice 1, sync generates nothing for Cursor, but the guides still list
`.cursor/` files among the generated adapters and tell Cursor users how to stay
current. They are brought in line, and each tool table keeps at most one line
saying Cursor is not supported.

## User Story

As a developer adopting the workflows, I want the guides to describe what sync
actually writes, so that I do not look for Cursor files that no longer appear.

## Acceptance Criteria

- These files no longer present Cursor as a delivery target or list `.cursor/`
  files among the generated output: `README.md`, `FEATURES.md`, `AGENTS.md`,
  `docs/how-it-works.md`, `docs/keep-current.md`, `docs/setup-machine.md`,
  `docs/tooling.md`, `docs/adopt-new-project.md` and
  `docs/adopt-existing-project.md`.
- A tool or support table keeps at most one Cursor line, saying Cursor is not
  supported and sync generates nothing for it.
- `docs/adopt-existing-project.md` still says that `.cursor/rules/*` files a
  project wrote itself are left alone, and its adapter table no longer says
  `.cursor/rules/conventions.mdc` is created or updated.
- `docs/setup-machine.md` says how to remove the stale `~/.cursor/commands` and
  `~/.cursor/skills-cursor/ai-workflows` copies an earlier sync left behind, and
  that removing them is optional.
- History stays as it is: `CHANGELOG.md`, `changelog.d/`,
  `docs/skills-first-migration-plan.md` and `docs/backlog/`.
- `rg -n -i cursor README.md FEATURES.md AGENTS.md docs --glob '!docs/backlog/**' --glob '!docs/skills-first-migration-plan.md'`
  lists only the "not supported" lines and the project-owned-files line in
  `docs/adopt-existing-project.md`.

## How to verify

<!-- Filled in by whoever delivers the item. -->

## Technical Notes

Mentions on 2026-10-13: `README.md` 26, 42, 52–53; `FEATURES.md` 13, 159;
`AGENTS.md` 16, 23, 177; `docs/how-it-works.md` 17, 52, 92, 171, 175;
`docs/keep-current.md` 11, 14, 53, 73; `docs/setup-machine.md` 16, 43–44, 201;
`docs/tooling.md` 56, 90, 94; `docs/adopt-new-project.md` 42, 77, 89, 95;
`docs/adopt-existing-project.md` 4, 22, 92.

`docs/setup-machine.md` line 16 is also changed by
`spike-codex-plugin-channel.md` (the "no plugin path" sentence). Rebase onto
whichever lands first.

None of these files is in the freshness stamp or shipped as plugin behaviour, so
no changelog fragment and no re-sync prompt.

## Out of Scope

- Anything slice 1 or slice 2 covers.
- Rewriting the history in `CHANGELOG.md` or the migration plan.

## Related

Depends on: chore-retire-cursor-adapters-1-stop-emitting.md

- [chore-retire-cursor-adapters-1-stop-emitting.md](chore-retire-cursor-adapters-1-stop-emitting.md)
- [chore-retire-cursor-adapters-2-skill-wording.md](chore-retire-cursor-adapters-2-skill-wording.md)
