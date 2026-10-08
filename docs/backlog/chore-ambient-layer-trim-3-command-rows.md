# Chore: Drop The Command Rows A Skill Row Already Covers

## Status

done

Cut 2026-10-08 from `chore-ambient-layer-trim.md`, where this was the slice that
needed no decision; the maintainer approved all parts the same day.

## Slice

3/3 — the 15 duplicate command rows leave `CLAUDE.md`

## Priority

low

## Summary

`CLAUDE.md` routes every command twice: once in the command-only block, once as
the fallback in the skill row. On Claude the skill row is the route, so 15 of
the 17 command rows are dead weight in every session. Keep the two commands
that have no skill, and make sure no trigger phrase is lost on the way.

## Acceptance Criteria

- [x] `CLAUDE.md` no longer carries the 15 command rows covered by a skill row:
      the `command-mappings` markers are gone from `CLAUDE.md`, and the two
      uncovered rows (`safe-kill-port`, `new-device-setup`) stay in the file,
      verbatim.
- [x] No trigger phrase is lost: a trigger that existed only in a command row
      moves into its skill row first (`performance review` →
      `skills/sustainable-review`, in `shared/skill-mappings.md`).
- [x] `AGENTS.md` and the Copilot adapter keep their full command block.
      `AGENTS.md` does change by one generated line: its skill block is injected
      from the same `shared/skill-mappings.md`, so the `sustainable-review` row
      there gains `performance review` too. The Copilot adapter is byte-identical.
- [x] `scripts/validate-skills.mjs` holds it: every trigger of a covered command
      row is in its skill row; every uncovered command row is in `CLAUDE.md`
      verbatim; `CLAUDE.md` routes no covered command in a command row.
- [x] `skills/improve-skill` and `docs/contributing.md` say where trigger
      phrases go now (the shared fragments, plus the `CLAUDE.md` copy for a
      command without a skill), instead of "the `## Command Mapping` section of
      `CLAUDE.md`". `docs/pipeline-map.md` says the same in one sentence.
- [x] A changelog fragment `changelog.d/changed.ambient-command-rows.md`;
      `CHANGELOG.md` and the plugin version untouched.
- [x] `node scripts/validate-skills.mjs` passes and `./scripts/generate-adapters.sh`
      shows no drift (`bash scripts/validate-ai-instructions.sh`).

## How to verify

- [x] `wc -c CLAUDE.md` — 26,992 bytes on `main` (`98a39c3`, unchanged at
      `49abcef`), 25,376 on this branch: −1,616 bytes, about 400 tokens per turn
      in every session.
- [x] No trigger lost: a script over the mapping rows of both files finds 195
      distinct trigger phrases in `main`'s `CLAUDE.md` and the same 195 on this
      branch, 0 missing.
- [x] `node scripts/validate-skills.mjs` — 38 skills validated, 90 docs
      link-checked, no errors. It fails without each half of the change:
      with `main`'s `shared/skill-mappings.md` it exits 1 on
      ``the skill row for `commands/sustainable-review.md` lacks `performance
      review` ``; with `main`'s `CLAUDE.md` it exits 1 with exactly 15
      errors, one per covered command row.
- [x] `git diff gitlab/main -- .github/copilot-instructions.md` is empty;
      `git diff gitlab/main -- AGENTS.md` is the one `sustainable-review` line.
- [x] `bash scripts/validate-ai-instructions.sh` (the pre-commit hook on the
      delivery commit) — all suites pass, no adapter drift.

## Technical Notes

- `.vscode/tasks.json` and the Copilot prompt files are generated from
  `shared/command-mappings.md`, which does not change; neither moves.
- The project templates keep their `command-mappings` markers: in a synced
  project the command block is the routing for tools without skills.

## Out of Scope

- `AGENTS.md` and the Copilot adapter routing (both keep the command block).
- `chore-ambient-layer-trim.md` (slice 1/3) and
  `chore-ambient-layer-trim-2-worktree-reference.md` (slice 2/3).

## Related

- MR: https://gitlab.com/greenberrynl/config/ai-workflows/-/merge_requests/168
- `chore-ambient-layer-trim.md` (slice 1/3, holds the measurements and the
  skill-doctor evidence) — independent, no ordering
- [../../CLAUDE.md](../../CLAUDE.md)
- [../../shared/command-mappings.md](../../shared/command-mappings.md)
- [../../shared/skill-mappings.md](../../shared/skill-mappings.md)
- [../../scripts/validate-skills.mjs](../../scripts/validate-skills.mjs)
