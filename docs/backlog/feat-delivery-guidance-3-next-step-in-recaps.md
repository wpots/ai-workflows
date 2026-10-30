# Feature: Next Step in Every Delivery-path Recap

## Status

done

Drafted and flipped to ready 2026-10-13 with the maintainer.

## Slice

3/4 — a next-step line at the end of every skill on the delivery path

## Priority

medium

## Summary

A developer finishing one skill often does not know which one comes next. Some skills
already hand off (`watch-mrs` → `mr-merged`, `user-journeys` → `backlog`,
`close-sprint` → `release-notes`), most do not. This slice ends every recap on the
delivery path with one line naming the next step — the next skill, or the human action
that has to happen first — chosen from the outcome of the run, not fixed per skill.

## User Story

As a developer working through a ticket, I want every skill to end by telling me what
comes next, so that I can follow the path from ticket to merged MR without knowing the
whole map by heart.

## Acceptance Criteria

- Every skill on the delivery path ends its recap with exactly one `Next step:` line.
- The next step follows from the outcome: an item that is not ready points at its route
  from the ready check, a ready item points at work-backlog, an MR that is open points at
  review, a merged MR points at the closeout.
- When the next step is a human action (a reviewer, the PO, a setting), the line names
  that action and who takes it, not a skill.
- Skills that already hand off keep their hand-off; the line restates it rather than
  adding a second one.
- The fallback runbooks of these skills carry the same line.

## How to verify

- [x] `rg -c 'Next step:'` over the 11 skills and 7 runbooks on the path — every
  file has a hit. Skills with their own runbook-free recap carry the outcome
  table themselves (`backlog`, `work-backlog`, `address-review-comments` new
  step 12, `mr-merged`, `release` Step 9); `create-pr` adds Recap item 5, and
  `watch-mrs` adds it to its Output. The thin wrappers (`refinement`,
  `sprint-planning`, `close-sprint`, `release-notes`) point at the table in
  their runbook's Output, so the line lives in one place.
- [x] Every table reads "from the first row that applies", which makes the line
  exactly one; the rows cover the outcomes in the criteria: not ready → the
  ready check's `Next step:`, ready → `work-backlog`, open MR →
  `review !<iid> (reviewer)`, merged → `mr-merged` (the `watch-mrs` event line).
- [x] Human actions carry who takes them: `(you)`, `(reviewer)`, `(PO)`,
  `(assignee)`, `(team with the PO)`, and work-backlog's draft row names the
  first blocker and who clears it.
- [x] Existing hand-offs are restated in the line, none added beside them:
  `watch-mrs` → `mr-merged`, `close-sprint` → `release-notes`, `release` 8a →
  `close-sprint`, `release-notes` → the live mail in `release` Step 6,
  `mr-merged`'s ticket move by the assignee, `sprint-planning`'s ready check
  offer.
- [x] Runbooks: `commands/refinement.md`, `sprint-planning.md`, `backlog.md`,
  `work-backlog.md`, `create-pr.md`, `close-sprint.md` and `release-notes.md`
  carry the same tables.
- [x] Pre-commit hook on the implementation commit: `validate-skills.mjs` 39
  skills, 106 docs link-checked, no errors (the one warning, create-pr's body
  length, predates this branch and grows from 503 to 506 lines); hook,
  release-automation, run-checks parity and compact-sprint tests green;
  `generate-adapters.sh` and the drift check report no changes.
- Targeted evals: not run — no case in `evals/` asserts a recap's
  `Next step:` line; coverage gap: one `Next step:` line, picked by outcome, at
  the end of each delivery-path recap.

## Technical Notes

The path, in order: `refinement` → `sprint-planning` → `backlog` (with the ready check)
→ `work-backlog` → `create-pr` → `watch-mrs` / `address-review-comments` → `mr-merged`
→ `close-sprint` → `release-notes` / `release`.

Per skill, a small table of outcome → next step in the skill's Output or Recap section.
Examples:

| Skill | Outcome | Next step |
| --- | --- | --- |
| backlog | item not ready | the route from the ready check |
| backlog | item ready, confirmed | `work-backlog` |
| work-backlog | MR opened | reviewer reviews; `watch-mrs` to follow it |
| work-backlog | nothing eligible | the ready check's report |
| mr-merged | ticket incomplete | the next slice's item |

Keep each line short; the recap already holds the detail. Watch the size budget: eleven
skills plus seven runbooks (`watch-mrs`, `address-review-comments`, `mr-merged` and
`release` have none) is over the file target in `rules/mr-sizing.md`, under the split
trigger — the regenerated `.github/prompts/*.prompt.md` files do not count, the
runbooks do. Changelog fragment `changelog.d/changed.next-step-in-recaps.md`.

## Out of Scope

- Skills off the delivery path (maintenance, audits, upstream skills).
- A "where am I" command that reads a ticket's state and answers the next step — worth a
  separate item if the recap lines are not enough.
- The path page in `AI-WORKFLOWS.md` (slice 4).

## Related

- Depends on: feat-delivery-guidance-2-ready-check-in-the-path.md
- [../../skills/watch-mrs/SKILL.md](../../skills/watch-mrs/SKILL.md)
- [../../skills/mr-merged/SKILL.md](../../skills/mr-merged/SKILL.md)
- [../../skills/close-sprint/SKILL.md](../../skills/close-sprint/SKILL.md)
- MR: https://gitlab.com/greenberrynl/config/ai-workflows/-/merge_requests/334
