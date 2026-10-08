---
name: backlog
description: Draft or update a backlog item in docs/backlog by following the project's backlog rules, existing specs, and codebase context. Use when the user asks to create, write, refine, or update a backlog item, feature story, bug item, task, or local BLI.
metadata:
  owner: wieteke.pots
---

# Backlog Skill

Use this skill when the user asks to create, draft, refine, or update a
backlog item.

This skill is the canonical workflow source for backlog work on skill-aware
tools. The matching command runbook is a compatibility and fallback surface.

## Scope — local file, not a tracker ticket

This skill writes **only** the local backlog file under `docs/backlog/`. It never
creates, edits, or transitions an issue-tracker ticket.

- Need a Jira issue (bug, story, task)? That is `skills/jira-ticket` — the one
  skill sanctioned to write to the tracker.
- Need both? Create the ticket first with `skills/jira-ticket`, then run this
  skill with the real ticket key so the local item and the tracker agree.
- Given a ticket key, treat the tracker as read-only context here.

## One item is one MR

An item is not a ticket. It is what **one reviewable MR** delivers, so a ticket
whose MR would be too large gets several items — slices — and `rules/mr-sizing.md`
decides where the cuts go.

This is blocking, not advisory: an item that trips a split trigger in that rule
may not be written as one item, and may not be marked `ready`. Slicing here costs
a sentence; slicing after the branch exists costs a rebase.

When `docs/journeys/` exists, the journey document's **Slice Candidates** table is
the input — one item per candidate, in its order, each `Depends on:` the previous
one. Do not re-cut those boundaries silently; if a candidate is wrong, say why and
propose the new cut.

## Context To Load

1. Read `rules/backlog.md` and `rules/mr-sizing.md`.
2. Read `CONVENTIONS.md` for project-specific filename and tracker-key rules.
3. If present, inspect `docs/backlog/_template.md` and keep it aligned with the
   backlog rules rather than treating it as a competing source of truth.
4. Read only the local specs, backlog items, and code paths relevant to the
   requested item.
5. When `docs/solutions/` exists, check it for prior lessons in the item's
   area and reference the relevant note under `## Related`.

## Workflow

1. Determine whether the user wants to create a new item or update an existing
   one.
2. Infer the ticket key, item type, and title from the user request, current
   docs, or linked tracker context. Do not invent ticket keys when the project
   expects a real one.
3. Search `docs/backlog/` for an existing file for the same ticket or scope
   before creating a new file — including **untracked** files
   (`git status --porcelain docs/backlog/`) and a parallel session's branch or
   worktree on the slug (`git worktree list`, `git branch --list '*<slug>*'`).
   An item another session is still writing is updated additively and left
   uncommitted; never commit, rename or move it on that session's behalf.
4. Ground the item in the codebase and local docs so the acceptance criteria and
   technical notes are specific. Three sources come first, before anything is
   measured or designed:
   - **A reference implementation**, when the ticket, an ADR or the client names
     one (a proof of concept, a sandbox, an existing app): drive it and capture
     what it requests and what it shows. It points at the fields and parameters
     worth measuring. It is not a spec — check its choices against the API,
     because a reference can send parameters the API silently ignores.
   - **Conventions that fire on touching a file** (convert on touch, co-located
     tests, a migration per schema change): run every file the item will touch
     past them in `CONVENTIONS.md`. They change scope and size, and a
     refinement that skips them gets redone. Measure the cost when that is
     cheap — rename the file, run the type checker, revert — instead of
     estimating it.
   - **The current tree, for a later slice**: an item written before the
     preceding slice merged describes the old tree. Re-check its file names,
     inventories and counts against the default branch and correct the item.
5. Write or update the backlog item in `docs/backlog/` using the structure from
   `rules/backlog.md`.
6. For a **bug** item, fill `## Reproduction` with the shortest path that shows
   the defect — a function call on a fixture when there is one, otherwise the
   route, role and input. Make a fair attempt, then stop: when no reliable path
   turns up, record what was tried in that section instead of omitting it.
   `skills/jira-ticket` applies the same rule to the tracker ticket.
7. When the item is a correction/sub-ticket, use the minimal fix format from
   the backlog rules.
8. Keep acceptance criteria PO-friendly and move implementation detail into
   `Technical Notes`.
9. **Check the size before finishing.** Run the item past the split triggers in
   `rules/mr-sizing.md`. Too big → write it as several slices instead: number
   them in the filename, fill the `Slice` field, chain them with `Depends on:`,
   and say in the recap why the cut sits there. Leave `How to verify` empty —
   whoever delivers the item fills it before the MR opens.
10. If the request changes the reusable template, update `docs/backlog/_template.md`
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

- The backlog file path(s) that were created or updated — one line per slice when
  a ticket produced several, with the dependency order.
- Any assumptions that still need PO or developer confirmation.
- Whether the local backlog template was also updated for consistency.
