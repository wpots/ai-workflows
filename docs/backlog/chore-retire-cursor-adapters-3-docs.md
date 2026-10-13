# Chore: Docs Stop Describing Cursor Delivery

## Status

<!-- draft | ready | in-progress | done -->

done

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
  lists only the "not supported" lines, the project-owned-files line in
  `docs/adopt-existing-project.md` and the optional-cleanup note in
  `docs/setup-machine.md`.

## How to verify

- [x] `git grep -n -i cursor -- README.md FEATURES.md AGENTS.md docs ':!docs/backlog' ':!docs/skills-first-migration-plan.md'`
      (the criterion's scope) lists 8 lines: the "not supported" line in
      `README.md`, `AGENTS.md`, `FEATURES.md` and `docs/how-it-works.md`, the
      `.cursor/rules/*` line in `docs/adopt-existing-project.md`, and the
      cleanup note in `docs/setup-machine.md` (3 lines). Nothing else.
- [x] Each tool or support table has at most one Cursor line: `AGENTS.md`,
      `FEATURES.md` and the support matrix in `docs/how-it-works.md` keep one;
      the "loads instructions" table in `docs/how-it-works.md` has none.
- [x] `docs/adopt-existing-project.md`'s adapter table no longer says
      `.cursor/rules/conventions.mdc` is created or updated.
- [x] `docs/setup-machine.md` names `~/.cursor/commands` and
      `~/.cursor/skills-cursor/ai-workflows`, says removing them is optional,
      and keeps a user's own commands safe.
- [x] No digested source differs from `main`: `git diff --stat gitlab/main --
      rules commands shared templates scripts/sync.sh
      scripts/project-sync-freshness.sh` prints nothing, and
      `scripts/project-sync-freshness.sh --digest` gives `3095625998 299288` as
      before. No re-sync prompt.
- [x] `CHANGELOG.md`, `changelog.d/`, `docs/skills-first-migration-plan.md` and
      `docs/backlog/` (apart from this item) are untouched.
- [x] `bash scripts/validate-ai-instructions.sh` (the pre-commit hook) passes.

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

Corrected on delivery: the last criterion allowed only the "not supported" lines
and the project-owned-files line, but the `docs/setup-machine.md` criterion
needs the two `~/.cursor` paths and the optional-cleanup note, which that `rg`
also lists. The criterion now names that note too.

Two details beyond the criteria. The `~/.cursor/commands` note is not a blanket
`rm`: the old global sync mirrored `commands/` into it with `rsync --delete`, so
it held only this repo's runbooks, but a user may have added commands of their
own after the last sync; the note tells them to remove only the files named like
`commands/*.md` in that case. And the "No synced `~/.cursor/mcp/ai-workflows`
folder" bullet in `docs/tooling.md` stays as a decision, reworded to "No synced
global MCP folder", instead of being deleted.

## Out of Scope

- Anything slice 1 or slice 2 covers.
- Rewriting the history in `CHANGELOG.md` or the migration plan.

## Related

Depends on: chore-retire-cursor-adapters-1-stop-emitting.md

- [chore-retire-cursor-adapters-1-stop-emitting.md](chore-retire-cursor-adapters-1-stop-emitting.md)
- [chore-retire-cursor-adapters-2-skill-wording.md](chore-retire-cursor-adapters-2-skill-wording.md)
