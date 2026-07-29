# Chore: create-pr Pre-flight Review, Ticket-drift Check, and Post-create Monitor

## Status

draft

Readiness pass 2026-07-29 — blocked on maintainer decisions: interim behavior
when `skills/ticket-drift-check` does not exist is unstated (AC 2 requires it,
Out of Scope forbids building it), and "stops on high-severity findings" needs
a defined threshold — code-review defines an ordered severity list, not named
levels. Delivery notes: reference not-yet-existing skills without the `.md`
extension (`validate-skills.mjs` errors otherwise); regenerating
`.github/prompts/create-pr.prompt.md` is required when the command changes.

## Priority

high

## Summary

Close the Review seam in `skills/create-pr`: self-review the diff and check the
ticket for drift **before** the MR is opened, and arm the MR watcher **after** it
is opened, so a red pipeline or a stale ticket surfaces in minutes instead of at
the next reviewer's expense.

## User Story

As a developer opening a merge request, I want the review and ticket checks to run
as part of creating the MR and the pipeline to be watched from that moment, so that
reviewers never see findings a self-review would have caught and a failing pipeline
never sits unnoticed.

## Acceptance Criteria

- [ ] `skills/create-pr` runs `skills/code-review` over the branch diff as a
      pre-flight step, in the same place the existing `skills/migration-check`
      delegation sits, and stops on high-severity findings until the user waives
      them explicitly.
- [ ] The pre-flight calls `skills/ticket-drift-check` whenever a ticket key can be
      resolved from the branch name, and surfaces the drift verdict before the MR
      description is generated.
- [ ] No duplicate verification: the pre-flight reuses the single full checks sweep
      the skill already runs before pushing — the "Sustainable IT" constraint in the
      skill stays intact.
- [ ] After the MR is created, the skill offers to arm `skills/watch-mrs` for that
      MR (comments, approval, pipeline) and states the default explicitly instead of
      assuming it.
- [ ] The Recap table gains a `Monitor armed` row, set to ✅ or ➖ but never dropped.
- [ ] Any skipped pre-flight step is an explicit user decision and appears in the
      recap's `Open items` row.
- [ ] `commands/create-pr.md` stays aligned as a fallback wrapper, not a second
      implementation.

## Technical Notes

The delegation pattern already exists: the migration pre-flight lives in step 3 of
`skills/create-pr/SKILL.md` and is the model to copy — the skill states the
condition, delegates, and defines what happens on a failure.

`skills/create-pr` is already ~350 lines. Prefer one compact `Pre-flight` block that
names the delegated skills and their stop conditions over inlining any review or
tracker logic.

The ticket key is already extracted from the branch name in the "Generate PR
Content" step (`^([A-Z]+-[0-9]+)`), together with the tracker base URL resolution —
reuse both instead of re-deriving them.

## Out of Scope

- Building `skills/ticket-drift-check` (own backlog item).
- Changing how `skills/watch-mrs` polls (own backlog item).
- Auto-merge defaults — arming the watcher must not silently enable auto-merge.

## Related

- [../../skills/create-pr/SKILL.md](../../skills/create-pr/SKILL.md)
- [../../commands/create-pr.md](../../commands/create-pr.md)
- [../../skills/code-review/SKILL.md](../../skills/code-review/SKILL.md)
- [../../skills/watch-mrs/SKILL.md](../../skills/watch-mrs/SKILL.md)
- [../pipeline-map.md](../pipeline-map.md)
