# Feature: Routing and Output Cases for the Riskiest Skills

## Status

in-progress

Task T4 of the AI stack reviews (July and October 2026). Filed 2026-10-08 as
slice 2 of the eval work; `ready` since slice 1's live run (2026-10-08) closed
it. That run added the two grader criteria below: the judge returned only
votes, so no failure named its assertion.

## Slice

2/3 — routing cases for the riskiest skills, and the check that keeps them

## Priority

high

## Summary

Add the cases that matter most and do not exist yet: for each of the five
riskiest skills a prompt that must reach the skill and one that must not, plus
one output case each. Most skill regressions are a description edit that quietly
stops matching the intent it was written for, and that is what a routing case
catches.

## User Story

As the maintainer, I want a description edit to `work-backlog`, `create-pr`,
`code-review`, `start-project` or `refinement` to fail a local check when the
skill stops triggering on natural phrasing, so that I find out before a user does.

## Acceptance Criteria

- [ ] `evals/<skill>/` holds a should-fire case for each of `work-backlog`,
      `create-pr`, `code-review`, `start-project`, `refinement`: a prompt a user
      would type, not naming the skill, graded by `tool_used: Skill` on that
      skill's name.
- [ ] Each of the five also has a should-not-fire case with a near-miss prompt
      (for example "review this paragraph" against `code-review`), graded by
      `tool_used: Skill` with `min: 0`, `max: 0` and `arm: both`.
- [ ] Each of the five has one output case whose `llm` grader names the failing
      condition, not a free-text diff.
- [ ] Routing cases are tagged `routing`; the local command for the routing
      suite is `claude plugin eval . --tag routing --runs 1 --ablation none
      --no-publish --trust-plugin --max-cost-usd 3`.
      Under a two-arm run the should-fire grader is an indicator, not a gate,
      so the documented command and any CI job must use `--ablation none`.
- [ ] Every `llm` grader checks one assertion: each existing
      `graders/criteria.md` (all 47 cases on 2026-10-08, 10 `runnable` and 37
      `needs-scaffold`, so there is one format) is split by a throwaway script into one file per
      numbered assertion (`graders/a1.md`, `a2.md`, …, body `PASS if <the
      assertion>`), and the new output cases are written that way. A failing
      case then names the assertion in the report.
- [ ] The judge model is chosen on evidence: run the cases that failed on
      2026-10-08 (`dependency-hotfix-5`, `npm-maintenance-2`,
      `npm-maintenance-3`, `payload-jobs-1`, `close-sprint-6`) with the split
      graders, once with the default judge (Haiku) and once with
      `--judge-model sonnet`, `--runs 1 --ablation none --no-publish`. The MR
      reports each per-assertion verdict for both. If the two judges disagree on
      assertions that hold in the final message, every documented command (and
      slice 3's) pins the stronger judge with `--judge-model`.
- [ ] `scripts/validate-skills.mjs` warns when a skill in a named risky set has
      no `evals/<skill>/` directory.
- [ ] `docs/workflow-canonical-sources.md` lists `evals/` as the canonical
      source for skill regression cases.

## How to verify

<!-- Filled in by whoever delivers the item. -->

## Technical Notes

Do the descriptions first. If a should-fire case fails on a freshly written
prompt, that is a finding about the skill's `description` (the
`description` + `when_to_use` text is truncated at 1,536 characters in the
listing; front-load the trigger), not a reason to loosen the case. Record such
findings in the MR; fix a description only when the case proves it is wrong.

Grader split: the 2026-10-08 run put judge cost at $0.07 of $2.28, so one judge
call per assertion adds cents. `weight` per grader stays at the default; a case
still passes only when every grader passes (default `--threshold 1.0`). The
`criteria.md` line "FAIL if any of them does not hold. Name the numbered
assertion that failed." goes, because the report keeps only the votes. A failing
assertion after the split is a finding about the skill or the assertion; record
it in the MR, do not loosen it in this slice.

Cost: routing cases are cheap, output cases are not. Keep one output case per
skill here; more cases are added by `skills/improve-skill` when a failure
earns one.

## Out of Scope

- Cases for the other 33 skills; they earn one when they fail.
- A CI job — slice 3.
- Scoring a case against the no-plugin baseline (`Δ`); routing is a
  pass/fail question.

## Related

Depends on: feat-skill-eval-harness.md

- [feat-skill-eval-harness.md](feat-skill-eval-harness.md)
- [feat-skill-eval-harness-3-ci-job.md](feat-skill-eval-harness-3-ci-job.md)
- https://code.claude.com/docs/en/plugin-evals
