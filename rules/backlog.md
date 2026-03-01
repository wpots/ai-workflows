# Backlog & User Stories

> Apply these rules whenever the user asks to write user stories, backlog items,
> features, bugs, or tasks.

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

## File Template

Every backlog item must follow this structure:

```markdown
# [Type]: [Title]

## Status
<!-- draft | ready | in-progress | done -->
draft

## Priority
<!-- critical | high | medium | low -->
medium

## Summary
<!-- 1-2 sentence elevator pitch of what this item is about -->

## User Story
<!-- As a [role], I want [goal], so that [benefit]. -->

## Acceptance Criteria
<!-- Checklist a junior developer can verify against -->
- [ ] ...
- [ ] ...
- [ ] ...

## Technical Notes
<!-- Implementation hints, relevant files, dependencies, edge cases.
     Be specific enough that a junior developer can pick this up without
     asking follow-up questions. -->

## Out of Scope
<!-- Explicitly state what this item does NOT cover -->

## Related
<!-- Links to related items, PRs, or docs -->
```

## Writing Style

- Write for a **junior developer** — assume they know the stack basics but not
  the codebase internals.
- Include specific file paths, function names, and component names where relevant.
- Spell out edge cases and error scenarios in acceptance criteria.
- Keep language direct and unambiguous — no "maybe" or "consider".
- Each acceptance criterion should be independently testable.

## Updating Existing Items

- When updating a backlog item, edit the existing file — do not create duplicates.
- Update the `Status` field when work begins or completes.
- Append to `Technical Notes` rather than overwriting when adding context.
