# Chore: Sync Stops Delivering Anything For Cursor

## Status

<!-- draft | ready | in-progress | done -->

done

Go given by the maintainer on 2026-10-13, with the safe default for files
projects already hold: leave them. Background: the team uses Claude and Codex
and Cursor is out (recorded maintainer decision, 2026-10-08, in the amendment of
`docs/skills-first-migration-plan.md`).

## Ticket

<!-- no tracker ticket: this repo's own backlog -->

## Slice

1/3 — sync and setup stop emitting Cursor files

## Priority

low

## Summary

`scripts/sync.sh` and `skills/setup-ai-workflows` stop writing Cursor files into
projects and onto developer machines, and every Cursor mention in what project
sync delivers goes in the same MR, so the freshness stamp changes once instead
of once per slice.

## User Story

As the maintainer of the shared workflow assets, I want sync to stop producing
files for a tool nobody on the team runs, so that every later change to sync,
setup and the templates touches one adapter fewer.

## Acceptance Criteria

- `scripts/sync.sh --project` no longer writes `.cursor/rules/conventions.mdc`
  or `.cursor/rules/graphify.mdc`, and `templates/project-cursor-conventions.mdc`
  and `templates/project-cursor-graphify.mdc` are deleted.
- `scripts/sync.sh` without flags no longer copies commands into
  `~/.cursor/commands` or skills into `~/.cursor/skills-cursor/ai-workflows`.
  `SRC_CURSOR_GRAPHIFY`, `TARGET_CURSOR` and `TARGET_CURSOR_SKILLS_SUBPATH` are
  gone, and the usage text names no Cursor target.
- Sync neither writes nor deletes anything under a project's `.cursor/` or a
  machine's `~/.cursor/`. Files from earlier syncs stay where they are.
- `skills/setup-ai-workflows` and `commands/setup-ai-workflows.md` no longer
  create or mention Cursor files: the description, the files-to-touch list, the
  adapter table, the `.cursor/mcp.json` mirror in the MCP step, the recap and the
  secrets guard. `.mcp.json` is the only MCP config the skill emits.
- `scripts/project-sync-freshness.sh` no longer lists the two Cursor templates in
  `ADAPTER_TEMPLATES`.
- Every other Cursor mention in the files the stamp digests goes in this slice:
  `commands/refinement.md`, `commands/sprint-planning.md` and
  `commands/sprint-demo.md` ("(Claude, Codex, Cursor)" becomes "(Claude,
  Codex)"), the `.cursor/rules/**` line in `shared/workflow-assets.md`, line 6 of
  `rules/rules.md`, and `templates/project-ai-workflows.md`, which keeps one line
  saying Cursor is not supported and gets no generated files.
- Every file that names one of the two deleted templates is updated in this
  slice, so nothing points at a missing file: the row in
  `skills/upstream-rules/SKILL.md` (and its `.cursor/rules/` bullet) and the
  template list in the asset table of `docs/pipeline-map.md`.
- `scripts/smoke-test-project-sync.sh` asserts that neither fixture project gets
  a `.cursor/` directory, in place of the two `assert_exists` lines, and fails
  when run against `main` before this change.
- The generated adapters are regenerated with `scripts/generate-adapters.sh`.
- A changelog fragment says that sync and `setup-ai-workflows` stop generating
  Cursor files, that `.cursor/` files a project already has are left alone and
  can be deleted by hand, and that every synced project reads as stale once.

## How to verify

- [x] `bash scripts/smoke-test-project-sync.sh` → "Project sync smoke test
      passed". Both fixture projects get no `.cursor/` directory, and the new
      scenario ".cursor/ files from an earlier sync are left alone" keeps a
      pre-existing `.cursor/rules/conventions.mdc` unchanged and writes no
      `graphify.mdc` next to it.
- [x] The same smoke test against `main`'s `sync.sh` fails:
      `Unexpected path: …/no-conventions/.cursor`, exit 1.
- [x] `rg -n "SRC_CURSOR|TARGET_CURSOR|\.cursor" scripts/sync.sh` prints
      nothing (exit 1): no project or global Cursor target is left.
- [x] `rg -n -i cursor rules commands shared templates scripts/sync.sh scripts/project-sync-freshness.sh`
      (excluding the smoke test) lists only the three "not supported" lines in
      `commands/setup-ai-workflows.md` and `templates/project-ai-workflows.md`.
- [x] `scripts/project-sync-freshness.sh --digest` gives `246557818 303315` on
      `main` and `3095625998 299288` on this branch: one digest change, so each
      synced project gets one re-sync prompt for the whole retirement.
- [x] `bash scripts/validate-ai-instructions.sh` (the pre-commit hook) passes:
      38 skills, 93 docs link-checked, adapters regenerated with no drift.

## Technical Notes

Where the Cursor code sits on 2026-10-13 (line numbers move; search for
`cursor`, case-insensitive):

- `scripts/sync.sh`: 12, 17, 20, 30, 35, 37, the conventions block at 310–317,
  the graphify block at 358–365, the global command copy at 442–443 and the
  global skill copy at 478–479.
- `skills/setup-ai-workflows/SKILL.md`: 3 (description), 66, 229, 275, 325, 344.
- `scripts/smoke-test-project-sync.sh`: 59 and 97.
- `scripts/project-sync-freshness.sh`: 112–113.

**One stale nudge, not three.** The stamp is a digest over `rules/`, `commands/`,
`shared/`, the adapter templates and the two sync scripts
(`source_digest()` in `scripts/project-sync-freshness.sh`). This slice changes
that set anyway, so it also takes every Cursor mention inside it. Slices 2 and 3
touch none of those files, so they cause no second or third re-sync prompt in
every synced project.

**Changelog section.** A `removed` fragment makes the release MAJOR
(`scripts/assign-plugin-version.mjs`, bump inference). Use
`changelog.d/changed.retire-cursor-adapters.md`: no Claude or Codex user loses
anything. Say in the MR that a 3.0.0 is the maintainer's call at release time
(`--bump`).

**Global sync.** The `~/.cursor` copies only ran when `~/.cursor` existed. A
machine that has it keeps the last copy, stale and harmless; slice 3 documents
how to delete it.

**Frontmatter.** The `setup-ai-workflows` description changes. If
`feat-routing-evals-before-mr.md` has landed by then, follow the pre-flight it
adds to `skills/create-pr`.

The pre-commit hook regenerates `.github/prompts/*.prompt.md` from `commands/`
and fails on drift; on that failure, stage the regenerated files and commit
again.

## Out of Scope

- The wording in skills that only mention Cursor in passing (slice 2).
- The docs, `README.md`, `FEATURES.md` and `AGENTS.md` (slice 3).
- Deleting `.cursor/` files from projects or `~/.cursor/` from machines.
- Copilot, Codex and Claude adapters.

## Related

- [chore-retire-cursor-adapters-2-skill-wording.md](chore-retire-cursor-adapters-2-skill-wording.md)
- [chore-retire-cursor-adapters-3-docs.md](chore-retire-cursor-adapters-3-docs.md)
- [../skills-first-migration-plan.md](../skills-first-migration-plan.md) — the
  2026-10-08 amendment that put Cursor out
- [spike-ratify-claude-skill-status-and-cursor-pointer.md](spike-ratify-claude-skill-status-and-cursor-pointer.md)
- [../../scripts/sync.sh](../../scripts/sync.sh)
- [../../scripts/project-sync-freshness.sh](../../scripts/project-sync-freshness.sh)
- [../../skills/setup-ai-workflows/SKILL.md](../../skills/setup-ai-workflows/SKILL.md)
- Also changed: the Cursor row of the tool support matrix in
  `docs/skills-first-migration-plan.md`, which stated as current fact that the
  adapters are still generated.
