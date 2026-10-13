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

1. Which client project. Runners are not a decision on GitLab.com (checked
   2026-10-13, see Technical Notes); check that the project has instance runners
   turned on and compute minutes left.
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

Setup facts, read 2026-10-13 (docs:
https://docs.gitlab.com/user/duo_agent_platform/flows/execution/ and the Fix
pipeline page):

- **Runners.** On GitLab.com the hosted instance runners already carry the
  `gitlab--duo` tag; one online runner was visible to `greenberrynl` on
  2026-10-13. Flows only run on an instance runner or a runner on the
  *top-level* group. Subgroup and project runners are skipped, so a pilot
  project's own runner cannot serve it. Hosted runners spend compute minutes.
  None of the group's four existing runners carries the tag.
- **Switches.**
  - In `greenberrynl` (Owner): Settings > GitLab Duo > Change configuration >
    Flow execution, tick **Allow flow execution**, **Allow foundational flows**,
    **Code Review** and **Fix CI/CD Pipeline**.
  - In the project (Maintainer): Settings > General > GitLab Duo, the same
    flow toggles.
  - Optional, per project: Settings > Merge requests > **Enable automatic
    reviews by GitLab Duo**.
  - A `duo-code-review-greenberry` service account exists already, so Code
    Review was enabled at some point.
- **Instructions file.** `.gitlab/duo/mr-review-instructions.yaml`, with the
  keys `instructions`, `name`, `fileFilters` and nothing else.
- **Billing.** Code Review costs 4 reviews per GitLab Credit, charged to whoever
  starts the review (the MR author for automatic reviews). Premium includes
  $12 of credits per user per month, a limited-time promotion per the pricing
  page. Without accepting usage billing, features stop when the included
  credits run out.
- **Fix pipeline.** Manual only (the **Fix pipeline with Duo** button on a
  failing pipeline). It reads the last 150 KiB of the job log, and it does read
  `AGENTS.md`.
- **Health check.** Project Settings > General > GitLab Duo, the **CI/CD
  runner** row. AI > Sessions shows each flow session.

Check, in the same pilot, what the Fix pipeline flow does on a failing MR pipeline:
it is the platform's version of `feat-pipeline-triage.md`.

## Out of Scope

- Building a headless review job in our own CI.
- Rolling the flow out to other projects.

## Related

- [feat-pipeline-triage.md](feat-pipeline-triage.md)
- [../../skills/code-review/SKILL.md](../../skills/code-review/SKILL.md)
- https://docs.gitlab.com/user/duo_agent_platform/flows/foundational_flows/code_review/
