# Feature: Story Format and a Ticket-level Definition of Ready

## Status

draft

## Slice

2/4 — the team's story format in `jira-ticket` and a ready check per ticket

## Priority

medium

## Summary

The team writes stories in one format: a description, acceptance criteria, the visual
design, and dependencies, under an epic. Open questions stay in the ticket as
"(specificeren)" with the ticket flagged and the person who has to answer mentioned.
`jira-ticket` uses its own template today, and the Definition of Ready in
`rules/backlog.md` checks local backlog items, not tracker tickets. This slice aligns
the template with the team's format and adds a ready check for a ticket, run where
tickets are prepared: refinement and sprint planning.

## User Story

As the team in refinement, I want every ticket written in the same format and checked
for readiness before it enters a sprint, so that the assignee can start without going
back to the product owner for the basics.

## Acceptance Criteria

- `jira-ticket` writes a story with the sections description, acceptance criteria,
  visual design (the Figma frame) and dependencies, in the tracker's working language.
- A story is created under an epic; when none fits, the skill asks instead of guessing.
- An open point is written as "(specificeren)" in its section, the ticket is flagged,
  and the person who has to answer is mentioned; the recap lists each one.
- `rules/backlog.md` has a ticket-level Definition of Ready next to the item-level one:
  the four sections filled, no "(specificeren)" left, design linked where the ticket
  has UI, sized, and fitting one capability.
- `refinement` and `sprint-planning` report per ticket which ready line fails; they do
  not edit the ticket.
- No tester is recorded on a ticket; the team tests (`rules/ticket-flow.md`).

## Technical Notes

Bugs and tasks keep their own templates; only stories change. The flag and the mention
are tracker writes and go through the existing confirmation in `jira-ticket`.

Open question for refinement: do support tickets follow this flow and format, or do
they keep a lighter path?

## Out of Scope

- Reading comments back after the test (slice 3).
- Changing the item-level Definition of Ready.

## Related

- Depends on: feat-ticket-flow-1-test-handoff.md
- [../../skills/jira-ticket/SKILL.md](../../skills/jira-ticket/SKILL.md)
- [../../rules/backlog.md](../../rules/backlog.md)
- [../../skills/refinement/SKILL.md](../../skills/refinement/SKILL.md)
- [../../skills/sprint-planning/SKILL.md](../../skills/sprint-planning/SKILL.md)
