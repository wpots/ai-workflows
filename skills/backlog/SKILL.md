---
name: backlog
description: Draft or update a backlog item in docs/backlog by following the project's backlog rules, existing specs, and codebase context. Use when the user asks to create, write, refine, or update a backlog item, feature story, bug item, task, or local BLI.
---

# Backlog Skill

Use this skill when the user asks to create, draft, refine, or update a
backlog item.

This skill is the canonical workflow source for backlog work on skill-aware
tools. The matching command runbook is a compatibility and fallback surface.

## Context To Load

1. Read `rules/backlog.md`.
2. Read `CONVENTIONS.md` for project-specific filename and tracker-key rules.
3. If present, inspect `docs/backlog/_template.md` and keep it aligned with the
   backlog rules rather than treating it as a competing source of truth.
4. Read only the local specs, backlog items, and code paths relevant to the
   requested item.

## Workflow

1. Determine whether the user wants to create a new item or update an existing
   one.
2. Infer the ticket key, item type, and title from the user request, current
   docs, or linked tracker context. Do not invent ticket keys when the project
   expects a real one.
3. Search `docs/backlog/` for an existing file for the same ticket or scope
   before creating a new file.
4. Ground the item in the codebase and local docs so the acceptance criteria and
   technical notes are specific.
5. Write or update the backlog item in `docs/backlog/` using the structure from
   `rules/backlog.md`.
6. When the item is a correction/sub-ticket, use the minimal fix format from
   the backlog rules.
7. Keep acceptance criteria PO-friendly and move implementation detail into
   `Technical Notes`.
8. If the request changes the reusable template, update `docs/backlog/_template.md`
   so it stays consistent with the current backlog rules.

## Constraints

- Always persist backlog work to a file; do not leave it only in chat.
- Update existing items instead of creating duplicates when the scope already
  exists.
- Prefer the project's tracker key and filename conventions when they are stricter
  than the shared backlog rule.
- Do not track implementation progress via a local `Status` section unless the
  project-specific rules explicitly require it.
- Do not move backlog files between folders; relocation belongs to the
  `close-sprint` workflow.

## Output

- The backlog file path that was created or updated.
- Any assumptions that still need PO or developer confirmation.
- Whether the local backlog template was also updated for consistency.
