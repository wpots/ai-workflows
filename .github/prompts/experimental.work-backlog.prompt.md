---
name: experimental.work-backlog
description: "Work Backlog Runbook"
---

# Work Backlog Runbook

> Fallback runbook for tools without skill support. The canonical source is
> `skills/experimental.work-backlog/SKILL.md`.

Deliver **one** backlog item from `docs/backlog/` end-to-end: pick → branch →
implement → verify → merge request. Stop after one MR; humans review and merge.

## Hard rules

1. One MR per run.
2. Never commit or push to `main`; all work on a feature branch.
3. WIP limit 1 — an open MR from a previous run means stop and report.
4. The BLI's acceptance criteria are the definition of done; no scope invention.
5. Checks green before the MR opens; otherwise a **draft** MR listing blockers.
6. Blocked steps (missing secrets, human-only actions) are reported, not
   silently skipped.

## Steps

1. **Sync** — `git fetch origin && git checkout main && git pull --ff-only`.
   Refuse on a dirty tree.
2. **WIP check** — `glab mr list --state opened` (or `gh pr list`); stop if an
   open MR maps to a backlog item. Flag orphaned work-backlog branches.
3. **Pick** — first `docs/backlog/*.md` with `Status: ready` whose
   `Depends on:` BLIs are `done` on `origin/main`; order by roadmap number,
   then priority, then filename. None eligible → report why per item, stop.
4. **Branch** — project convention (Greenberry: `epic-lowercase/short-slug`,
   e.g. `session/create-join-room`). First commit flips the BLI to
   `in-progress`.
5. **Implement** — read the BLI and every doc it links first; follow
   `CONVENTIONS.md` + `rules/`; write the tests the BLI names; keep the diff
   scoped to this item.
6. **Verify** — full check suite (lint, typecheck, tests, build, a11y/E2E
   where configured). Never weaken checks to get green.
7. **Self-review** — review the branch diff, fix findings, re-run checks if
   needed.
8. **Close out** — flip the BLI to `done`; after the MR exists, append its URL
   to the BLI's `## Related` and push.
9. **MR** — follow `commands/create-pr.md` (rebase onto base, MR template);
   title conventional; description links the BLI and maps the diff to its
   acceptance criteria; draft + "Blocked on" section when rule 5/6 applies.
   Autonomous run: skip the interactive approval pause.
10. **Notify** — rely on the repo's GitLab→Slack integration if configured;
    else post the MR link to the merge-request channel if a Slack tool is
    available; else note it in the report.
11. **Report** — item + why it was next, branch, MR URL, check results,
    acceptance-criteria coverage, review pointers, anything blocked.

## Edge cases

Malformed BLI → skip and flag. Dependency cycle → report, stop. Nothing
eligible → say so. `main` already red → report, stop (not this run's scope).
