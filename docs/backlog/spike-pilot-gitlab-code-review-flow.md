# Spike: Pilot GitLab Code Review Flow On One Client Project

## Status

draft

Filed 2026-10-08 from the October 2026 stack review (task T5, re-scoped from
"build a CI agent lane" to "configure and measure the platform's own"). Not
`ready`: it needs a client project chosen, and a GitLab setting only the
maintainer can change.

## Priority

medium

## Summary

GitLab's Code Review Flow reviews merge requests with an agent, is configured from
files in the repo, and runs on Claude Sonnet 5.5 since 2026-10-05. Switch it on for
one client project for four weeks, give it the lenses of `skills/code-review`, and
measure whether its comments get acted on, before building any review lane of our own.

## User Story

As the maintainer, I want evidence on whether the platform's review flow earns its
place next to the local `code-review` skill, so that we do not build a second one.

## Acceptance Criteria

- [ ] One client project is named and the flow is enabled for it (a GitLab setting,
      done by the maintainer).
- [ ] `mr-review-instructions.yaml` in that project carries the review lenses copied
      from `skills/code-review`, adapted to the flow's format.
- [ ] The metric and the threshold are written down before the first MR: the share
      of the flow's comments that lead to a change, counted from resolved threads,
      not from thumbs up or down.
- [ ] After four weeks a short report in `docs/` gives the count of comments, how
      many led to a change, how many were dismissed and why, and a keep or drop
      recommendation.

## Open decisions

1. Which client project, and whether its runners carry the `gitlab--duo` tag the
   flow needs.
2. The threshold for "worth keeping". For reference only: in a published study of
   an AI review tool at Atlassian, 38.7% of its comments were resolved against
   44.5% for human reviewers; another study of 31,000 CodeRabbit comments found 56%
   rejected.

## Technical Notes

From GitLab's documentation (https://docs.gitlab.com/user/duo_agent_platform/flows/foundational_flows/code_review/):
the flow is disabled by default, needs Duo Core or credits plus runners tagged
`gitlab--duo`, reads about 800 KiB of context, does not read `AGENTS.md` or
`SKILL.md`, and its approval does not count toward required approvals. The
maintainer's licence is Premium with Duo Core.

Check, in the same pilot, what the Fix pipeline flow does on a failing MR pipeline:
it is the platform's version of `feat-pipeline-triage.md`.

## Out of Scope

- Building a headless review job in our own CI.
- Rolling the flow out to other projects.

## Related

- [feat-pipeline-triage.md](feat-pipeline-triage.md)
- [../../skills/code-review/SKILL.md](../../skills/code-review/SKILL.md)
- https://docs.gitlab.com/user/duo_agent_platform/flows/foundational_flows/code_review/
