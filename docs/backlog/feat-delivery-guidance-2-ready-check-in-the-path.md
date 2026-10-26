# Feature: Run the Ready Check Where the Path Needs It

## Status

ready

Drafted and flipped to ready 2026-10-13 with the maintainer. Ready check of
2026-10-14 (slice 1's post-merge check) folded in on the maintainer's go: the
backlog skill's own change, the fallback runbook, the missing sprint-planning and
pipeline-map places, and a precise criterion for the legacy status.

## Slice

2/4 — the ready check wired into backlog, sprint-planning, work-backlog and refinement

## Priority

high

## Summary

The chain breaks between planning and building today: `skills/sprint-planning`
overwrites a BLI's status with `Planned for Sprint <N>.`, `skills/work-backlog` only
picks `ready`, and nothing in between makes an item `ready`. This slice runs the ready
check from slice 1 at the moments a developer needs it, keeps the status value intact,
and closes the loop back to refinement for product questions parked there.

## User Story

As a developer moving work from planning into the loop, I want the ready check to run
where I already am — after writing an item, after sprint planning, and when the loop
finds nothing to pick up — so that I never have to remember a separate step, and so
that a question I parked for refinement actually reaches the next session.

## Acceptance Criteria

- Writing or updating an item with the backlog skill ends with the ready check for
  that item, so a fresh item states whether it is ready and what is missing.
- sprint-planning writes `Planned for Sprint <N>.` as a note under the status value
  instead of replacing it, and ends by offering the ready check over the sprint's
  planned items.
- When work-backlog finds no eligible item, it reports per draft item the failing
  points and next steps from the ready check, instead of only "not ready".
- Refinement prep adds the questions a developer parked for refinement to that
  ticket's question list.
- An item whose status still reads `Planned for Sprint <N>.` from before this change
  is read as `draft` with that note, and rewritten as the status value with
  `Planned for Sprint <N>.` as a note below it, the next time the ready check writes
  that item's status.
- The fallback runbooks (`commands/backlog.md`, `commands/sprint-planning.md`,
  `commands/work-backlog.md`, `commands/refinement.md`) follow their skills.

## Technical Notes

- **backlog.** A closing step in the Workflow of `skills/backlog/SKILL.md`, after the
  size and criteria checks: run the ready check on the item just written. In
  `commands/backlog.md`, Phase 5 drops "(on request)" and Phase 3 ends with it.
- **sprint-planning.** The rule sits in five places; change each to a note line below
  the value: `skills/sprint-planning/SKILL.md:43` (Constraints, "a **doc status** …
  mirroring close-sprint") and `:65` (Output), `commands/sprint-planning.md:28`
  (Safety), `:260` (Phase 6) and `:279` (Output). The planning template only lists
  BLIs and stays. The ready check runs after the Phase 7 review pause, as an offer —
  planning stays a planning document first.
- **work-backlog.** Step 3, "If none is eligible, report per item what blocks it",
  gains the ready-check output for `draft` items. It stays read-only here: the run
  reports and stops, it does not flip anything.
- **refinement.** Phase 2 step 1 already locates `docs/backlog/<KEY>-*.md`; read its
  `Blocked on: refinement —` lines there (the format slice 1's ready check writes) and
  carry them into Phase 3 "Questions per ticket", marked as coming from the developer. In outcome mode, a decided question
  is reported so the developer can remove the line — refinement still never edits
  BLIs (`Phase 6` stays opt-in).
- **Legacy status.** Synced client projects already hold BLIs with
  `Planned for Sprint <N>.` as their status. The ready check
  (`skills/backlog/references/ready-check.md`, "Per item") and work-backlog's pick
  step treat that string as `draft` + note; no bulk migration.
- **pipeline-map.** The "Definition of ready" gate row and its gate paragraph in
  `docs/pipeline-map.md` name this item as what keeps the gate partial; update both
  when it lands.
- Changelog fragment `changelog.d/changed.ready-check-in-the-path.md`. Select
  only cases for the changed behavior, including that skill's routing cases
  when its `description` changes, following `evals/README.md`. Broader suites
  and extra runs need explicit scope and budget approval.

## Out of Scope

- The checklist and routes themselves (slice 1).
- Next-step lines in recaps (slice 3) and the path page (slice 4).
- Writing to the tracker from refinement or sprint-planning — both stay read-only.

## Related

- Depends on: feat-delivery-guidance-1-ready-check.md
- [../../skills/backlog/SKILL.md](../../skills/backlog/SKILL.md)
- [../../commands/backlog.md](../../commands/backlog.md)
- [../../skills/backlog/references/ready-check.md](../../skills/backlog/references/ready-check.md)
- [../pipeline-map.md](../pipeline-map.md)
- [../../skills/sprint-planning/SKILL.md](../../skills/sprint-planning/SKILL.md)
- [../../commands/sprint-planning.md](../../commands/sprint-planning.md)
- [../../skills/work-backlog/SKILL.md](../../skills/work-backlog/SKILL.md)
- [../../commands/work-backlog.md](../../commands/work-backlog.md)
- [../../skills/refinement/SKILL.md](../../skills/refinement/SKILL.md)
- [../../commands/refinement.md](../../commands/refinement.md)
