---
name: close-sprint
description: Close out a sprint by reading issue-tracker tickets on the user's name, verifying code delivery, and producing a sprint changelog, a gaps/spillover document, and moving delivered backlog items into a dedicated sprint folder. On projects without sprints the same close runs in support mode over a calendar month, archiving delivered backlog items into docs/support-<yyyy>-<mm>/. The tracker is read-only. Use when the user asks to close, finalize, or wrap up a sprint or a support month ("close support month", "support maand afsluiten").
---

# Close Sprint Skill

Use this skill when the user asks to close, finalize, or wrap up a sprint.

The canonical step-by-step runbook lives at `commands/close-sprint.md`. This
skill is a thin wrapper around that runbook so Codex, Cursor, and Claude Code
share the same workflow; Copilot follows the runbook directly.

## Workflow

1. Read `commands/close-sprint.md` (project root, or the synced `commands/` dir).
2. On projects without sprints, run the runbook in **support mode** (see its
   "Support mode" section): the close window is a calendar month and every
   `sprint-<N>` artifact maps to `support-<yyyy>-<mm>` (e.g. `support-2026-08`).
3. Follow every phase in order. Start with Phase 0 (switch to an up-to-date
   integration branch) and do not skip Phase 6 (review pause).
4. A live tracker connection is mandatory. Use the most efficient method
   available: the tracker's MCP connector if connected, otherwise its CLI (e.g.
   `ankitpokhrel/jira-cli`). If neither connects, stop and help the user connect
   — never close a sprint on local docs alone.

## Constraints

- Always run from an up-to-date integration branch (`development` by default):
  check it out and fast-forward before any analysis. A feature branch is ahead
  of the integration branch and misclassifies delivered vs spillover work.
- The issue tracker is **read-only**. No comments, transitions, edits, or
  assignments.
- Never run `git commit` — the user commits themselves (sole exception: the
  worktree hand-off commit under "Background runs" below).
- Use `git mv` when relocating BLIs so history is preserved.
- Clear out the sprint's working documents at close (runbook Phase 5b): the
  planning and refinement documents, plus a project's own tracker, journal or
  spike notes under any spelling of the sprint folder. Ephemeral ones go; a
  file that code, tests or config reference is never removed — it is recorded
  in the gaps document with a proposed permanent home.
- Flatten a sprint demo folder (`docs/demo/sprint-<N>/`) into
  `docs/sprint-<N>/demo.md` and remove the folder (runbook Phase 5c); ask
  before removing one git does not track. Never delete the only copy of the
  shared pptx: when the destination the runsheet names does not hold it, move
  it to a place the user names.
- Stop and ask whenever classification is ambiguous.
- Populate `## Authors` on every moved BLI using the tracker assignee plus git
  commit authors. Deduplicate; never remove existing entries.
- The gaps document is a convergence artifact: when the user comments on
  `docs/sprint-<N>-gaps.md`, apply the decision, propagate it to the BLI and the
  changelog, and remove the resolved entry — so the final gaps document holds
  **only** genuine spillover and open actions for the sprint being closed.

## Background runs (Claude Code)

Background sessions may refuse Edit/Write in the shared checkout until the
session isolates itself ("call EnterWorktree first" guard). When that guard is
active, pick the route **before Phase 1** — not at the first write, after the
analysis is already done:

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

Sprint folders older than the previous sprint are compacted by
`skills/compact-sprint` — a separate, explicitly invoked lane; never compact
as part of the close.

The changelog is internal. Notes the customer reads are another separate,
explicitly invoked lane: `skills/release-notes` takes the changelog's
`Opgeleverd` rows as its first source, so name it in the wrap-up.

## Cleanup safety

Phase 8 only surfaces candidates. Never run `git branch -d`, `git branch -D`, or
`git worktree remove` without explicit per-item user approval.

Always exclude protected branches from the cleanup overview entirely: `main`,
`master`, `development`, `acceptance`, `staging`, `production`, and the currently
checked-out branch. Never list or suggest actions for them.
