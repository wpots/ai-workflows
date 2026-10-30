# Feature: Test Handoff for the Team After a Merge

## Status

done

Delivered in the MR that introduces `rules/ticket-flow.md`.

## Slice

1/4 — the ticket-flow rule and the post-merge test handoff

## Priority

high

## Summary

The sprint flow runs on comments between people: the assignee hands the ticket to the
team for testing, the tester comments back, the assignee hands it to the product owner,
the product owner accepts or rejects. Until now `mr-merged` wrote its "How to test this"
comment for the product owner and proposed nothing about the move. This slice writes
the flow down as one rule and makes the post-merge comment the handoff to the team:
pointed at development, with a test checklist, and posted only once the deploy is there.
Moving the ticket stays handwork; the recap names the move with the ticket link.

## User Story

As the assignee of a ticket, I want the closeout of my last MR to hand the team a test
comment with a checklist and tell me which move I still have to make, so that testing
starts on the right build and the board follows without a skill touching it.

## Acceptance Criteria

- `rules/ticket-flow.md` holds the roles (one assignee, the team tests, the product
  owner accepts by comment), the status handoffs with the comment each one carries,
  "moving is handwork", and a three-layer Definition of Done with the test checklist.
- `mr-merged` reads the deploy to development back before it drafts the comment, and
  keeps the comment drafted while the deploy is ⏳ or ⚠️.
- The comment is for the team that tests on development, gives the development URL,
  and carries the test checklist filled in for the ticket; lines that cannot apply are
  left out with the reason.
- After posting, the recap reads the status back and names the move the assignee still
  has to make, with key, current and target status, and the ticket link. The skill
  neither moves the ticket nor offers to.
- `skills/service-cli` § Ticket status says the same for every skill.
- Eval case `mr-merged-4` fails on the base and passes on the branch.

## Technical Notes

Status names differ per project; the rule matches them by place in the flow. The
explicit-ask exception for a move and the transition hook stay as they are.

## Out of Scope

- The story format and a ticket-level Definition of Ready (slice 2).
- Reading the tester's or product owner's comment back (slice 3).
- The release gate and flow metrics (slice 4).

## Related

- [../../rules/ticket-flow.md](../../rules/ticket-flow.md)
- [../../skills/mr-merged/SKILL.md](../../skills/mr-merged/SKILL.md)
- [../../skills/service-cli/SKILL.md](../../skills/service-cli/SKILL.md)
