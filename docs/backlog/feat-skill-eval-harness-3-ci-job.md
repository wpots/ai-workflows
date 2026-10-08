# Feature: CI Job for Skill Evals

## Status

draft

Filed 2026-10-08 as slice 3 of the eval work. Blocked on a maintainer decision:
evals in CI are real model calls on an API key, so someone has to supply the
key and set a monthly cap. Becomes `ready` when that is decided and slice 2 is
`done` on `main`.

## Slice

3/3 — run the suite in CI on skill changes

## Priority

medium

## Summary

Run the eval suite in GitLab CI on merge requests that touch `skills/` or
`evals/`, with a cost ceiling and pinned models, so the regression net does not
depend on someone remembering to run it.

## User Story

As the maintainer, I want a merge request that edits a skill to fail when the
skill stops triggering or stops delivering, so that review starts from a green
suite.

## Acceptance Criteria

- [ ] A job in `.gitlab-ci.yml`, run only on merge requests changing `skills/**`
      or `evals/**`, installs Claude Code on the runner and runs
      `claude plugin eval . --tag routing --ablation none --trust-plugin
      --json results.json --threshold 0.8 --max-cost-usd <cap>`.
- [ ] `--model` and `--judge-model` are pinned, so scores are comparable between
      runs.
- [ ] The job fails on exit code 1 and warns on exit code 2 (the cost ceiling
      stopped the run, partial results); a failure names the skill, the case and
      the grader.
- [ ] `results.json` is kept as a job artifact.
- [ ] The API key is a masked, protected CI/CD variable; `docs/contributing.md`
      names the variable and the monthly cap.
- [ ] Without the variable the job prints what it would do and exits 0, the
      same convention the release jobs already use.

## How to verify

<!-- Filled in by whoever delivers the item. -->

## Technical Notes

Exit codes, from the plugin-evals page: 0 every case at or above the threshold;
1 a case below it, a case file that failed to load, no cases found, or the
directory not trusted without `--trust-plugin`; 2 partial run, ceiling hit or
credential rejected. The with-minus-without `Δ` never changes the exit code.

If a case grants `Bash`, the runner needs `bubblewrap` and `socat` on Linux, or
the run is refused. Keep the CI suite to cases that need no shell.

A scheduled variant (nightly, full suite with `Δ`) is the "Scheduled lane" item
of the October review and is not part of this slice.

## Out of Scope

- A scheduled or nightly run.
- Non-routing output cases in CI unless the cost fits under the cap.
- Choosing the cap — that is the maintainer decision this item waits on.

## Related

Depends on: feat-skill-eval-harness-2-routing-cases.md

- [feat-skill-eval-harness-2-routing-cases.md](feat-skill-eval-harness-2-routing-cases.md)
- [../../.gitlab-ci.yml](../../.gitlab-ci.yml)
- https://code.claude.com/docs/en/plugin-evals
