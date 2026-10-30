---
name: sprint-planning
description: Plan the upcoming sprint by reading the issue tracker for tickets on the user's name, carrying in spillover from the closed sprint, mapping dependencies across the whole sprint, checking realism against velocity and capacity, and producing a planning document with a proposed execution order. Creates missing BLIs, flags doc/tracker mismatches, and marks planned BLIs. The tracker is read-only. Use when the user asks to plan a sprint, start a sprint, or plan the upcoming sprint.
metadata:
  owner: wieteke.pots
---

# Sprint Planning Skill

Use this skill when the user asks to plan a sprint, start a sprint, or plan the
upcoming sprint.

The canonical step-by-step runbook lives at `commands/sprint-planning.md`. This
skill is a thin wrapper around that runbook so Codex and Claude Code share the
same workflow; Copilot follows the runbook directly.

This flow is **forward-looking only** — it plans the next sprint. The
retrospective is the `close-sprint` flow; its changelog and gaps document are
**inputs** here, not something this skill reproduces.

## Workflow

1. Read `commands/sprint-planning.md` (project root, or the synced `commands/`
   dir). Use `skills/sprint-planning/templates/planning-template.md` and
   `templates/refinement-template.md` as the skeletons for the two output docs.
2. Follow the phases in order. Do not skip the Phase 7 review pause. After it,
   offer the ready check (`skills/backlog`, Ready check) over the sprint's
   planned items; it runs on the user's yes.
3. A live tracker connection is mandatory (Phase 0). CLI first: `jira`
   (verify with `jira me`, recipes in `skills/service-cli/references/jira.md`);
   the tracker's connector only when the CLI is not installed and cannot be
   installed now — say so in the recap. If neither connects, stop and help the
   user connect — never plan a sprint on local docs alone.
4. Before writing anything, switch to the `development` branch (Phase 0) and pull
   the latest — docs must land on the integration branch, not a feature branch.
   If the working tree is dirty, stop and ask before switching.
5. If the just-closed sprint has not been closed yet (no gaps document), say so
   and offer to run `close-sprint` first; never reconstruct the retrospective
   inside this flow.

## Constraints

- The issue tracker is **read-only**. No comments, transitions, edits,
  assignments, fixVersion, sprint field, or story points.
- "Planned for Sprint N" is a **note** under the BLI's status value — it never
  replaces the value, and it is never a tracker mutation. If a ticket is not
  yet assigned to the sprint in the tracker, flag it.
- Plan only the tickets **on the user's name** in detail, but map dependencies
  across the whole sprint (blocks / is-blocked-by), and surface external
  blockers.
- Realism is measured against **velocity** (delivered SP last sprint) and
  **capacity** (available working days, ×1.5 buffer when reasoning in time).
- Missing BLIs are created from `docs/backlog/_template.md` per `rules/backlog.md`
  (note migration expectation). Existing-doc mismatches are **flagged, never
  silently rewritten** — material rewrites belong to refinement.
- Never run `git commit` — the user commits themselves.
- Write docs on the `development` branch (the main integration branch), never on
  a feature branch. Switch before writing; if the tree is dirty, stop and ask.
- Planned BLIs stay in `docs/backlog/`. The skill creates the sprint folder
  `docs/sprint-<N>/` (with a `.gitkeep`); a BLI moves into it in the commit
  that sets it to `done` (`rules/backlog.md`), and `close-sprint` moves the
  stragglers.
- Stop and ask when a ticket is ambiguous or empty; do not invent scope.

## Output

Written to `docs/sprint-<N>-planning.md`, plus:

- BLIs created for any planned ticket missing a doc.
- Planned BLIs carry `Planned for Sprint <N>.` as a note under their status
  value.
- The sprint folder `docs/sprint-<N>/.gitkeep`, where done BLIs land during
  the sprint.
- `docs/sprint-<N>-refinement.md` when any ticket in the sprint (sprint-wide,
  not only the user's) has no story points in the tracker: a table of those
  tickets (`Ticket | Summary | Status | Proposed SP | Rationale`) plus a short
  action list for the refinement session. Proposals stay in the doc — the
  tracker remains read-only. **Unsized tickets get no row in the planning
  doc's planned-tickets table** — they live only in the refinement doc, and the
  planning doc carries one reference line naming them and pointing there.
- A planning document with: TL;DR decisions, planned-ticket table (spillover
  marked), dependency map, realism verdict (planned SP vs velocity vs capacity),
  proposed execution order with per-item rationale, doc actions, and local
  anchors.
- A list of flags awaiting a user decision: doc ↔ tracker mismatches, external
  blockers, unplanned spillover, unsized tickets, and stories that fail a line
  of `rules/ticket-flow.md` § Definition of Ready, each with the line it fails.
  Bugs, tasks and support tickets are not held against that list.
- The offer to run the ready check over the planned items.
