# Feature: Routing and Output Cases for the Riskiest Skills

## Status

draft

Filed 2026-10-08 as slice 2 of the eval work. Becomes `ready` once slice 1 is
`done` on `main`: the case layout and the local loop it defines are what this
slice extends.

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
      suite is `claude plugin eval . --tag routing --runs 1 --ablation none`.
      Under a two-arm run the should-fire grader is an indicator, not a gate,
      so the documented command and any CI job must use `--ablation none`.
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
