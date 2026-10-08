# Feature: Routing and Output Cases for the Riskiest Skills

## Status

done

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

- [x] `evals/<skill>/` holds a should-fire case for each of `work-backlog`,
      `create-pr`, `code-review`, `start-project`, `refinement`: a prompt a user
      would type, not naming the skill, graded by `tool_used: Skill` on that
      skill's name.
- [x] Each of the five also has a should-not-fire case with a near-miss prompt
      (for example "review this paragraph" against `code-review`), graded by
      `tool_used: Skill` with `min: 0`, `max: 0` and `arm: both`.
- [x] Each of the five has one output case whose `llm` grader names the failing
      condition, not a free-text diff.
- [x] Routing cases are tagged `routing`; the local command for the routing
      suite is `claude plugin eval . --tag routing --runs 1 --ablation none
      --no-publish --trust-plugin --max-cost-usd 3`.
      Under a two-arm run the should-fire grader is an indicator, not a gate,
      so the documented command and any CI job must use `--ablation none`.
      (Documented with `--judge-model sonnet` added, per the judge criterion.)
- [x] Every `llm` grader checks one assertion: each existing
      `graders/criteria.md` (all 47 cases on 2026-10-08, 10 `runnable` and 37
      `needs-scaffold`, so there is one format) is split by a throwaway script into one file per
      numbered assertion (`graders/a1.md`, `a2.md`, …, body `PASS if <the
      assertion>`), and the new output cases are written that way. A failing
      case then names the assertion in the report.
- [x] The judge model is chosen on evidence: run the cases that failed on
      2026-10-08 (`dependency-hotfix-5`, `npm-maintenance-2`,
      `npm-maintenance-3`, `payload-jobs-1`, `close-sprint-6`) with the split
      graders, once with the default judge (Haiku) and once with
      `--judge-model sonnet`, `--runs 1 --ablation none --no-publish`. The MR
      reports each per-assertion verdict for both. If the two judges disagree on
      assertions that hold in the final message, every documented command (and
      slice 3's) pins the stronger judge with `--judge-model`.
- [x] `scripts/validate-skills.mjs` warns when a skill in a named risky set has
      no `evals/<skill>/` directory.
- [x] `docs/workflow-canonical-sources.md` lists `evals/` as the canonical
      source for skill regression cases.

## How to verify

Run 2026-10-08 on Claude Code 2.1.283, plugin 2.6.0, from the branch. Each
`claude plugin eval` run is a real model call; total spend for this item was
$5.20.

- [x] Grader split: a throwaway script (not committed) turned 47
      `graders/criteria.md` into 260 `graders/a<n>.md`, one per numbered
      assertion. `rg --files evals -g criteria.md` → nothing; the count of new
      files equals the count of numbered lines.
- [x] Every case loads: `claude plugin eval . --runs 1 --ablation none
      --no-publish --trust-plugin --max-cost-usd 0` → no `✗` line, $0.00.
      The same command with a deliberately broken grader printed
      `✗ … invalid case.yaml: graders.0.type: Invalid discriminator value`, so
      a `$0` run does validate every case file.
- [x] Routing suite: `claude plugin eval . --tag routing --runs 1 --ablation
      none --no-publish --trust-plugin --judge-model sonnet --max-cost-usd 3`
      → 10 of 10 pass (5 should-fire, 5 should-not-fire), $1.57.
- [x] Output cases (`--case <name> --runs 1 --ablation none --no-publish
      --trust-plugin --judge-model sonnet --max-cost-usd 1`, one run each):
      `create-pr-5`, `code-review-3`, `start-project-3`, `refinement-3` pass
      every grader; `work-backlog-3` passes a1, a2, a4 and `skill-fired` and
      fails a3 (see Technical Notes).
- [x] Judge comparison: `dependency-hotfix-5`, `npm-maintenance-2`,
      `npm-maintenance-3`, `payload-jobs-1`, `close-sprint-6`, each once with
      the default judge and once with `--judge-model sonnet`, `--runs 1
      --ablation none --no-publish`. Per-assertion verdicts are in the MR.
      Haiku voted FAIL on 11 assertions that held in the final message it
      graded and PASS on one that did not; Sonnet misjudged at most 2 of 33.
      Every documented command now carries `--judge-model sonnet`.
- [x] `node scripts/validate-skills.mjs` with the new cases untracked → 4
      warnings, one each for `code-review`, `refinement`, `start-project`,
      `work-backlog` (`create-pr` already had tracked cases); with them tracked
      → no risky-set warning.
- [x] `bash scripts/validate-ai-instructions.sh` and `claude plugin validate .`
      pass.

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

Found while delivering (2026-10-08):

- Descriptions: no finding. All five should-fire prompts reached their skill
  and all five near misses stayed away, so no `description` changed.
- Measured cost: routing cases $0.10–$0.29 each ($1.57 for the 10, no judge
  calls); output cases $0.15–$0.25. A should-fire run keeps going after the
  skill loads (up to 8 turns), which is most of its cost.
- `work-backlog-3` caught drift between the skill and its fallback runbook:
  the first run quoted `commands/work-backlog.md` rule 3 ("an open MR from a
  previous run means stop and report") and stopped, where the skill's
  Contract #3 makes reworking the MR's review threads the run's work. The
  runbook is aligned in this MR (changelog fragment
  `fixed.work-backlog-runbook-wip-rework.md`), and the next run followed the
  skill. a3 (the addressed threads get resolved) still fails: two runs whose
  plan says "push … and resolve both threads" got three Sonnet FAIL votes each,
  likely because the same message adds that it cannot resolve threads in this
  session. a3 was reworded once, from "says the threads … are resolved" to
  "its plan resolves …", without changing the verdict. Left failing as a judge
  finding.
- `close-sprint-6`: `skill-fired` fails under both judges; the run answers in
  one turn from the description, which already says the tracker sprint is
  closed by the user. Its four assertions hold. The prompt is a follow-up turn
  in a session that ran the skill earlier, so a `context.history_file` case
  may be the honest form. Not changed here.
- Assertion wording, not changed here (no loosening in this slice):
  `dependency-hotfix-5` a2 names the range "16.2.12 → 16.3.6" while the
  answers rate "the 16.3 range" (the part beyond the lowest fix) High; a4 asks
  for the MR description to carry the risk block, which neither run said.
  `payload-jobs-1` a6 failed under Sonnet because the answer recommends the
  skill's `check:job-runner` script over SSH "to confirm the endpoint denies
  anonymous requests"; that script calls `access.run` in-process, but the
  sentence reads like a probe.
- Tool facts: `--case` takes one glob without `{a,b}` or `@(a|b)`, and a
  second `--case` replaces the first; `--max-cost-usd 0` loads and validates
  every case file and starts no run. The JSON records `judgeModel` as the alias
  passed (`sonnet`), not a resolved model ID.

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
