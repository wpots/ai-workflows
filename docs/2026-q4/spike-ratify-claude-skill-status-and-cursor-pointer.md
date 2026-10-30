# Spike: Close Out The Skills-First Decisions (Claude First-Class, Cursor Out)

## Status

done

Rewritten 2026-10-08 from the October 2026 stack review (task T3), after a
premise check against `main`. Both decisions this item waited on are made, so
nothing is left to decide and the work is docs. The title changed; the filename
did not, because the superseded spikes link to it.

- **Claude skill status** was decided on 2026-07-27: the decision record in
  `docs/skills-first-migration-plan.md` says "Claude skill status: first-class",
  the strategy paragraph in `CLAUDE.md` says skills are first-class with commands
  as the fallback, and every support-matrix copy already reads "skills first".
  The contradiction this item was filed against is gone; only the plan's phase
  text still lists the decision as open.
- **Cursor** is out: recorded maintainer decision of 2026-10-08, the team uses
  Claude and Codex. The "add a pointer line to the Cursor `.mdc`" question is
  moot, so no pointer is added.

Retiring the Cursor adapters from sync and the projects is a different, larger
change (about 35 files) that removes something synced projects have today; it is
filed separately as `chore-retire-cursor-adapters.md` and needs a go.

## Ticket

AIW-109 / AIW-110 (merged)

## Priority

low

## Summary

Make the docs say what has been decided: the migration plan becomes a decision
record, and the support matrix stops listing Cursor as a tool the team supports.
No behaviour changes.

## User Story

As someone reading the support matrix, I want it to match what the team uses, so
that I do not spend effort keeping a tool working that nobody runs.

## Acceptance Criteria

- [x] `docs/skills-first-migration-plan.md` is reduced to a decision record: the
      2026-07-27 record stays and gains a 2026-10-08 line (the team uses Claude
      and Codex; Cursor is out, so the supported-tools line no longer lists it);
      the phases are marked done or superseded and the open "decide the support
      matrix" text is removed.
- [x] The Cursor row in each support-matrix copy — `AGENTS.md` (line 23),
      `FEATURES.md` (line 159), `templates/project-ai-workflows.md` (lines 20 and
      50; it was 52 when this was filed) — says Cursor is not used by the
      Greenberry team and its adapters are still generated but get no further
      work. The Claude and Codex rows do not change. `README.md` lines 3 and 52
      stop naming Cursor as a supported tool.
- [x] `templates/project-cursor-conventions.mdc` is not changed: no pointer line,
      and no fix for its rule list omitting `rules/sonarqube.md`.
- [x] `./scripts/generate-adapters.sh` is run and
      `./scripts/validate-ai-instructions.sh` passes, with no adapter drift.

Added at delivery: a changelog fragment, `changelog.d/changed.cursor-not-supported.md`.
`templates/project-ai-workflows.md` is part of the project-sync freshness digest, so
editing it makes every synced project read as stale once; the fragment says so.

## How to verify

- [x] `rg -n "Cursor" AGENTS.md FEATURES.md templates/project-ai-workflows.md`
      shows the matrix rows saying "not used by the Greenberry team" (the other
      Cursor lines there describe files that are still generated and are unchanged).
- [x] `git diff --stat main` lists no change to `templates/project-cursor-conventions.mdc`.
- [x] The plan's Phase 3 row is backed by `CLAUDE.md`: 15 skill rows name a
      `(canonical)` skill and a `(fallback)` command.
- [x] `bash scripts/validate-ai-instructions.sh` (and the pre-commit hook on the
      delivery commit): 38 skills validated, all suites pass, no adapter drift.

## Technical Notes

`AGENTS.md` is an adapter whose matrix is hand-written, not injected from
`shared/`, so edit it directly and let `generate-adapters.sh` confirm there is no
drift in the injected fragments. The matrix therefore lives in four hand-kept
places; a single validated source would stop the drift this item keeps patching,
but it is out of scope here.

The two superseded spikes link to this file; do not rename it.

## Out of Scope

- Removing Cursor adapters from `scripts/sync.sh`, `skills/setup-ai-workflows`,
  the templates or the docs — see `chore-retire-cursor-adapters.md`.
- Any change to how Claude or Codex load skills.
- Rewriting commands into skills, or removing Copilot support.

## Related

- MR: https://gitlab.com/greenberrynl/config/ai-workflows/-/merge_requests/179
- [chore-retire-cursor-adapters-1-stop-emitting.md](chore-retire-cursor-adapters-1-stop-emitting.md)
  (the item was split into three slices on 2026-10-13)
- [spike-decide-skills-first-strategy-and-tool-support-matrix.md](spike-decide-skills-first-strategy-and-tool-support-matrix.md)
- [spike-decide-cursor-parity-for-ai-workflows-guide.md](spike-decide-cursor-parity-for-ai-workflows-guide.md)
- [../skills-first-migration-plan.md](../skills-first-migration-plan.md)
- [../workflow-canonical-sources.md](../workflow-canonical-sources.md)
