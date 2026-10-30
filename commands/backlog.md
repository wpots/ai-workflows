# Backlog Runbook

Canonical runbook for drafting and updating backlog items. The `backlog` skill
on skill-aware tools wraps this runbook; Copilot and other prompt-first tools
should follow these steps directly.

Goal: create or update a backlog item in `docs/backlog/` that is specific
enough for a junior developer to pick up, while keeping acceptance criteria
product-facing and implementation detail in technical notes.

## Safety

- Always write backlog work to a file in `docs/backlog/`.
- Update an existing item when one already exists for the same ticket/scope.
- Never invent a tracker key when the project conventions require a real one.
- Do not move backlog files between folders; that belongs to `close-sprint`.

## Inputs

Confirm only what you cannot infer safely:

1. Ticket key, if the project requires one and none is discoverable.
2. Whether the request is for a new item or an update to an existing one.
3. Whether the item is a normal story or a correction/sub-ticket.

## Phase 1 — Load rules and local context

1. Read `rules/backlog.md`.
2. Read `CONVENTIONS.md`.
3. Inspect `docs/backlog/_template.md` if present.
4. Read only the relevant local docs and code paths for the requested scope.

## Phase 2 — Resolve the target file

1. Search `docs/backlog/` for an existing matching ticket or scope — including
   untracked files (`git status --porcelain docs/backlog/`) and a parallel
   session's branch or worktree on the slug (`git worktree list`).
2. If a matching file exists, update it. An item another session is still
   writing is updated additively and left uncommitted; never commit, rename or
   move it on that session's behalf. For other existing items, resolve the
   filename from `## Ticket` using `rules/backlog.md`'s File Naming section;
   correct a missing or wrong prefix and update links, `Depends on:` lines and
   other filename references.
3. Otherwise create a new file using the naming rules from `rules/backlog.md`
   plus any stricter project-local convention from `CONVENTIONS.md`.
4. The same item in several repositories: check per repository that the
   problem exists, write one shared contract first (names, paths, flags,
   defaults, formats, refusals), and put it verbatim in every item's
   `Technical Notes`. Parallel writers all get that contract.
5. Before finishing, verify that every changed item's filename prefix matches
   its real Ticket key and that updated references resolve. Reusable changes
   to this naming policy belong in canonical `ai-workflows` rules and skill;
   reserve `CONVENTIONS.md` for project-specific requirements.

## Phase 3 — Draft the item

Use the structure from `rules/backlog.md`:

- `# [Type]: [Title]`
- `## Ticket`
- `## Priority`
- `## User Story` when applicable
- `## Reproduction` for bug items — the shortest path that shows the defect;
  after a fair attempt without a reliable path, record what was tried instead
- `## Acceptance Criteria`
- `## Technical Notes`
- `## How To Test/Verify` when the item is beyond refine state
- `## Out of Scope`
- `## Related`

Rules:

- Keep acceptance criteria PO-friendly and independently testable.
- Use plain bullets in acceptance criteria, not task-list checkboxes.
- Put file paths, helper names, schema details, migrations, and test guidance in
  `Technical Notes`.
- Add the persisted-field table to acceptance criteria when the item introduces
  or materially changes persisted fields.
- For correction/sub-tickets, use the minimal format from `rules/backlog.md`.

End with the ready check (Phase 5) on every item this run drafted or updated.

## Phase 4 — Align the local template when needed

If `docs/backlog/_template.md` exists and no longer matches `rules/backlog.md`,
update it so future backlog work starts from the correct format.

## Phase 5 — Ready check

On the items Phase 3 just drafted, and when asked whether an item, or a set of
items, is ready:

1. Hold each item against the Definition of Ready in `rules/backlog.md`. A
   status that still reads `Planned for Sprint <N>.` is `draft` with that line
   as a note; writing its status puts the value first and keeps the line below
   it.
2. Put each open product question to the developer, one at a time: answer it
   now, ask the PO, keep it for the next refinement, or record it as an
   assumption. Write the chosen route into the item.
3. Give every other open point its next step: slices, a recorded approach
   choice, a spike item, back to design, an external request, a reproduction.
4. On an item that is not ready, write `Blocked on:` and `Next step:` lines
   under the status value.
5. Propose the items that pass, and write `ready` only after the developer
   confirms each one.

The full procedure, with the routing tables, is
`skills/backlog/references/ready-check.md`.

## Output

End with:

- The backlog file path created or updated
- Whether the item was new or updated
- Any open assumptions that still need confirmation
- Whether `docs/backlog/_template.md` was updated
- The ready check's verdict per item and which items the developer flipped to
  `ready`
- Last, one `Next step:` line, from the first row that applies; a human action
  names who takes it, `<action> (<who>)`:

  | Outcome | Next step |
  | --- | --- |
  | Item not ready | the `Next step:` the ready check wrote on it |
  | Item ready, flip not confirmed | confirm the flip to `ready` (you) |
  | Item ready, confirmed | `work-backlog` |
