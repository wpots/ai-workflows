# Feature: Pipeline Triage Skill

## Status

superseded

Superseded 2026-10-15 by what already covers a failing pipeline. No skill gets
built.
- **The platform.** GitLab's Fix pipeline flow is on for `greenberrynl` since
  2026-10-13. It starts from **Fix pipeline with Duo** on a failing pipeline,
  reads the job log, and proposes a fix or opens an MR.
  `spike-pilot-gitlab-code-review-flow.md` judges it on at least one failing
  MR pipeline.
- **Reporting.** `skills/create-pr` (step 7) names a failed job with the last
  lines of its log. `skills/watch-mrs` names the failing job and stage, and
  points at local reproduction and the Fix pipeline flow.
- **Prevention.** `chore-run-checks-ci-parity.md` makes the local sweep run what
  CI runs, which stops the failure before the push.
- **Frequency.** On RFW, 2 of 99 MR pipelines failed between 2026-09-15 and
  2026-10-15: `unit_test` on !509 and `storybook_test` on !510. Both were
  script failures a local test run reproduces. Nothing showed the same failure
  coming back, which is the premise of this item. Only RFW was measured.

**Reopen** as a new item when both hold:
- the pilot (ends 2026-11-10) finds the Fix pipeline flow not worth using;
- and failed MR pipelines run above about 10% a month, or one failure is shown
  to recur.

The criteria below stay as that item's starting point.

Readiness pass 2026-07-29 — not autonomously runnable yet: AC5's
reproduce-locally step needs the CI-job→local-command mapping owned by
chore-run-checks-ci-parity. The watch-mrs side is delivered (the watcher now
offers `skills/pipeline-triage` on a failed pipeline), so this skill has a
live caller waiting. Otherwise the most concrete of the CI items (exact
`glab` calls, classification set, and negative constraints are all
specified).

Readiness pass 2026-10-08 — one more reason not to start: GitLab's Fix pipeline
flow (generally available since 18.8, https://docs.gitlab.com/ci/pipelines/fix_pipeline/)
is the platform's own triage of a failing pipeline, and the maintainer's licence
(Premium with Duo Core) may cover it. Before building this skill, see what the flow
does on a real failing MR pipeline; `spike-pilot-gitlab-code-review-flow.md` has
that check. The part a platform flow cannot do is reproduce the failure with the
project's own local command (criterion 5), so that is what this skill would still
be for, and it still waits on `chore-run-checks-ci-parity.md`.

## Priority

low

## Summary

A skill that turns a failing CI pipeline into a diagnosis and a fix: fetch the
failing jobs and their traces, classify the failure, reproduce it locally with the
project's own script, then fix, verify, and push.

## User Story

As a developer whose MR pipeline just went red, I want the failing job's actual
output pulled and reproduced locally instead of guessing from a status badge, so that
the failure is fixed in one pass and the root cause is fed back somewhere that
prevents a repeat.

## Acceptance Criteria

- [ ] New `skills/pipeline-triage/SKILL.md` with valid frontmatter and a `Use when …`
      routing cue (failing pipeline, red MR, "why did CI fail").
- [ ] Accepts an MR iid, a pipeline id, or "the current branch" and resolves the rest
      via `glab`.
- [ ] Fetches the failing jobs and their traces (`glab ci status`,
      `glab api projects/<enc>/pipelines/<id>/jobs`, job trace) and reports the
      failing job name, stage, and the relevant trace excerpt — not the whole log.
- [ ] Classifies the failure: lint / type-check / test / build / migration / flaky /
      infrastructure-or-runner, and states which classification it chose and why.
- [ ] Reproduces the failure locally by running the same command the job runs, and
      says explicitly when it cannot reproduce (likely flaky or environment-specific).
- [ ] Proposes the fix before applying it; applies, re-verifies, and pushes only
      after approval.
- [ ] Closes by asking whether the root cause belongs in `skills/run-checks` CI
      parity or in `skills/improve-skill`, so the same failure cannot recur silently.
- [ ] Never retries a pipeline to "see if it passes" as a substitute for diagnosis.
- [ ] Listed in `docs/workflow-canonical-sources.md` and placed in
      `docs/pipeline-map.md`.

## Technical Notes

Guard every `glab`/`jq` call against empty output — the watcher script in
`skills/watch-mrs/SKILL.md` learned this the hard way; a transient API hiccup must not
be reported as "no failing jobs".

Resolve the project slug in both forms (URL-encoded for `glab api` paths, slash form
for `glab` subcommands), as `skills/watch-mrs` already documents.

Job traces can be large. Fetch the trace, then extract the failing region rather than
streaming the whole thing into context.

For migration failures, hand off to `skills/migration-check` instead of duplicating
its snapshot-drift analysis.

## Out of Scope

- Fixing infrastructure or runner problems (report and stop).
- Editing CI configuration as part of triage — that is a separate, reviewed change.
- Retry loops or auto-merge behaviour.

## Related

- [../../skills/watch-mrs/SKILL.md](../../skills/watch-mrs/SKILL.md)
- [../../skills/run-checks/SKILL.md](../../skills/run-checks/SKILL.md)
- [../../skills/migration-check/SKILL.md](../../skills/migration-check/SKILL.md)
- [../pipeline-map.md](../pipeline-map.md)
