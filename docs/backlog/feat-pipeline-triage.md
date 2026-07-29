# Feature: Pipeline Triage Skill

## Status

draft

## Priority

high

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
