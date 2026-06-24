---
name: refinement
description: Prepare and record a backlog refinement by reading issue-tracker tickets, grounding them in the codebase, and producing a single decision-ready refinement document (grouping, story-point proposals, conflicts, per-ticket questions). Has a prep mode (before the session) and an outcome mode (after). The tracker is read-only. Use when the user asks to prepare a refinement, refine tickets, or record refinement outcomes.
---

# Refinement Skill

Use this skill when the user asks to prepare a refinement, refine a set of
tickets, or record what was decided in a refinement session.

The canonical step-by-step runbook lives at `commands/refinement.md`. This skill
is a thin wrapper around that runbook so Codex, Cursor, and Claude Code share
the same workflow; Copilot follows the runbook directly.

## Workflow

1. Read `commands/refinement.md` (project root, or the synced `commands/` dir).
2. Determine the mode — **prep** (before the session) or **outcome** (after) —
   from the user or by checking whether `docs/plans/refinement-<today>.md`
   already exists.
3. Follow the phases in order. Do not skip the Phase 4 review pause in prep mode.
4. A live tracker connection is mandatory (Phase 0). Use the most efficient
   method available: the tracker's MCP connector if connected, otherwise its
   CLI. If neither connects, stop and help the user connect — never refine on
   local docs alone.

## Constraints

- The issue tracker is **read-only**. No comments, transitions, edits,
  assignments, or story points.
- Story points are **proposed in the doc only** — the user sets them in the
  tracker.
- Story-point scale: small change = 1, 13+ = split.
- Never run `git commit` — the user commits themselves.
- Ground every question in the code first (Phase 2); never ask about something
  the codebase already answers.
- Note per ticket whether a DB migration and/or data-layer access-rule change is
  expected.
- Stop and ask when a ticket is empty or ambiguous; do not invent scope.

## Output

A single refinement document at `docs/plans/refinement-<YYYY-MM-DD>.md`:

- **prep mode** — grouping, story-point proposals, conflicts, per-ticket
  question list, cross-ticket questions, local anchors.
- **outcome mode** — the same doc rewritten as a "decided / changed / still
  open" record, with rescoped tickets flagged for re-sizing.

BLI drafting/updates (`docs/backlog/`, per `rules/backlog.md`) happen only on
explicit request; this skill does not move or relocate BLIs.
