# Feature: Next Step in Every Delivery-path Recap

## Status

in-progress

Drafted and flipped to ready 2026-10-13 with the maintainer.

## Slice

3/4 — a next-step line at the end of every skill on the delivery path

## Priority

medium

## Summary

A developer finishing one skill often does not know which one comes next. Some skills
already hand off (`watch-mrs` → `mr-merged`, `user-journeys` → `backlog`,
`close-sprint` → `release-notes`), most do not. This slice ends every recap on the
delivery path with one line naming the next step — the next skill, or the human action
that has to happen first — chosen from the outcome of the run, not fixed per skill.

## User Story

As a developer working through a ticket, I want every skill to end by telling me what
comes next, so that I can follow the path from ticket to merged MR without knowing the
whole map by heart.

## Acceptance Criteria

- Every skill on the delivery path ends its recap with exactly one `Next step:` line.
- The next step follows from the outcome: an item that is not ready points at its route
  from the ready check, a ready item points at work-backlog, an MR that is open points at
  review, a merged MR points at the closeout.
- When the next step is a human action (a reviewer, the PO, a setting), the line names
  that action and who takes it, not a skill.
- Skills that already hand off keep their hand-off; the line restates it rather than
  adding a second one.
- The fallback runbooks of these skills carry the same line.

## Technical Notes

The path, in order: `refinement` → `sprint-planning` → `backlog` (with the ready check)
→ `work-backlog` → `create-pr` → `watch-mrs` / `address-review-comments` → `mr-merged`
→ `close-sprint` → `release-notes` / `release`.

Per skill, a small table of outcome → next step in the skill's Output or Recap section.
Examples:

| Skill | Outcome | Next step |
| --- | --- | --- |
| backlog | item not ready | the route from the ready check |
| backlog | item ready, confirmed | `work-backlog` |
| work-backlog | MR opened | reviewer reviews; `watch-mrs` to follow it |
| work-backlog | nothing eligible | the ready check's report |
| mr-merged | ticket incomplete | the next slice's item |

Keep each line short; the recap already holds the detail. Watch the size budget: ten
skills plus their runbooks is close to the file target in `rules/mr-sizing.md` — the
regenerated `.github/prompts/*.prompt.md` files do not count, the runbooks do. Changelog
fragment `changelog.d/changed.next-step-in-recaps.md`.

## Out of Scope

- Skills off the delivery path (maintenance, audits, upstream skills).
- A "where am I" command that reads a ticket's state and answers the next step — worth a
  separate item if the recap lines are not enough.
- The path page in `AI-WORKFLOWS.md` (slice 4).

## Related

- Depends on: feat-delivery-guidance-2-ready-check-in-the-path.md
- [../../skills/watch-mrs/SKILL.md](../../skills/watch-mrs/SKILL.md)
- [../../skills/mr-merged/SKILL.md](../../skills/mr-merged/SKILL.md)
- [../../skills/close-sprint/SKILL.md](../../skills/close-sprint/SKILL.md)
