---
name: close-sprint
description: Close out a sprint by reading issue-tracker tickets on the user's name, verifying code delivery, and producing a sprint changelog, a gaps/spillover document, and moving delivered backlog items into a dedicated sprint folder. On projects without sprints the same close runs in support mode over a calendar month, archiving delivered backlog items into docs/support-<yyyy>-<mm>/. The tracker is read-only, and the sprint in the tracker is closed by the user, never by this skill. Use when the user asks to close, finalize, or wrap up a sprint or a support month ("sprint sluiten", "close support month", "support maand afsluiten"), including a request to close or complete the sprint in Jira or another tracker.
metadata:
  owner: wieteke.pots
---

# Close Sprint Skill

Use this skill when the user asks to close, finalize, or wrap up a sprint.

The canonical step-by-step runbook lives at `commands/close-sprint.md`. This
skill is a thin wrapper around that runbook so Codex and Claude Code share the
same workflow; Copilot follows the runbook directly.

## Workflow

1. Read `commands/close-sprint.md` (project root, or the synced `commands/` dir).
2. On projects without sprints, run the runbook in **support mode** (see its
   "Support mode" section): the close window is a calendar month and every
   `sprint-<N>` artifact maps to `support-<yyyy>-<mm>` (e.g. `support-2026-08`).
3. Follow every phase in order. Start with Phase 0 (switch to an up-to-date
   integration branch) and do not skip Phase 6 (review pause).
4. A live tracker connection is mandatory. CLI first: `jira`
   (`ankitpokhrel/jira-cli`; verify with `jira me`, recipes in
   `skills/service-cli/references/jira.md`). The tracker's connector only when
   the CLI is not installed and cannot be installed now — say so in the recap.
   If neither connects, stop and help the user connect — never close a sprint
   on local docs alone.
5. When the sprint's changelog is already on the integration branch and the
   request is about the tracker sprint, do not rerun the phases: say the repo
   close is done, list which tickets a tracker close would carry out of the
   sprint, and leave that close to the user.

## Constraints

- Always run from an up-to-date integration branch (`development` by default):
  check it out and fast-forward before any analysis. A feature branch is ahead
  of the integration branch and misclassifies delivered vs spillover work.
- Run in the user's own checkout, never in a worktree you create: the user
  edits the changelog, the gaps document and the moved BLIs in their editor
  during the review. A dirty tree is a question to ask, and a project habit of
  committing from worktrees does not apply to a close. The background-run
  fallback below is the only exception.
- After the BLI moves, sweep the relative links they broke in both directions
  (runbook Phase 5): links into `docs/backlog/` from ADRs, todos and the
  backlog index, and sibling links between moved and staying items.
- The issue tracker is **read-only**. No comments, transitions, edits, or
  assignments, and never close the sprint in the tracker: the user does that.
  A tracker-write go the user gives during or after the close covers the
  writes it names, never the sprint close. Report instead which tickets a
  tracker close would carry out of the sprint: those outside the board's Done
  column, since only the last column counts as complete.
- Name the system in every sentence where both closes come up ("in Jira", "in
  de repo"). "Sprint sluiten" on its own reads as this skill's close; a
  question that left it open once got the tracker sprint closed on that
  misread.
- Never run `git commit` — the user commits themselves (sole exception: the
  worktree hand-off commit under "Background runs" below).
- Use `git mv` when relocating BLIs so history is preserved.
- Clear out the sprint's working documents at close (runbook Phase 5b): the
  planning and refinement documents, plus a project's own tracker, journal or
  spike notes under any spelling of the sprint folder. Ephemeral ones go; a
  file that code, tests or config reference is never removed — it is recorded
  in the gaps document with a proposed permanent home.
- Flatten a sprint demo folder (`docs/demo/sprint-<N>/`) into
  `docs/sprint-<N>/demo.md` and delete the folder (runbook Phase 5c). Git does
  not track it, so ask first, and never offer a commit to keep the deck. Never
  delete the only copy of the shared pptx: when the destination the runsheet
  names does not hold it, move it to a place the user names.
- Stop and ask whenever classification is ambiguous.
- Populate `## Authors` on every moved BLI using the tracker assignee plus git
  commit authors. Deduplicate; never remove existing entries.
- The gaps document is a convergence artifact: when the user comments on
  `docs/sprint-<N>-gaps.md`, apply the decision, propagate it to the BLI and the
  changelog, and remove the resolved entry — so the final gaps document holds
  **only** genuine spillover and open actions for the sprint being closed.

## Background runs (Claude Code)

Background sessions may refuse Edit/Write in the shared checkout until the
session isolates itself ("call EnterWorktree first" guard). Only when that
guard is active — never in an interactive session — pick the route **before
Phase 1**, not at the first write, after the analysis is already done:

- Do not try to lift the guard from inside the session. The opt-out flag
  (`"worktree": { "bgIsolation": "none" }` in `.claude/settings.json`) is
  unreachable: the guard blocks that settings edit itself and the permission
  classifier blocks the shell fallback. Only the user can set it — don't spend
  a user round-trip discovering this.
- Working fallback that keeps "the user commits themselves" intact: call
  EnterWorktree, run every phase inside the worktree (doc edits and `git mv` —
  the renames survive the hand-off), and make **one docs-only commit** on the
  worktree branch. That hand-off commit is the sole exception to the
  never-`git commit` constraint; the user's own checkout still receives no
  commit.
- Hand the user `git cherry-pick -n <sha>`: it applies the full change,
  including the BLI moves, staged but uncommitted in their checkout, so they
  review and commit themselves. Do not push the hand-off branch — the branch
  ref outlives the worktree, so nothing is lost when the worktree is removed.

## Inputs to confirm before starting

- Sprint name or id (e.g. `Sprint 2`) — or, in support mode, the month to
  close (e.g. `2026-08`; default: the previous calendar month)
- Assignee email (default: configured tracker user, verify with `jira me`)
- Issue-tracker project key (infer from filenames, e.g. `RFW`)

## Output

A changelog at `docs/sprint-<N>-changelog.md` following the "Changelog
template" section of the runbook, a gaps document at `docs/sprint-<N>-gaps.md`
(including the Phase 8 stale-branch and worktree overview), delivered BLIs
relocated to `docs/sprint-<N>/` with updated status and authors, the sprint's
ephemeral working documents removed and listed under the changelog's
`## Archief`, the sprint demo flattened into `docs/sprint-<N>/demo.md` when a
demo folder exists, and a list of spillover items prepared for the Phase 7
walkthrough. In support mode the same
outputs land at the `docs/support-<yyyy>-<mm>` equivalents.

Closed sprint folders are compacted by `skills/compact-sprint` — a separate,
explicitly invoked lane with its own retention guard; never compact as part of
the close.

The changelog is internal. Notes the customer reads are another separate,
explicitly invoked lane: `skills/release-notes` takes the changelog's
`Opgeleverd` rows as its first source, so name it in the wrap-up.

In a project created from unicore-template (`.unicore.json`, or
`scripts/husky/readme-checks.js` for a v3 project), check whether the sprint's
merged changes touched the template's `owned` globs (`skills/upstream-to-unicore`
Step 1 says where to read them). When they did, name the files in the wrap-up
and propose `skills/upstream-to-unicore` as a harvest over the sprint's range.
It is a proposal, like the release-notes hand-off.

## Cleanup safety

Phase 8 only surfaces candidates. Never run `git branch -d`, `git branch -D`, or
`git worktree remove` without explicit per-item user approval.

Always exclude protected branches from the cleanup overview entirely: `main`,
`master`, `development`, `acceptance`, `staging`, `production`, and the currently
checked-out branch. Never list or suggest actions for them.
