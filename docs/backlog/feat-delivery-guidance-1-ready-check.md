# Feature: Ready Check for Backlog Items

## Status

ready

Drafted and flipped to ready 2026-10-13 with the maintainer. Decisions taken the
same day: the ready check is a mode of `skills/backlog` (no new skill), the
developer confirms every flip to `ready`, and open product questions go to the
developer first, one by one, because the right route differs per question.

## Slice

1/4 — the Definition of Ready and the check itself

## Priority

high

## Summary

Nothing decides today whether a backlog item may enter the loop: `skills/work-backlog`
only picks `ready` items, but no surface checks an item against a Definition of
Ready, and nothing tells the developer what to do when the answer is no. This slice
gives `rules/backlog.md` one Definition of Ready and gives `skills/backlog` a mode
that checks items against it, routes every failing point to a next step, and leaves
the flip to `ready` to the developer. That confirmation is the human gate after which
work-backlog may run unattended.

## User Story

As a developer preparing work for the loop, I want each backlog item checked against
one Definition of Ready, with a concrete next step for everything that is missing, so
that I only release items that an agent can build without coming back with questions,
and so that I know what to do with the ones that are not there yet.

## Acceptance Criteria

- `rules/backlog.md` defines the Definition of Ready as one checklist, and the ready
  check uses that list and nothing else.
- Asked whether an item, a sprint's items, or all draft items are ready, the backlog
  skill reports per item: ready, or not ready with every failing point and the next
  step for it.
- The skill never marks an item `ready` on its own: it proposes, and writes `ready`
  only after the developer has confirmed that item.
- Every open product question is put to the developer one at a time, with four
  options: answer it now, ask the PO, keep it for the next refinement, or record it
  as an assumption that does not block. The chosen route is written into the item.
- Every other failing point gets its route: too big → slices; approach unclear → the
  developer decides and records it in Technical Notes; knowledge missing → a spike
  item; design missing or incomplete → back to design; external dependency missing →
  request it; bug without a reproduction → reproduce it first.
- A not-ready item carries a `Blocked on:` and a `Next step:` line under its status
  value, and the first line of `## Status` stays one of `draft`, `ready`,
  `in-progress`, `done`.
- `commands/backlog.md` follows as the fallback wrapper, not a second implementation.

## Technical Notes

**The checklist.** Put it in `rules/backlog.md` under a new `## Definition of Ready`
heading — one home, so refinement, sprint-planning and work-backlog can point at it
instead of restating it. Starting point, INVEST-shaped:

| Point | Ready when |
| --- | --- |
| Criteria | every acceptance criterion is testable; no open product question blocks one |
| Size | no split trigger in `rules/mr-sizing.md` fires |
| Approach | Technical Notes name the approach, the files or modules, and the test level per criterion; where two approaches were viable, the choice and why |
| Dependencies | `Depends on:` items are known; external needs (credentials, API access, client content, design) are available |
| Bug | `## Reproduction` holds a path, or what was tried |

**Product questions.** The developer often knows the answer, and the right channel
differs per question, so the skill asks instead of routing. Per route, what lands in
the item:

| Route | Written into the item |
| --- | --- |
| Answered now | the answer, folded into the criterion or Technical Notes |
| Ask the PO | `Blocked on: PO — <question>`; the skill offers to draft the message, and posts to the tracker only after confirmation through the `skills/service-cli` write recipes |
| Next refinement | `Open question (refinement): <question>` — slice 2 makes refinement prep pick these up |
| Assumption | `Assumption: <statement>` in Technical Notes; does not block |

**Approach unclear.** This is the only route where something plan-like gets written:
the developer's choice between viable approaches goes into Technical Notes, a durable
one into `docs/architecture.md`. There is no separate plan step for items whose
approach is already clear.

**Where the mode lives.** `skills/backlog/SKILL.md` is ~120 lines; put the check and
the routing tables in `skills/backlog/references/ready-check.md` and keep a short
"Ready check" section with the trigger in the skill. The `description` changes
(triggers like "is this item ready", "check readiness", "check de sprint"), so run the
routing evals first: `evals/README.md`, "Before a skill MR" — `evals/backlog/` has
cases.

**Status format.** First line machine-readable, notes below:

```markdown
## Status

draft

Blocked on: PO — may an expired vacancy still be shared?
Next step: developer asks the PO in the OBA-150 ticket
```

**Delivery checklist.** Changelog fragment `changelog.d/added.ready-check.md`;
regenerate `.github/prompts/backlog.prompt.md` (the pre-commit hook does it);
`docs/pipeline-map.md`: the "Definition of ready" gate row and its "Gate — Definition
of ready" paragraph move from "encoded, never blocking" to the developer-confirmed
check.

## Out of Scope

- Running the check from sprint-planning, work-backlog and refinement (slice 2).
- Next-step lines in other skills' recaps (slice 3) and the path page (slice 4).
- A separate planning skill or plan step — the October review's T10 downgrade stands.
- Living specs and a requirements snapshot (parked: gap 2 in `docs/pipeline-map.md`).
- Changing close-sprint's `Delivered in Sprint <N>.` archive status.

## Related

- [../../rules/backlog.md](../../rules/backlog.md)
- [../../rules/mr-sizing.md](../../rules/mr-sizing.md)
- [../../skills/backlog/SKILL.md](../../skills/backlog/SKILL.md)
- [../../commands/backlog.md](../../commands/backlog.md)
- [../../skills/work-backlog/SKILL.md](../../skills/work-backlog/SKILL.md)
- [../pipeline-map.md](../pipeline-map.md)
