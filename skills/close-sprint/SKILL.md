---
name: close-sprint
description: Close out a sprint by reading issue-tracker tickets on the user's name, verifying code delivery, and producing a sprint changelog, a gaps/spillover document, and moving delivered backlog items into a dedicated sprint folder. The tracker is read-only. Use when the user asks to close, finalize, or wrap up a sprint.
---

# Close Sprint Skill

Use this skill when the user asks to close, finalize, or wrap up a sprint.

The canonical step-by-step runbook lives at `commands/close-sprint.md`. This
skill is a thin wrapper around that runbook so Codex, Cursor, and Claude Code
share the same workflow; Copilot follows the runbook directly.

## Workflow

1. Read `commands/close-sprint.md` (project root, or the synced `commands/` dir).
2. Follow every phase in order. Do not skip Phase 6 (review pause).
3. A live tracker connection is mandatory. Use the most efficient method
   available: the tracker's MCP connector if connected, otherwise its CLI (e.g.
   `ankitpokhrel/jira-cli`). If neither connects, stop and help the user connect
   — never close a sprint on local docs alone.

## Constraints

- The issue tracker is **read-only**. No comments, transitions, edits, or
  assignments.
- Never run `git commit` — the user commits themselves.
- Use `git mv` when relocating BLIs so history is preserved.
- Stop and ask whenever classification is ambiguous.
- Populate `## Authors` on every moved BLI using the tracker assignee plus git
  commit authors. Deduplicate; never remove existing entries.

## Inputs to confirm before starting

- Sprint name or id (e.g. `Sprint 2`)
- Assignee email (default: configured tracker user, verify with `jira me`)
- Issue-tracker project key (infer from filenames, e.g. `RFW`)

## Output

A changelog at `docs/sprint-<N>-changelog.md`, a gaps document at
`docs/sprint-<N>-gaps.md` (including the Phase 8 stale-branch and worktree
overview), delivered BLIs relocated to `docs/sprint-<N>/` with updated status
and authors, and a list of spillover items prepared for the Phase 7 walkthrough.

## Cleanup safety

Phase 8 only surfaces candidates. Never run `git branch -d`, `git branch -D`, or
`git worktree remove` without explicit per-item user approval.

Always exclude protected branches from the cleanup overview entirely: `main`,
`master`, `development`, `acceptance`, `staging`, `production`, and the currently
checked-out branch. Never list or suggest actions for them.
