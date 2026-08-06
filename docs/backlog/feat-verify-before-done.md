# Feat: Verification Before Done — Evidence, Not Claims

## Status

done

## Priority

medium

## Summary

The number-one frontrunner pattern (Anthropic's verification loops): an agent
claims "done" only with a check it ran and can show. Most of the stack
already got there — `work-backlog` fills `How to verify` from what it
actually ran (1.8.0), `create-pr` runs every hook command verbatim on the
exact commit (1.11.1). Two report seams still allowed bare claims:
`run-checks` ended in a pass/fail table without output or commit anchoring,
and `address-review-comments` never required per-comment proof. Close both.

## User Story

As a reviewer, I want every "done" backed by the command that proves it and
the commit it ran on, so that a green report cannot drift from the code that
actually ships.

## Acceptance Criteria

- [x] `skills/run-checks`: the closing table names the exact commit verified
      (`git rev-parse --short HEAD`) and quotes the tail of each check's
      real output; skipped/scoped checks are explicit.
- [x] `skills/address-review-comments`: the closing report shows, per
      comment, the change (`file:line`) plus the proving command and output
      tail on the pushed commit; wording-only fixes are labeled as such.
- [x] No duplication of what already landed: `work-backlog` (1.8.0) and
      `create-pr` (1.11.1) are referenced, not re-edited.
- [x] Plugin bumped to 1.16.0 with a changelog entry.

## Technical Notes

- Stop-hook enforcement of the improve-skill retrospective is deliberately
  NOT part of this item — it is already filed as
  `docs/backlog/chore-improve-skill-stop-hook.md`.
- The "sweep ran before later edits verified nothing" line encodes the
  freshest-commit rule that already exists in create-pr's reference file —
  same doctrine, now stated where the sweep reports.

## Out of Scope

- Screenshot/visual evidence for UI changes (T18, separate item).
- Session telemetry or automated evidence collection.

## Related

- [../../skills/run-checks/SKILL.md](../../skills/run-checks/SKILL.md)
- [../../skills/address-review-comments/SKILL.md](../../skills/address-review-comments/SKILL.md)
- [chore-improve-skill-stop-hook.md](chore-improve-skill-stop-hook.md)
