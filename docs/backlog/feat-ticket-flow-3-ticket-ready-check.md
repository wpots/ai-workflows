# Feature: Ticket-level Definition of Ready in Refinement and Sprint Planning

## Status

ready

## Slice

3/5 — refinement and sprint planning report per story which ready line fails

## Priority

medium

## Summary

The Definition of Ready in `rules/backlog.md` checks local backlog items, not tracker
tickets, so a story can enter a sprint without a design link, without an epic or with
"(specificeren)" still behind its title. This slice adds a Definition of Ready for
stories next to the Definition of Done in `rules/ticket-flow.md`, and has refinement and
sprint planning report per story which line fails.

## User Story

As the team preparing a sprint, I want every story checked against the same ready list
before it is planned, so that the assignee can start without going back to the product
owner for the basics.

## Acceptance Criteria

- `rules/ticket-flow.md` has a Definition of Ready for stories next to the Definition of
  Done: the four sections filled (dependencies may say there are none), no
  "(specificeren)" behind the title, not flagged, the design linked when the story has
  UI, under an epic, sized in story points, and one capability.
- The item-level Definition of Ready in `rules/backlog.md` stays as it is and links to
  the ticket-level one.
- Refinement prep reports per story which ready line fails, in the refinement document,
  leaving out the story-points line, since sizing is what the session does; a story
  that passes every other line says so in one word.
- Sprint planning reports the stories that fail a ready line under its flags awaiting a
  user decision, with the line that fails.
- Bugs, tasks and support tickets are not held against this list.
- Both skills leave the tracker untouched: no edit, flag, comment or move.

## How to verify

## Technical Notes

Approach: the list lives once, in `rules/ticket-flow.md` § Definition of Ready, as a
table like the Definition of Done (line | ready when). A project's own Definition of
Ready in `CONVENTIONS.md` or on its board wins, as for the Definition of Done. The
skills read the rule; they do not copy the lines.

- `rules/ticket-flow.md`: the new section, and the scope line at the top names
  refinement and sprint planning.
- `rules/backlog.md` § Definition of Ready: one line pointing to the ticket-level list
  for tracker stories.
- `skills/refinement/SKILL.md` and `commands/refinement.md` Phase 3 (per-ticket
  questions): a ready line per story, read from the ticket's fields (description,
  parent, flagged, story points, design link in the body).
- `skills/sprint-planning/SKILL.md` § Output (the flags list) and
  `commands/sprint-planning.md`: failing stories in the flags; where an unsized story
  goes to `skills/sprint-planning/templates/refinement-template.md`, the failing line
  goes with it.
- `docs/pipeline-map.md`: the Definition of ready gate row (now ⚠️ partial) names the
  ticket check.

"One capability" is the product owner's unit, not the MR budget: a story may take more
than one MR (`rules/backlog.md` § One Ticket, Many Items). The check names a story that
reads as two capabilities ("… and …" in its title or description); it does not size it
against `rules/mr-sizing.md`.

Test level per criterion: criteria 1–2 by review of the rule text. Criteria 3, 5 and 6
by a new scaffold eval case in `evals/refinement/`, with a fake `jira` on the path as
`evals/mr-merged/mr-merged-1` has: one ready story, one with "(specificeren)" and no
epic, one bug without design; graders for the per-story lines, the bug not held against
the list, and no tracker write. It must fail on the base. Criterion 4 by review:
there is no sprint-planning eval suite, and this slice does not start one.

Support mode has no sprint planning, and its tickets are mostly bugs and tasks; the
lighter route (decided in refinement of this slice) keeps them out of the check.

`feat-delivery-guidance-2-ready-check-in-the-path.md` changes the same places: refinement
Phase 3 "Questions per ticket", the sprint-planning Output and Phase 6, and the
Definition of ready gate row in `docs/pipeline-map.md`. Build on it, after it merges:
its parked developer questions and this slice's ready lines sit side by side per ticket,
and the gate row names both checks.

## Out of Scope

- Changing or flagging a ticket that fails a line; the report is the output.
- A ready list for bugs and tasks.
- The story format itself (slice 2).

## Related

- Depends on: feat-ticket-flow-2-story-format.md
- Depends on: feat-delivery-guidance-2-ready-check-in-the-path.md
- [../../rules/ticket-flow.md](../../rules/ticket-flow.md)
- [../../rules/backlog.md](../../rules/backlog.md)
- [../../skills/refinement/SKILL.md](../../skills/refinement/SKILL.md)
- [../../skills/sprint-planning/SKILL.md](../../skills/sprint-planning/SKILL.md)
- [../../evals/mr-merged/mr-merged-1/case.yaml](../../evals/mr-merged/mr-merged-1/case.yaml)
