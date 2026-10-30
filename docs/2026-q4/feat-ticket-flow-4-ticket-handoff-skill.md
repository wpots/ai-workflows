# Feature: Ticket Handoff Skill for Test and Acceptance Comments

## Status

done

## Slice

4/5 — a skill that reads the latest comment and drafts the assignee's next one

## Priority

medium

## Summary

After the test comment, the ticket goes back and forth by comment: the tester reports
findings or none, the assignee hands it to the product owner with instructions and known
deviations, the product owner approves or rejects. No skill covers that stretch. This
slice adds `ticket-handoff`: it reads the newest comment on a ticket, classifies it,
drafts the assignee's next comment, checks the Done layer before Done, and names the
move the assignee has to make. It also fills the Feedback triage gate in the pipeline
map, with a person deciding.

## User Story

As the assignee, I want a skill that reads what the tester or product owner wrote and
drafts my reply and next step, so that findings, acceptance and rejections are handled
the same way every time and nothing falls between two comments.

## Acceptance Criteria

- The skill reads the ticket's comments since the last handoff comment and classifies
  the newest one: findings, no findings, product owner approves, product owner rejects,
  or unclear. Unclear is reported, never guessed.
- Findings: lists them, routes each in-scope one to a backlog item via `backlog` and
  each out-of-scope one to a new ticket via `jira-ticket`, and names the move
  In Test → In Progress.
- No findings: drafts the comment for the product owner (where and what to test, new
  instructions, known deviations) and names the move In Test → Acceptatie.
- Rejection: lists the reasons, routes them like findings, and names the move
  Acceptatie → In Progress.
- Approval: checks the Done layer of `rules/ticket-flow.md` and reports each line that
  fails; when all hold, names the move Acceptatie → Done.
- Every comment is posted only after the user's go; the skill never moves a ticket and
  never fixes anything itself.

## Technical Notes

Reads through `jira issue view --comments <N>` (`skills/service-cli`); without N
the CLI shows only the last comment. Status names come from
the project's board, matched by place in the flow. Update the Feedback triage gate in
`docs/pipeline-map.md` from absent to partial.

## Out of Scope

- Fixing findings (that is `work-backlog` on the new item).
- The release gate (slice 5).

## How to verify

- `node scripts/validate-skills.mjs` → `OK: 40 skills validated, 107 docs
  link-checked, no errors` (one existing warning: `skills/create-pr/SKILL.md` at
  503 lines).
- Targeted eval: `claude plugin eval . --case ticket-handoff-1 --runs 1
  --ablation none --no-publish --trust-plugin --judge-model sonnet
  --max-cost-usd 0.50` → 1/1 pass, `skill-fired` ✓ ($0.27, 2026-10-30). The case
  fails on `main`, where `skills/ticket-handoff` does not exist. The routing
  suite was not run.
- The commit hook's tests, adapter generation and drift check passed.
- Criteria 1–6 are checked against `skills/ticket-handoff/SKILL.md`:
  classification and unclear in Steps 2–3, findings and rejection routing in
  Step 4 and the Step 3 table, the comment for the product owner in Step 4, the
  Done layer per line in Step 4, post-after-go and never-move/never-fix in
  § Tracker write, Step 5 and § Constraints.
- No live run against Jira: the skill writes to the tracker, and this item was
  delivered without any tracker write. A first real run on a ticket in test is
  the end-to-end check.

## Related

- Depends on: feat-ticket-flow-1-test-handoff.md
- [../../rules/ticket-flow.md](../../rules/ticket-flow.md)
- [../../skills/jira-ticket/SKILL.md](../../skills/jira-ticket/SKILL.md)
- [../../skills/backlog/SKILL.md](../../skills/backlog/SKILL.md)
- [../pipeline-map.md](../pipeline-map.md)
- MR: https://gitlab.com/greenberrynl/config/ai-workflows/-/merge_requests/333
