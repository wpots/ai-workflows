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

State on 2026-10-14:
- **Instructions on since 2026-10-14, 05:31 UTC.** The maintainer selected
  [`greenberrynl/duo-review-instructions`](https://gitlab.com/greenberrynl/duo-review-instructions)
  as the group's review-instructions project. The group audit log shows the
  Duo settings save by wieteke.pots at that time, the only one after the
  project existed. Count threads opened before this moment as "without
  instructions", and later ones as "with instructions".
- **Duo reviewer username: `GitLabDuo`.** The count filters on it. The smoke
  test passed on RFW !529 (2026-10-13, 14:46 UTC, without instructions). The
  review left one summary note, which is not resolvable and not counted, and
  one diff thread (`as const` for `COVER_IMAGE_MIME_TYPES`), which is the first
  counted thread. !527 and !528 got no Duo review.
- **Fix pipeline flow on since 2026-10-13, 16:26 UTC.** It is enabled at group
  level, and GitLab auto-provisioned the service account
  `duo-fix-ci-cd-pipeline-greenberry`.
- **A competing AI reviewer is waiting.** RFW !383 (sander.bruggeman,
  2026-07-22, idle since) adds an AI review job through OpenRouter. Keep it
  unmerged until 2026-11-10, so that only one AI reviewer comments.
- **RFW is also the CI v4 canary** (`ci-components` DEV-659). Expect pipeline
  changes during the pilot. Note them when judging the Fix pipeline flow.

State on 2026-10-20:
- **The model was pinned to Claude Sonnet 4.5 until 2026-10-20, 12:36 UTC.**
  The group's model selection for `review_merge_request_dap` (the Code Review
  Flow) held Claude Sonnet 4.5 (Anthropic), so every review before this moment
  ran on that model, not on GitLab's default. The audit log has no event for
  that feature. The maintainer pinned the classic `review_merge_request` to
  Sonnet 4.5 on 2026-01-30, and that pin most likely carried over (unverified).
  The pin is now reset to GitLab's default, Claude Sonnet 5.5 (Gemini
  Enterprise Agent Platform); the audit log records the reset.
  `duo_agent_platform` and `duo_developer` stay pinned to GPT-5.2 since
  2026-01-30. Which feature drives the Fix pipeline flow is not checked.
- **Instructions v2 since 2026-10-20, 12:39 UTC**
  ([`cf38999f`](https://gitlab.com/greenberrynl/duo-review-instructions/-/commit/cf38999f9d4dce4c56d87f7edb6115ecea44bfc6)).
  "How to review" sets the bar before the checklist, from the first week's
  misses: zero findings is normal, comment only with a concrete failing input
  or a broken rule line, never report a file as missing, ask instead of
  asserting how a language behaves, skip the wording of an accurate comment and
  annotation preferences, do not propose hardening, and answer a clean MR with
  "No findings." only.
- **Interim count on RFW, 2026-10-13 to 2026-10-20** (all MRs labelled
  `ai:agent-authored` except !537, so most had a local review first):
  4 threads. 2 led to a change: !529 (`as const`, a nit) and !535 (indexing
  after `isObject`). 2 are open on !483: a try/catch that logs and continues,
  proposed under the "errors swallowed silently" rule, and a comment-wording
  nit that Duo itself calls accurate. 9 reviews on 8 MRs found nothing and
  posted "Nice work! :tada:" with praise bullets plus an approval. The
  follow-up notes on !529 contradict each other on whether `as const` was
  applied.
- **iAmsterdam, outside this spike, for reference.** Automatic reviews are on
  for `amsterdam-en-partners/iamsterdam-website` and `webflow/klimaatweek-api`.
  On iAmsterdam (MRs written by people, so without a local review), 8 threads
  from 2026-10-14 to 2026-10-20: 2 led to a change, both on !1701 (`months:
  null` broke the free-months label, a bug that predates the MR; missing story
  tests). 2 were wrong: !1702 reported `package-lock.json` missing from the
  diff and requested changes on a critical update, and !1700 called `0` falsy
  in Sass. 4 were resolved without a change (!1699 ×3, the !1701 locale nit).
- **Settings drift, unexplained.** `auto_duo_code_review_enabled` reads `false`
  on RFW and on the group, yet the RFW audit log shows a Duo Code Review session
  on every MR through 2026-10-20 and no settings event since 2026-10-13.

Filed 2026-10-08 from the October 2026 stack review (task T5, re-scoped from
"build a CI agent lane" to "configure and measure the platform's own").

## Ticket

[Audit 2026-10](../audits/2026-10.md) — roadmap item 5

## Priority

medium

## Summary

GitLab's Code Review Flow reviews merge requests with an agent, is configured from
files in the repo, and has defaulted to Claude Sonnet 5.5 since 2026-10-05 (a
group's model pin overrides that, see Status). Switch it on for
one client project for four weeks, give it the lenses of `skills/code-review`, and
measure whether its comments get acted on, before building any review lane of our own.

## User Story

As the maintainer, I want evidence on whether the platform's review flow earns its
place next to the local `code-review` skill, so that we do not build a second one.

## Acceptance Criteria

- One client project is named and the flow is enabled for it (a GitLab setting,
  done by the maintainer). Done 2026-10-13: RFW, with automatic reviews.
- The review lenses from `skills/code-review` reach the flow through
  group-level review instructions: `.gitlab/duo/mr-review-instructions.yaml` in
  [`greenberrynl/duo-review-instructions`](https://gitlab.com/greenberrynl/duo-review-instructions),
  selected as the template project under `greenberrynl` > Settings > GitLab Duo
  > Change configuration > **Customize code review** (Owner of the top-level
  group). Done: the file has been in place since 2026-10-13, and the group setting
  since 2026-10-14. A project adds its own
  `.gitlab/duo/mr-review-instructions.yaml` only for what is specific to it.
- On the first review after the group setting is on, check that Duo used the
  linked rules. Each entry links its rule file in `config/ai-workflows`, a
  private repository, with a `/-/blob/main/` URL, and the docs do not say
  whether a review of another project in the group can read it. If it cannot,
  drop the links; the entries already carry the review-critical points.
- The metric and the threshold are written down before the first review (below).
  The metric counts resolved threads, not thumbs up or down.
- After four weeks, a short report in `docs/` gives:
  - the number of comments, before and after the instructions file;
  - how many led to a change and how many were dismissed, and why;
  - the credits used;
  - what the Fix pipeline flow did on at least one failing MR pipeline;
  - a keep or drop recommendation.

## Metric and threshold

**Metric.** The unit is one resolvable thread that `GitLabDuo` opens on an RFW
MR between 2026-10-13 and 2026-11-10. The review's summary note is not
resolvable and does not count.
- **Led to a change:** a commit pushed to the MR after the comment changes the
  lines (or, for a file-level comment, the file) it is about.
- **Dismissed:** resolved without such a commit, or still open when the MR
  merged. Record the reason when a reply gives one.
- **Not counted:** threads on MRs that were closed without merging.
- **Periods:** report three periods separately: without instructions (until
  2026-10-14, 05:31 UTC), instructions v1 on Claude Sonnet 4.5 (until
  2026-10-20, 12:36 UTC), and instructions v2 on GitLab's default model (from
  2026-10-20, 12:39 UTC).

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
  keys `instructions`, `name`, `fileFilters` and nothing else. Read
  2026-10-13 (https://docs.gitlab.com/user/duo_agent_platform/customize/review_instructions/):
  - **Group level** since GitLab 19.0 (Premium): the top-level group names a
    template project, and its instructions apply to every project in the group
    and its subgroups, combined with the project's own file. The template
    selector only offers projects directly under the top-level group, so
    `config/ai-workflows` could not be selected (2026-10-13; the docs do not
    say so, gitlab-org/gitlab#600695 does). Hence the separate project
    `greenberrynl/duo-review-instructions`.
  - **References** to other files go inside the `instructions` text: a
    repository-relative path for the same project, or a full
    `/-/blob/<ref>/<path>` URL on the same instance. Resolution is best effort,
    and the Code Review Flow reads a summary, not the original file.
  - **Code Review Flow does not read `AGENTS.md`**; Chat and the other flows do
    (https://docs.gitlab.com/user/duo_agent_platform/customize/agents_md/).
- **Model selection.** An Owner of the top-level group can pin a model per
  feature, and a pin does not follow GitLab's model updates. The Code Review
  Flow is the feature `review_merge_request_dap` ("Agentic Code Review" in the
  UI). Read it with
  `glab api graphql -f query='{ aiModelSelectionNamespaceSettings(groupId: "gid://gitlab/Group/4848933") { nodes { feature selectedModel { ref name } defaultModel { ref name } } } }'`;
  a `selectedModel` that is `null` or has an empty `ref` means GitLab's default.
  Reset a pin with the mutation `aiModelSelectionNamespaceUpdate`
  (`features: [REVIEW_MERGE_REQUEST_DAP], offeredModelRef: ""`).
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

Check, in the same pilot, what the Fix pipeline flow does on a failing MR pipeline.
It replaced our own pipeline-triage skill, superseded on 2026-10-15. The verdict
here is half of that skill's reopen condition (`docs/pipeline-map.md`, gap 3).

## Out of Scope

- Building a headless review job in our own CI.
- Rolling the flow out to other projects.

## Related

- Pilot project: https://gitlab.com/greenberrynl/refugeework/website
- The competing AI review job:
  https://gitlab.com/greenberrynl/refugeework/website/-/merge_requests/383
- [../../skills/code-review/SKILL.md](../../skills/code-review/SKILL.md)
- https://docs.gitlab.com/user/duo_agent_platform/flows/foundational_flows/code_review/
