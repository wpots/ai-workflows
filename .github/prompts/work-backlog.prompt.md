---
name: work-backlog
description: "Work Backlog Runbook"
---

# Work Backlog Runbook

> Fallback runbook for tools without skill support. The canonical source is
> `skills/work-backlog/SKILL.md`.

Deliver **one** backlog item from `docs/backlog/` end-to-end: pick → branch →
implement → verify → merge request. Stop after one MR; humans review and merge.

## Hard rules

1. One MR per run.
2. Never commit or push to `main`; all work on a feature branch.
3. WIP limit 1 — advance the in-flight MR before starting anything new. An open
   MR from a previous run with unresolved reviewer comments: reworking it is
   this run's work. Awaiting review or blocked on a human: stop and report.
   Never open a second MR.
4. The BLI's acceptance criteria are the definition of done; no scope invention.
5. Checks green before the MR opens; otherwise a **draft** MR listing blockers.
6. Blocked steps (missing secrets, human-only actions) are reported, not
   silently skipped. Never add code whose only job is producing evidence for a
   criterion; let the evidence ride on the capability that needs it.

## Steps

1. **Sync** — `git fetch origin && git checkout main && git pull --ff-only`.
   Refuse on a dirty tree.
2. **WIP check** — `glab mr list` (or `gh pr list`; open is the default, and
   `glab mr list` has no `--state` flag). When an open MR maps to a backlog
   item, pick nothing new. Unresolved threads from a reviewer other than the
   MR author → rework that MR as this run's unit of work (the
   `skills/address-review-comments/SKILL.md` flow, no approval pause), resolve
   each thread you addressed, report, stop. No actionable comments → stop and
   report; when the MR reports `need_rebase` on a fast-forward project, rebase
   it server-side first (`PUT .../merge_requests/<iid>/rebase`) and wait for
   its pipeline. Flag orphaned work-backlog branches.
3. **Pick** — first `docs/backlog/*.md` with `Status: ready` whose
   `Depends on:` BLIs are `done` on `origin/main` (or `in-progress` with their
   MR merged and only a post-merge check left); order by roadmap number, then
   priority, then filename. None eligible → report why per item, stop.
4. **Branch** — project convention (Greenberry: `epic-lowercase/short-slug`,
   e.g. `session/create-join-room`). First commit flips the BLI to
   `in-progress`.
5. **Implement** — read the BLI and every doc it links first, and re-check its
   premises (file names, paths, counts) against the tree you branched from;
   follow `CONVENTIONS.md` + `rules/`; write the tests the BLI names; keep the
   diff scoped to this item.
6. **Verify** — full check suite (lint, typecheck, tests, build, a11y/E2E
   where configured). Never weaken checks to get green. Checks that only run
   in CI: open the MR as a draft with the close-out pushed, block in the
   foreground on its pipeline (poll the pipeline API; rerun the wait when the
   10-minute Bash cap expires), mark it ready only when green. Never hand back
   while a pipeline runs, and never wait with a background task — it dies with
   a subagent's run. A one-off transient job failure gets one
   `glab ci retry <job-id>`, not retry code.
7. **Self-review** — review the branch diff, fix findings, re-run checks if
   needed.
8. **Close out** — flip the BLI to `done`, or keep it `in-progress` when a
   criterion can only be checked after merge (name that check first in
   `How to verify`); a criterion left unticked in the MR keeps it
   `in-progress`. After the MR exists, append its URL to the BLI's
   `## Related` and push.
9. **MR** — follow `commands/create-pr.md` (rebase onto base, MR template);
   title conventional; description fills the resolved template's sections
   (`## Backlog`: BLI link + checked acceptance criteria; `## How to verify`:
   the BLI's steps; `## Scope`: slice status) — no invented headings; draft +
   "Blocked on" section when rule 5/6 applies. An MR created through
   `glab api` ignores a `draft` field: prefix the title with `Draft: `;
   `glab mr update <iid> --ready` drops it. Autonomous run: skip the
   interactive approval pause, but when the diff touches the UI still do the
   local handover (open the changed stories and a page in a browser the user
   sees) and end the report with the screenshot question.
10. **Notify** — rely on the repo's GitLab→Slack integration if configured;
    else post the MR link to the merge-request channel if a Slack tool is
    available; else note it in the report.
11. **Report** — item + why it was next, branch, MR URL, check results,
    acceptance-criteria coverage, review pointers, anything blocked.

## Edge cases

Malformed BLI → skip and flag. Dependency cycle → report, stop. Nothing
eligible → say so. `main` already red → report, stop (not this run's scope).
