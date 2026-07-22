---
name: sprint-board
description: Maintain a per-sprint work board (docs/board/sprint-<N>-board.md, untracked) that tracks every work item through todo / in progress / in review / rework / done, including incidental work and todos created mid-sprint. Update it at EVERY work-status change — picking up an item, opening an MR, receiving review comments, pushing rework, merging. Use when the user asks for the sprint board, "waar ben ik mee bezig", to update the board, or whenever any workflow (work-backlog, create-pr, address-review-comments, close-sprint) changes the status of a work item.
---

# Sprint Board Skill

A lightweight, local-only kanban in one markdown file per sprint. It exists so
the user always has a current answer to "what am I working on and what state is
it in" — without opening the tracker.

This is a **companion** to the tracker and the sprint-planning doc, not a
replacement. It is never committed and never pushed.

## Board location

`docs/board/sprint-<N>-board.md` in the project root. The active board is the
one with the highest `<N>`.

- If `docs/board/` is not gitignored, add `docs/board` to `.gitignore` (same
  treatment as `docs/refine` and `docs/todo`) and tell the user this needs
  committing.
- If no board exists for the current sprint, create one from the template
  below. Seed it from `docs/sprint-<N>-planning.md` when that exists;
  otherwise seed from what is visibly in flight (current branch, open MRs,
  untracked backlog items) and mark guessed statuses with `(verify)`.

## Statuses

`Todo` → `In Progress` → `In Review` → `Done`, with `Rework` as the loop-back
state (`In Review` → `Rework` → `In Review`).

| Event | Transition |
| --- | --- |
| Work picked up (branch created, first edit) | Todo → In Progress |
| MR/PR opened | In Progress → In Review |
| Review comments received | In Review → Rework |
| Rework pushed | Rework → In Review |
| MR merged | In Review → Done |
| Item parked/descoped | any → Todo (with note) or removed (logged) |

## Update protocol — the core rule

**Every time work changes state in a session, update the board in the same
turn as the state change.** Do not batch updates for the end of a session. In
particular, these flows end with a board update:

- `work-backlog` — item picked up → In Progress; MR opened → In Review
- `create-pr` — In Progress → In Review (add MR link)
- `address-review-comments` — In Review → Rework on pickup, → In Review on push
- `close-sprint` — merged items → Done; leftovers flagged as spillover

`templates/project-claude-settings.json` ships a PostToolUse hook that fires a
reminder on `glab mr create`/`gh pr create` (→ In Review) and `glab mr
merge`/`gh pr merge` (→ Done). It cannot update the board itself — that stays
judgement work — but it flags the two deterministic transitions so they are not
missed. Picking work up and receiving review comments have no local command
signal, so those transitions still rely on this skill.

An update means both of:

1. Move the item's row to the right status section's table (sections stay the
   top-level attention order — each section renders as a table, not a single
   grid with a status column).
2. Stamp `Laatst bijgewerkt` at the top with today's date.

**No log/history section.** The board is a live snapshot of current status, not
an audit trail — keep it small and scannable. The row itself (status section +
`Kern / next`) carries the only state worth remembering; the tracker and
`docs/backlog/` hold the durable history. Do not add a `## Log`, `## History`,
or per-transition changelog.

## Incidental work

Anything that surfaces mid-sprint that is not on the planning goes under
`## Bijkomend werk` the moment it appears: new todos (also when written to
`docs/todo/`), bugs found along the way, review-spawned follow-ups, side
quests. One line each, with the source noted (e.g. "uit review RFW-123",
"gevonden tijdens caching werk"). When such an item is actually picked up, move
it into the board sections like any other item, keeping a `[bijkomend]` tag.

## Item format

Each status section is a **kanban table**, one row per item — scannable at a
glance:

```
| Item | MR | Migr. | Kern / next |
| --- | --- | --- | --- |
| **RFW-123** — short title | !45 | nee | `branch-name`, sinds 2026-07-14 · blocker/decision/next step in één regel |
```

- **Item** — ticket key (optional) + short title. Ticket key optional —
  incidental work often has none. Never invent ticket keys.
- **MR** — `!45` (plain, no fabricated URL), or `verify` / `—`.
- **Migr.** — `nee` / `ja — <migration> (gedraaid|te doen)` / `—`.
- **Kern / next** — one tight line: branch/worktree plus only what needs
  remembering. Detail lives in `docs/backlog/` and the tracker, not here.

`Done` uses the same shape (last column just `Kern`); `Bijkomend werk` swaps the
`MR` column for a `Bron` column.

## Template

```markdown
# Sprint <N> — Board

> Untracked werkoverzicht (niet committen). Bijgewerkt bij elke statuswissel.

Laatst bijgewerkt: <date>

## In Progress

| Item | MR | Migr. | Kern / next |
| --- | --- | --- | --- |

## Rework

_(leeg)_

## In Review

| Item | MR | Migr. | Kern / next |
| --- | --- | --- | --- |

## Todo

_(leeg)_

## Done

| Item | MR | Migr. | Kern |
| --- | --- | --- | --- |

## Bijkomend werk

| Item | Bron | Kern |
| --- | --- | --- |
```

## Constraints

- The board file is **never** committed, staged, or pushed.
- The tracker stays read-only; the board mirrors reality, it does not drive it.
- Do not duplicate BLI content into the board — one line per item plus links;
  detail lives in `docs/backlog/` and the tracker.
- When the board and reality visibly disagree (e.g. a branch exists for a Todo
  item), fix the board and log the correction rather than asking.
- On sprint close, the board stays in `docs/board/` as history; start a fresh
  file for the next sprint.
