# Feature: Ticket-level Definition of Ready in Refinement and Sprint Planning

## Status

done

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

- [x] Criteria 3, 5 and 6, eval case `evals/refinement/refinement-4` (a fake
  `jira` with DEMO-201, a ready story; DEMO-202, empty, with "(specificeren)" and
  no epic; DEMO-203, a bug without design):
  `claude plugin eval <worktree> --case refinement-4 --runs 1 --ablation none --scaffold --allow-tools Bash Write Edit --no-publish --trust-plugin --judge-model sonnet --max-cost-usd 1`.
  - On the base it fails: score 0.75, a1 FAIL×3. The prep doc had no ready verdict
    per story and never read the raw view ($0.45).
  - Two runs after the first implementation still failed a1 (0.75). The passing
    story's ready line listed the lines it passed, and once mixed in the MR split
    ($0.51, $0.57). The runbook now gives the literal line shape.
  - It passes: score 1.00 ($0.50). a1 PASS×3: DEMO-201 reads `**Ready:** ready`,
    and DEMO-202 reads `fails Sections …, Placeholder …, Design …, Epic …`.
    a2 PASS×3: the bug gets no ready line. a3: 0 jira write commands. The skill
    fired.
- [x] Criteria 1 and 2 by review: `rules/ticket-flow.md` § Definition of Ready
  has the seven lines, before § Definition of Done, and its scope line names
  refinement prep and sprint planning. `rules/backlog.md` § Definition of Ready
  keeps its table and adds one line pointing to it.
- [x] Criterion 4 by review, since there is no sprint-planning eval suite.
  `commands/sprint-planning.md`:
  - Phase 1 reads `--raw` and runs the ready check per story.
  - Phase 4 names the other failing lines of an unsized story in its Rationale.
  - Phase 6 Doc actions and the Phase 7 summary carry the failing stories, and so
    does Output.
  - `skills/sprint-planning/SKILL.md` Output lists them among the flags.
  - Both templates have a place for them.
- [x] The pre-commit hook on the implementation commit:
  - `validate-skills.mjs`: 39 skills, 106 docs link-checked, no errors. Its one
    warning, create-pr at 503 lines, predates this branch.
  - The hook, release-automation, run-checks parity and compact-sprint tests are
    green.
  - `generate-adapters.sh` and the drift check report no changes.
- Targeted evals: refinement-4 — 1/1 pass ($0.50, 2026-10-30), after a fail
  on the base.

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
  goes with it. The planning document lists them as well, in
  `skills/sprint-planning/templates/planning-template.md` under the Flags line.
- `docs/pipeline-map.md`: the Definition of ready gate row (⚠️ partial already, and
  it stays partial) names the ticket check.
- `jira issue view --plain` leaves out Flagged and story points, so both runbooks read
  `--raw` as well.

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
Phase 3 "Questions per ticket", the sprint-planning Output and the ready-check offer
after Phase 7, and the Definition of ready gate row in `docs/pipeline-map.md`. Build
on it, after it merges:
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
