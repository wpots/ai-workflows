# Feature: A Verdict Per Acceptance Criterion In `How to verify`

## Status

<!-- draft | ready | in-progress | done -->

ready

Readiness pass 2026-10-13: cut to what is not delivered yet. Step 8 of
`skills/work-backlog` already fills `How to verify` from what actually ran and
says when a criterion could not be verified locally, and
`feat-verify-before-done.md` closed the same gap in `run-checks` and
`address-review-comments`. What is left is a verdict per criterion, so a reviewer
sees at a glance which criteria a command proves, which nobody checked, and which
cannot be tested as written. History: rescoped on 2026-07-30 from a
criterion-to-test matrix to verification evidence; the matrix needed a tracker
snapshot that is now parked (`docs/pipeline-map.md`, gap 2).

## Priority

medium

## Summary

`skills/work-backlog` writes `How to verify` as one line per acceptance
criterion: the command or route that exercises it, what it showed, and a verdict
of `verified`, `unverified` or `untestable`. Criteria that cannot be tested as
written come back as feedback on the item.

## User Story

As a reviewer, I want every criterion a change claims to meet paired with the
command that proves it and an explicit verdict, so that I can re-run the proof
and see at once what nobody checked.

## Acceptance Criteria

- Step 8 of `skills/work-backlog/SKILL.md` writes `## How to verify` with one
  line per acceptance criterion of the BLI, in the order of the criteria: a
  checkbox, the criterion in a few words, the command or route that exercises
  it, the observed result, and the verdict.
- The verdict is one of three values. `verified`: the command ran on the
  branch's final commit and its output shows the criterion holds; the checkbox
  is ticked. `unverified`: not checked, with the reason (needs a deploy, a
  credential, a human judgement, production data); the checkbox stays open.
  `untestable`: the criterion cannot be tested as written, with the reason; the
  checkbox stays open.
- Evidence only the authoring session could produce (an answer in chat, a tool
  call with no command a reviewer can run) makes the line `unverified`, never
  `verified`.
- A UI criterion may use a screenshot or a preview URL as its evidence, the
  lighter form `docs/pipeline-map.md` accepts for visual checks.
- The existing status rule keeps working: an `unverified` criterion that can
  only be checked after merge goes first and keeps the item `in-progress`.
- When any criterion is `untestable`, the MR description says so under the
  heading it uses for open items, as feedback for whoever wrote the item.
- Step 9 repeats the lines unchanged in the MR's `## How to verify`.
- `commands/work-backlog.md` says the same as the skill, and its generated
  prompt is regenerated.
- An eval case under `evals/work-backlog/` asserts the line format and the three
  verdicts, following `evals/README.md`. If the case needs repository state to
  run, it is tagged `needs-scaffold` and the MR says so.
- `docs/pipeline-map.md` gap 10 and the two QA rows (requirements traceability,
  untestable criteria) describe what shipped.
- A changelog fragment `changelog.d/changed.verify-verdict-per-criterion.md`
  records the change, because it changes what the plugin ships.

## How to verify

<!-- Filled in by whoever delivers the item. -->

## Technical Notes

The change is in step 8 of `skills/work-backlog/SKILL.md` ("Write `How to
verify`, then close out the BLI"). Replace its bullet list of what to include with
the per-criterion line, and keep the rules around it: no invented steps, a step
not run does not go in, and the `done` / `in-progress` decision.

One line, for example:

```markdown
- [x] lists open critical tickets — `/greenberry:maintenance deps` on RFW → RFW-330 listed, 4 days, flagged — verified
- [ ] critical ticket over 72h makes lane A urgent — needs an open ticket older than 72h in Jira — unverified
```

Leave `rules/backlog.md` alone. Its `How to verify` placeholder is a synced rule:
changing it changes the freshness stamp and prompts a re-sync in every project.
If the format holds up, align the placeholder in its own MR.

`skills/address-review-comments` can end the same way later; not in this item.

## Out of Scope

- Generating tests from criteria.
- A criterion-to-test-id matrix, or anything stored in the tracker.
- Blocking the MR on an `unverified` or `untestable` criterion.
- Changes to `skills/run-checks`, `skills/address-review-comments` or
  `rules/backlog.md`.

## Related

- [../../skills/work-backlog/SKILL.md](../../skills/work-backlog/SKILL.md)
- [../../commands/work-backlog.md](../../commands/work-backlog.md)
- [../pipeline-map.md](../pipeline-map.md) — gap 10
- `feat-verify-before-done.md` — the earlier half (`run-checks`,
  `address-review-comments`)
