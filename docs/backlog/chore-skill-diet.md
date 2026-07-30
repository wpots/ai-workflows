# Chore: Skill Diet — Size Budget and Progressive Disclosure

## Status

done

## Priority

medium

## Summary

SKILL.md files load whole into every invocation, and the heavy tail keeps
growing: `maintenance` 23.2 KB, `start-project` 20.6 KB, `create-pr` 16.9 KB,
`setup-ai-workflows` 12.8 KB (measured 2026-07-30). Nothing measured or
bounded skill size. Add a 500-line progressive-disclosure budget to the
validator, establish the reference-file pattern with one exemplar split
(create-pr), and file the remaining heavy skills as follow-ups.

## User Story

As a maintainer, I want skill size measured and bounded, so that skills stay
cheap to load and reference material is read only when its condition applies.

## Acceptance Criteria

- [x] `scripts/validate-skills.mjs` warns when a SKILL.md body exceeds 500
      lines, naming the progressive-disclosure fix.
- [x] Exemplar split: `skills/create-pr` moves the worktree-hook caveat and
      the long-description/cwd mechanics to
      `references/push-and-mr-mechanics.md` behind conditional pointers; the
      reviewer hard rule and the approval step stay inline (governance is
      never disclosure-gated).
- [x] `docs/contributing.md` documents the budget and the pattern in "Add Or
      Update A Skill".
- [x] Plugin bumped to 1.10.1 (PATCH — reorganization, no behavior change).
- [x] Remaining offenders are named below as follow-ups rather than split
      blind in one MR.

## Technical Notes

Current measurements (bytes, 2026-07-30):

| Skill | Size | Follow-up |
| ----- | ---- | --------- |
| `maintenance` | 23.2 KB | split lane details (deps/EOL/credentials/data) into references |
| `start-project` | 20.6 KB | split per-lane deep dives; lanes were restructured 2026-07-30, let it settle first |
| `create-pr` | 16.9 KB → ~13.4 KB | done in this MR |
| `setup-ai-workflows` | 12.8 KB | split the CONVENTIONS template + detection tables |

Each follow-up is its own small MR (per `rules/mr-sizing.md`), ideally by
whoever touches the skill next — the validator warning marks them.

Splitting rule learned here: extract only *conditional* reference material
(applies when X); anything governing behavior on every run (reviewer rule,
approval gates, severity ordering) stays inline.

## Out of Scope

- Splitting maintenance/start-project/setup-ai-workflows in this MR (active
  development; conflict risk).
- Token-level profiling automation (revisit if the byte budget proves too
  crude).

## Related

- [../../skills/create-pr/SKILL.md](../../skills/create-pr/SKILL.md)
- [../../skills/create-pr/references/push-and-mr-mechanics.md](../../skills/create-pr/references/push-and-mr-mechanics.md)
- [../../scripts/validate-skills.mjs](../../scripts/validate-skills.mjs)
