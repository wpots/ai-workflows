# Feature: Acceptance Gate in the Release and Flow Metrics

## Status

in-progress

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
history comes from `jira issue view --raw` changelog entries.

## Out of Scope

- Blocking the release on a missing approval.
- Dashboards outside the sprint close.

## Related

- Depends on: feat-ticket-flow-4-ticket-handoff-skill.md
- [../../skills/release/SKILL.md](../../skills/release/SKILL.md)
- [../../skills/close-sprint/SKILL.md](../../skills/close-sprint/SKILL.md)
- [../../rules/ticket-flow.md](../../rules/ticket-flow.md)
