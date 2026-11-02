# Backlog & User Stories

> Apply these rules whenever the user asks to write user stories, backlog items,
> features, bugs, or tasks.

## Relationship to Issue Trackers

These backlog files complement your issue tracker (Jira, Linear, etc.) — they
don't replace it. Use them as a local drafting format for AI-generated stories
and specs. Link back to the tracker via the **Ticket** field in each file.

## One Ticket, Many Items

A ticket and a backlog item are not the same unit. The item is what **one MR**
delivers, so a ticket whose MR would be too large to review in one sitting gets
more than one item:

```
PROJ-123  ──  PROJ-123-feat-vacancy-search-1-index.md     (slice 1/3)
          ──  PROJ-123-feat-vacancy-search-2-results.md   (slice 2/3)
          ──  PROJ-123-feat-vacancy-search-3-filters.md   (slice 3/3)
```

`rules/mr-sizing.md` owns the size budget, the sliceability test, and the split
triggers — cut the work here, while it is still prose. An item that trips a
split trigger may not be marked `ready`.

Every slice repeats the ticket key, states its position in the `Slice` field,
and depends on the one before it. The ticket is delivered when **every** item
carrying its key is `done` on the default branch, in `docs/backlog/` or in a
sprint, support or quarter folder; there is no separate progress field to
maintain.

## Output Location

All backlog items MUST be written to the project's `docs/backlog/` folder.

- If `docs/` does not exist, create it.
- If `docs/backlog/` does not exist, create it.
- Never output stories inline in chat only — always persist to a file.

## Folder Structure

```
docs/
├── backlog/                       # open work: draft, ready, in-progress
│   ├── PROJ-103-bug-date-picker-timezone.md
│   ├── PROJ-104-story-onboarding-flow.md
│   └── ...
└── sprint-<N>/                    # the running sprint: items done in it
    ├── PROJ-101-feat-user-authentication.md
    └── PROJ-102-feat-diary-entry-crud.md
```

## Done Items Leave the Backlog

`docs/backlog/` holds open work only, so it shrinks while the sprint runs and
the sprint folder shows what is done. `skills/sprint-planning` creates
`docs/sprint-<N>/` when it plans the sprint; the running sprint's folder is the
highest one without a `docs/sprint-<N>-changelog.md` beside it.

- **The `done` commit moves the item.** The commit that sets `Status` to `done`
  also runs `git mv docs/backlog/<file> docs/sprint-<N>/<file>`, on the same
  branch, so the merge that delivers the item also files it.
- **The same commit fixes the links the move breaks**: `../backlog/<file>` in
  other docs (specs, ADRs, the backlog index) becomes `../sprint-<N>/<file>`,
  sibling links from items that stay become `../sprint-<N>/<file>`, and the
  moved item's own sibling links become `../backlog/<file>`. Links to
  `../specs/` and other `docs/` folders keep working, since both folders sit at
  the same depth. `rg -n "<file>" docs/` finds the links in.
- **Only `done` moves.** An item that stays `in-progress` with a post-merge
  check left stays in `docs/backlog/` until that check flips it.
- **A repo that files by quarter** (no sprints and no support months; a
  `docs/<yyyy>-q<n>/` folder already exists) always has a running folder:
  `docs/<yyyy>-q<n>/` for the quarter of the `done` commit. The first `done`
  commit of a quarter creates it; the links are fixed as above.
- **No running sprint folder** (support mode, a sprint that was never
  planned): the item stays in `docs/backlog/`, and `skills/close-sprint`
  archives it at the close.
- `skills/close-sprint` is the safety net: it moves a delivered item that is
  still in `docs/backlog/`, and moves an item that sits in the folder without
  being delivered back.

## File Naming

- One item per file — never combine multiple stories/bugs in a single file.
- Types: `feat`, `bug`, `story`, `chore`, `spike`.
- Use kebab-case for the rest of the name.
- Extension: `.md`

- When `## Ticket` contains a real tracker key, the filename MUST start with
  that exact key, before the type: `PROJ-123-feat-user-authentication.md`.
  This applies to drafts too and is shared policy for every project.
  - Preserve the tracker's key, keep hyphen separators, and use kebab-case for
    the descriptive part.
- When no ticket exists yet, use `<type>-<slug>.md`. Once a real ticket key is
  assigned, prepend it and update references to the old filename. Never invent
  a key to satisfy the naming rule.
- When one ticket has several items, suffix each with its slice number and the
  capability it delivers: `PROJ-123-feat-vacancy-search-2-results.md`. The
  number orders them; the slug says what the slice is, not which layer it
  touches. Every slice uses the same ticket-key prefix.

## File Template

Every backlog item must follow this structure:

```markdown
# [Type]: [Title]

## Status

<!-- draft | ready | in-progress | done -->

draft

## Ticket

<!-- PROJECT-123 or JS-103 -->

PROJ-123

## Slice

<!-- Omit when the ticket has a single item. Otherwise: 2/3 — results list -->

## Priority

<!-- critical | high | medium | low -->

medium

## Summary

<!-- 1-2 sentence elevator pitch of what this item is about -->

## User Story

<!-- As a [role], I want [goal], so that [benefit]. -->

## Reproduction

<!-- Bug items only — omit for other types. The shortest path that shows the
     defect today: the input, command or route, as which role, and the wrong
     result. The fix is checked against it and the first test is written from
     it. A deterministic path (a function call on a fixture) beats a manual
     one. Spend a fair effort, not an afternoon: if no reliable path turns up,
     say so here — what was tried, and under which conditions the defect has
     been seen — instead of leaving the section out. -->

1. ...
2. ...

## Acceptance Criteria

<!-- Plain bullets, each one independently testable by a junior developer.
     No task-list checkboxes: the MR description is where they are ticked. -->

- ...
- ...
- ...

## How to verify

<!-- Filled in by whoever delivers the item, before the MR opens — evidence,
     not claims. Runnable steps on a fresh checkout: the command to run, the
     route to open and as which role, the observable result. Cover every
     acceptance criterion that needs more than "the test passes".
     This is the developer-facing text. The product-owner instructions are a
     separate artefact, drafted from the MR by the post-merge closeout. -->

- [ ] `npm run test -- <path>` — <what it proves>
- [ ] open `<route>` as <role> — <observable result>

## Technical Notes

<!-- Implementation hints, relevant files, dependencies, edge cases.
     Be specific enough that a junior developer can pick this up without
     asking follow-up questions. -->

## Out of Scope

<!-- Explicitly state what this item does NOT cover -->

## Related

<!-- Links to related items, PRs, or docs.
     A slice that needs an earlier one merged first states it as
     `Depends on: PROJ-123-feat-vacancy-search-1-index.md` — that line is what
     autonomous delivery reads to order the work. -->
```

## Writing Style

- Write for a **junior developer** — assume they know the stack basics but not
  the codebase internals.
- Include specific file paths, function names, and component names where relevant.
- Spell out edge cases and error scenarios in acceptance criteria.
- Keep language direct and unambiguous — no "maybe" or "consider".
- Each acceptance criterion should be independently testable.
- `How to verify` is written to be **run**, not read: real commands, real
  routes, real roles. "Check that it works" is not a verification step.
- `Reproduction` (bug items) is the shortest path that **shows** the defect,
  not a description of it. "Hard to reproduce" is an acceptable entry only
  together with what was tried; a bug item without either is not ready.

## Definition of Ready

An item is `ready` when someone who did not write it — a developer, or
`skills/work-backlog` — can build it without coming back with a question. The
ready check in `skills/backlog` holds items against this list and nothing else.

A story in the tracker has its own list: `rules/ticket-flow.md` § Definition of
Ready.

| Point | Ready when |
| --- | --- |
| Criteria | every acceptance criterion is testable, the criteria can all hold together and with `Out of Scope`, and no open product question blocks one |
| Size | no split trigger in `rules/mr-sizing.md` fires |
| Approach | `Technical Notes` name the approach, the files or modules it touches, and the test level per criterion; where two approaches were viable, the choice and why |
| Dependencies | every `Depends on:` item is named; what the work needs from outside — credentials, API access, client content, design — is available |
| CMS sections | every section the editor places, configures or labels is a block: its copy is block fields with defaults, its data comes from the block's own loader in its own server section, and automatic content shows read-only in the block (Payload projects: `rules/payload.md` § Editor-Facing Sections) |
| Bug | `## Reproduction` holds a path, or what was tried |

- **A person flips it.** The developer sets `ready`, by hand or by confirming
  the check's proposal. Nothing flips an item on its own: `ready` is the gate
  after which `skills/work-backlog` may build the item unattended.
- **A list to judge by, not a contract.** A point that does not apply passes. A
  point nobody can judge from the item and the code is a question for the
  developer, not a fail.
- **Not ready says what comes next.** The first line under `## Status` stays the
  value. Below it, a not-ready item carries one `Blocked on:` line per open
  point and one `Next step:` line for what comes first:

```markdown
## Status

draft

Blocked on: PO — may an expired vacancy still be shared?
Next step: developer asks the PO in the OBA-150 ticket
```

## Updating Existing Items

- When updating a backlog item, edit the existing file — do not create duplicates.
- Update the `Status` field when work begins or completes. Remove a
  `Blocked on:` line once its point is resolved. Setting `done` moves the item
  into the sprint folder (see "Done Items Leave the Backlog").
- Append to `Technical Notes` rather than overwriting when adding context.

## Recent Rules Updates

- 2026-04-08: Added "Rich Text Output Rules" to `rules/accessibility.md` — rules include: do not emit empty content elements (`<p>`, `<ul>`, `<li>`), use `<hr>` only as a structural separator, avoid consecutive `<br>` tags, require `lang` attributes for different-language content, and prefer `<b>`/`<i>` for purely visual styling instead of `<strong>`/`<em>`.
