# Feature: Acceptance Gate in the Release and Flow Metrics

## Status

done

## Slice

5/5 — the release checks product-owner acceptance; the sprint close counts the flow

## Priority

low

## Summary

A ticket is Done when the product owner approved it in a comment. `release` reads ticket
statuses back but does not check that approval, so a ticket moved to Done by hand or by
automation can ship unaccepted. This slice adds that check to the release, and gives
`close-sprint` an optional view of how the flow ran: how often a ticket bounced between
In Test and In Progress, how long it sat in one status, and how many passed the test the
first time.

## User Story

As the team releasing to production, I want the release to tell me which shipped tickets
lack the product owner's approval, so that nothing goes live without acceptance, and I
want the sprint close to show where tickets got stuck.

## Acceptance Criteria

- `release` lists every ticket in the release without an approving product-owner comment,
  with the ticket link; it reports, it does not block or move anything.
- `close-sprint` can report per ticket: the number of returns from In Test or Acceptatie
  to In Progress, statuses held longer than five working days, and first-time-right
  (no return at all).
- The metrics are opt-in and read from the ticket's changelog; no skill writes them to
  the tracker.

## Technical Notes

The approval check reuses the classification from `ticket-handoff` (slice 4). Status
history comes from the Atlassian connector's `listJiraIssueChangelogs`: the `jira` CLI
returns no changelog (`issue view --raw` carries only `expand`, `fields`, `id`, `key`
and `self`, and no flag expands it).

## Out of Scope

- Blocking the release on a missing approval.
- Dashboards outside the sprint close.

## How to verify

- The premise check that moved the status history to the connector: `jira issue
  view DEV-690 --raw | jq 'keys'` → `expand`, `fields`, `id`, `key`, `self`, and
  `jira issue view --help` names no flag that expands the changelog.
- The Phase 3b definitions against a real ticket: `listJiraIssueChangelogs` via
  `executeRead` on RFW-297 (the CLI-first hook let the call through), status
  items only, paged to `isLast`. Counted by hand with the runbook's rules: 2
  returns to In Progress, In Progress 19 working days (2026-08-13 → 09-09) and In
  Acceptance 14 working days (09-17 → 10-07) over five, not first time right.
- The acceptance list against the same ticket: `jira issue view RFW-297 --raw`
  with jq over `.fields.comment.comments` shows three comments and none for the
  product owner, so the release lists it as "no comment for the product owner".
- The validation suite (`scripts/validate-ai-instructions.sh`, run from the
  commit hook) → `OK: 40 skills validated, 107 docs link-checked, no errors`
  (one existing warning: `skills/create-pr/SKILL.md` at 506 lines); hook,
  release, parity and compact tests pass; no adapter drift.
- Targeted eval `release-8` (the Step 3 plan block): `claude plugin eval .
  --case release-8 --runs 1 --ablation none --no-publish --trust-plugin
  --judge-model sonnet --max-cost-usd 0.50` → score 1.00, `skill-fired` ✓
  ($0.26, 2026-10-30).
- Not run: `release-7` (Step 7 comment reading), the same command with `--case
  release-7`. The eval harness writes to `/tmp`, which the sandbox refuses, and
  the run outside the sandbox waits on the maintainer's go.
- No eval case exercises the `close-sprint` inputs or the changelog template,
  so the flow metrics have no eval coverage.
- No live release or sprint close ran: both are checked against the runbooks'
  text and the RFW-297 data above. A first release with a shipped ticket that
  lacks the approval is the end-to-end check.

## Related

- Depends on: feat-ticket-flow-4-ticket-handoff-skill.md
- [../../skills/release/SKILL.md](../../skills/release/SKILL.md)
- [../../skills/close-sprint/SKILL.md](../../skills/close-sprint/SKILL.md)
- [../../rules/ticket-flow.md](../../rules/ticket-flow.md)
