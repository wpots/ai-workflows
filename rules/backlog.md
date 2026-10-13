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
carrying its key is `done` on the default branch; there is no separate progress
field to maintain.

## Output Location

All backlog items MUST be written to the project's `docs/backlog/` folder.

- If `docs/` does not exist, create it.
- If `docs/backlog/` does not exist, create it.
- Never output stories inline in chat only — always persist to a file.

## Folder Structure

```
docs/
└── backlog/
    ├── feat-user-authentication.md
    ├── feat-diary-entry-crud.md
    ├── bug-date-picker-timezone.md
    ├── story-onboarding-flow.md
    └── ...
```

## File Naming

- One item per file — never combine multiple stories/bugs in a single file.
- Prefix with type: `feat-`, `bug-`, `story-`, `chore-`, `spike-`.
- Use kebab-case for the rest of the name.
- Extension: `.md`

- Optionally prepend the project ticket key before the type: `JS-103-feat-user-authentication.md`.
  - Use an uppercase project acronym and numeric ID (e.g. `PROJ-123`), keep hyphen separators, and preserve kebab-case for the descriptive part.
- When one ticket has several items, suffix each with its slice number and the
  capability it delivers: `PROJ-123-feat-vacancy-search-2-results.md`. The
  number orders them; the slug says what the slice is, not which layer it
  touches.

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

## Updating Existing Items

- When updating a backlog item, edit the existing file — do not create duplicates.
- Update the `Status` field when work begins or completes.
- Append to `Technical Notes` rather than overwriting when adding context.

## Recent Rules Updates

- 2026-04-08: Added "Rich Text Output Rules" to `rules/accessibility.md` — rules include: do not emit empty content elements (`<p>`, `<ul>`, `<li>`), use `<hr>` only as a structural separator, avoid consecutive `<br>` tags, require `lang` attributes for different-language content, and prefer `<b>`/`<i>` for purely visual styling instead of `<strong>`/`<em>`.
