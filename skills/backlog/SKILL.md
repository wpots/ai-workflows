---
name: backlog
description: Draft or update a backlog item in docs/backlog by following the project's backlog rules, existing specs, and codebase context, and check items against the Definition of Ready before they go into the loop. Use when the user asks to create, write, refine, or update a backlog item, feature story, bug item, task, or local BLI, or asks whether an item or a sprint's items are ready.
metadata:
  owner: wieteke.pots
---

# Backlog Skill

Use this skill when the user asks to create, draft, refine, or update a
backlog item, or asks whether items are ready to build.

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

## The same item in several repositories

When one request asks for the same change in more than one repository:

1. Check per repository that the problem exists before writing its item. A
   repository without it gets no item, and the recap says what was checked.
2. Write the **shared contract** once, before any item: every name, path,
   flag, default, file format and refusal that has to match across the
   repositories. Each item carries it verbatim in its `Technical Notes` under
   **Shared contract**, and the items link each other under `## Related`.
3. Ground, size and slice each item in its own repository. The slices may
   differ; the contract may not.

Writing the items in parallel subagents: give every subagent the same
contract in its prompt, and `model: sonnet` (left out, a subagent inherits
the session's model). Subagents that each design the mechanism for their
own repository come back with different script names, defaults and formats,
and aligning them afterwards means rewriting every file.

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
   `rules/backlog.md`. Resolve its filename from `## Ticket` using that rule's
   File Naming section. For an existing item with a real ticket key and a
   missing or wrong prefix, rename it in place and update links, `Depends on:`
   lines and other filename references. Before finishing, verify that every
   changed item's prefix matches its Ticket field and that the updated
   references resolve.
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
10. **Check that the criteria can all hold before marking the item `ready`.**
    Criteria that contradict each other surface mid-delivery, when whoever picks
    the item up has to rewrite the definition of done. Read the criteria against
    each other, `Out of Scope` and `Technical Notes`, and run what can be run:
    - A criterion that searches the tree ("prints nothing", "lists only", "no
      file names X") is run on the tree the item will be built on, and every
      hit that stays is named in the criterion. For a later slice that tree does
      not exist yet: read the preceding slice's criteria for what it leaves in
      place, because a line it keeps on purpose is the usual hit.
    - Two criteria that name the same file, string or section are read side by
      side. One that needs it gone and one that needs it present cannot both
      pass, and neither can a criterion that needs a file `Out of Scope`
      excludes.

    Fix the clash in the item when the intent is clear. When it is a real scope
    question, leave the status at `draft` and put the question to the
    maintainer. Same gate as the size check: an item that fails this may not be
    marked `ready`.
11. If the request changes the reusable template, update `docs/backlog/_template.md`
    so it stays consistent with the current backlog rules.
12. **End with the ready check** on every item this run wrote or updated
    (`references/ready-check.md`), so a fresh item states whether it is ready
    and what is missing. Steps 9 and 10 are its size and criteria points; do
    not run them twice.

## Ready check

Workflow step 12 runs it on the items just written. When the user asks whether
an item is ready — or a set: a sprint's items, every `draft` item ("is OBA-150
ready", "check readiness", "check de sprint") — follow
`references/ready-check.md` as well. It holds each item against the Definition
of Ready in `rules/backlog.md`, puts open product questions to the developer one
at a time, writes `Blocked on:` and `Next step:` lines on every item that is not
ready, and proposes the rest. The developer flips `ready`; the check never does,
because that flip is the gate after which `skills/work-backlog` builds the item
unattended.

## Constraints

- Always persist backlog work to a file; do not leave it only in chat.
- Update existing items instead of creating duplicates when the scope already
  exists.
- Prefer the project's tracker key and filename conventions when they are stricter
  than the shared backlog rule.
- Reusable naming-policy corrections belong in the canonical `ai-workflows`
  rules and skill, with the fallback command aligned. `CONVENTIONS.md` holds
  only project-specific requirements.
- `## Status` holds the status value and the ready check's notes, not a progress
  log: this skill writes `ready` only after the developer confirms it, and
  `in-progress` and `done` belong to whoever delivers the item.
- Do not move backlog files between folders; relocation belongs to the
  `close-sprint` workflow.

## Output

- The backlog file path(s) that were created or updated — one line per slice when
  a ticket produced several, with the dependency order.
- Any assumptions that still need PO or developer confirmation.
- Which criteria were run against the tree and the exceptions they now name;
  for an item left `draft`, the criteria that clash.
- Whether the local backlog template was also updated for consistency.
- The ready check's verdict per item — ready, or its open points with the
  next step — and which items the developer flipped to `ready`.

The recap ends with one `Next step:` line, from the first row that applies. A
human action names who takes it: `<action> (<who>)`.

| Outcome | Next step |
| --- | --- |
| Item not ready | the `Next step:` the ready check wrote on it |
| Item ready, flip not confirmed | confirm the flip to `ready` (you) |
| Item ready, confirmed | `work-backlog` |
