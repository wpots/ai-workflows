# Spike: Pilot GitLab Code Review Flow On One Client Project

## Status

in-progress

**Pilot running on RFW (`greenberrynl/refugeework/website`) since 2026-10-13;
the four weeks end on 2026-11-10.** The maintainer switched on automatic
reviews. Checked through the API on 2026-10-13:
- `auto_duo_code_review_enabled`, `duo_remote_flows_enabled`,
  `duo_foundational_flows_enabled` and `shared_runners_enabled` are all `true`
  on the project;
- `duo_agent_platform_enabled` is `true` on the group.

State on 2026-10-13:
- **No instructions file yet.** RFW has no `.gitlab/duo/` folder, so reviews run
  without our lenses until criterion 2 lands. Report comments from before and
  after that date as two separate numbers.
- **No review has run yet.** !527 and !528 were opened minutes before the switch
  and have no Duo session. Automatic reviews start when a non-draft MR is
  created or marked ready, and on a push. The first one is the smoke test:
  check AI > Sessions, and record the Duo reviewer's username here, because the
  count filters on it.
- **A competing AI reviewer is waiting.** RFW !383 (sander.bruggeman,
  2026-07-22, idle since) adds an AI review job through OpenRouter. Keep it
  unmerged until 2026-11-10, so that only one AI reviewer comments.
- **RFW is also the CI v4 canary** (`ci-components` DEV-659). Expect pipeline
  changes during the pilot. Note them when judging the Fix pipeline flow.

Filed 2026-10-08 from the October 2026 stack review (task T5, re-scoped from
"build a CI agent lane" to "configure and measure the platform's own").

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

- One client project is named and the flow is enabled for it (a GitLab setting,
  done by the maintainer). Done 2026-10-13: RFW, with automatic reviews.
- `.gitlab/duo/mr-review-instructions.yaml` in that project carries the review
  lenses from `skills/code-review`, adapted to the flow's format.
- The metric and the threshold are written down before the first review (below).
  The metric counts resolved threads, not thumbs up or down.
- After four weeks, a short report in `docs/` gives:
  - the number of comments, before and after the instructions file;
  - how many led to a change and how many were dismissed, and why;
  - the credits used;
  - what the Fix pipeline flow did on at least one failing MR pipeline;
  - a keep or drop recommendation.

## Metric and threshold

**Metric.** The unit is one thread the Duo review opens on an RFW MR between
2026-10-13 and 2026-11-10: a diff note or an MR note from the Duo reviewer.
- **Led to a change:** a commit pushed to the MR after the comment changes the
  lines (or, for a file-level comment, the file) it is about.
- **Dismissed:** resolved without such a commit, or still open when the MR
  merged. Record the reason when a reply gives one.
- **Not counted:** threads on MRs that were closed without merging.

**Threshold, proposed 2026-10-13, for the maintainer to confirm by merging this:**
- **Keep** when at least 40% of counted threads led to a change, over at least 30
  threads.
- **Not enough data:** with fewer than 30 threads on 2026-11-10, extend the pilot
  by two weeks instead of deciding.
- **Basis:** 40% sits between the published resolution rates of an AI reviewer
  (38.7%) and human reviewers (44.5%) in Atlassian's study. A study of 31,000
  CodeRabbit comments found 56% rejected.

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

- Pilot project: https://gitlab.com/greenberrynl/refugeework/website
- The competing AI review job:
  https://gitlab.com/greenberrynl/refugeework/website/-/merge_requests/383
- [feat-pipeline-triage.md](feat-pipeline-triage.md)
- [../../skills/code-review/SKILL.md](../../skills/code-review/SKILL.md)
- https://docs.gitlab.com/user/duo_agent_platform/flows/foundational_flows/code_review/
