# Chore: Trim The Always-On Ambient Layer

## Status

draft

Filed 2026-10-08 from the October 2026 stack review (findings F4 and F10). Not
`ready`, on purpose: measured on `main`, the part that needs no decision is
small, and the large part needs one. Recommendation: do not pick up the small
slice on its own.

## Priority

low

## Summary

`CLAUDE.md` is loaded into every session in every project and is 25,195 bytes
(about 6,300 tokens); the skill listing adds 17,879 characters. Cut what is
duplicated or only needed in some repos.

## Measured (2026-10-08, `main` at `cf294ce`)

| Part of `CLAUDE.md` | Bytes | Note |
| --- | --- | --- |
| `## Command Mapping` incl. `### Skill Mapping` | 10,689 | 42% of the file |
| `## Shell Usage` | 6,648 | worktree and allowlist rules |
| `## Shared Workflow Assets Land via MR` | 4,019 | only relevant in canonical config repos and upstream skills |
| everything else | 3,831 | |

- Of the 17 rows in the command-only block (2,007 bytes), 15 are already covered
  by a skill row that names `commands/<x>.md` as the fallback: 1,620 bytes, 6% of
  the file. `safe-kill-port` and `new-device-setup` have no skill row and must keep
  theirs. The trigger sets are not identical (`performance review` is only in the
  command row for `sustainable-review`), so a deletion must move such triggers into
  the skill row first. `AGENTS.md` and the Copilot adapter need the block: they
  are the routing for tools without skills.
- Skill descriptions are not the problem: none exceeds Claude's 1,536-character
  listing cap, and the longest (`release`, 987) is under Codex's 1,024 limit that
  `scripts/validate-skills.mjs` enforces. No skill uses `paths:`.

## Acceptance Criteria

The slice that needs no decision:

- [ ] `CLAUDE.md` no longer carries the 15 command rows covered by a skill row
      (remove the `command-mappings` markers from `CLAUDE.md` and keep the two
      uncovered rows in the file); no trigger phrase is lost; `AGENTS.md` and the
      Copilot adapter are unchanged; `./scripts/generate-adapters.sh` shows no drift.

## Decisions that would make this worth doing

1. `## Shared Workflow Assets Land via MR` (4,019 bytes) applies in `ai-workflows`
   and `unicore-template` and when an upstream skill runs. Moving it to this
   repo's own `CLAUDE.md` and the two upstream skills saves 4 KB in every other
   project's sessions, but it moves a hard safety rule, so it is the maintainer's
   call.
2. `## Shell Usage` (6,648 bytes) could shrink by moving the worktree section into
   the skill that uses it. Same question: it is the maintainer's own rule text.

## Out of Scope

- Trimming skill descriptions or adding `paths:` — no evidence that either helps.
- Changing `AGENTS.md` or the Copilot adapter.

## Related

- [../../CLAUDE.md](../../CLAUDE.md)
- [../../shared/command-mappings.md](../../shared/command-mappings.md)
- [../../shared/skill-mappings.md](../../shared/skill-mappings.md)
- [../../scripts/generate-adapters.sh](../../scripts/generate-adapters.sh)
- [../../scripts/validate-skills.mjs](../../scripts/validate-skills.mjs)
