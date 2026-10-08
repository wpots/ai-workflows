# Chore: Move The Worktree Rules Out Of The Ambient Layer

## Status

in-progress

Cut 2026-10-08 from `chore-ambient-layer-trim.md` after the maintainer decided
all of its parts go ahead (decision 2 there).

## Slice

2/3 — the worktree section of `## Shell Usage` moves into one skill reference

## Priority

low

## Summary

`CLAUDE.md` loads into every session of every project, and its worktree section
(3,125 bytes on `main` at `98a39c3`) matters only when a worktree is created —
which happens almost always inside a skill. Move the full rules into one
reference the worktree skills load, merged with the overlapping worktree caveat
in `create-pr`'s push reference, and leave a pointer with the non-negotiables so
ad-hoc worktrees still follow them.

## Acceptance Criteria

- [ ] `CLAUDE.md` keeps a `### Worktrees` pointer of at most four lines with the
      non-negotiables: root `~/.worktrees/<repo>-<slug>` and never inside the
      repo, a symlinked `node_modules` by default, removal after the push — and
      the path of the full rules.
- [ ] The full rules live in one place, `skills/create-pr/references/worktrees.md`:
      the former `CLAUDE.md` section merged with the "Worktree caveat" of
      `skills/create-pr/references/push-and-mr-mechanics.md`, nothing lost and
      nothing duplicated. `push-and-mr-mechanics.md` points at it.
- [ ] The skills that create or set up worktrees point at it: `create-pr`,
      `address-review-comments`, `dependency-hotfix` (which named "the worktree
      rules in `CLAUDE.md`"), `wcag-audit`; `start-project` names it instead of
      "`CLAUDE.md` § Worktrees".
- [ ] The allowlist rules and "Git inside the sandbox" stay in `CLAUDE.md`.
- [ ] A changelog fragment `changelog.d/changed.ambient-worktree-reference.md`;
      `CHANGELOG.md` and the plugin version untouched.
- [ ] `node scripts/validate-skills.mjs` and
      `bash scripts/validate-ai-instructions.sh` pass; no adapter drift.

## How to verify

<!-- Filled in at delivery. -->

## Technical Notes

- Skill bodies only: another branch adds `metadata.owner` frontmatter to every
  `SKILL.md` at the same time, so no frontmatter line is touched here.
- `work-backlog` and `close-sprint` do not create worktrees themselves
  (`work-backlog` hands off to `address-review-comments` / `create-pr`;
  `close-sprint` runs in the harness's own EnterWorktree), so they get no
  pointer. `mr-merged` and `release` only remove worktrees and keep their own
  dirty-check steps.

## Out of Scope

- Rewriting the skill-specific worktree guidance in `address-review-comments`
  and `wcag-audit` (ask first, separate IDE window); they gain a pointer only.
- `chore-ambient-layer-trim.md` (slice 1/3) and
  `chore-ambient-layer-trim-3-command-rows.md` (slice 3/3).

## Related

- `chore-ambient-layer-trim.md` (slice 1/3, holds the decisions and the
  skill-doctor evidence) — independent, no ordering
- [../../CLAUDE.md](../../CLAUDE.md)
- [../../skills/create-pr/references/worktrees.md](../../skills/create-pr/references/worktrees.md)
- [../../skills/create-pr/references/push-and-mr-mechanics.md](../../skills/create-pr/references/push-and-mr-mechanics.md)
