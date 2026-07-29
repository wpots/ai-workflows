# Spike: Ratify Claude Skill Status And Cursor Pointer

## Status

draft

Needs a maintainer decision before it can go `ready` — see the two decision
points below. Supersedes AIW-109 and AIW-110, whose investigative work is done.

## Ticket

AIW-109 / AIW-110 (merged)

## Priority

medium

## Summary

Close out the last two open decisions from the skills-first strategy work:
officially ratify Claude's skill support as first-class (or not), and decide
whether the Cursor `.mdc` adapter gets an `AI-WORKFLOWS.md` pointer or its
minimalism is documented as intentional. Everything else from the original
spikes has already landed.

## Background (verified 2026-07-29)

From AIW-110, already delivered: the tool-support matrix is published in
`AGENTS.md`, `README.md`, `FEATURES.md`, and `templates/project-ai-workflows.md`;
the surface-role model is documented; the shortlist was executed
(`docs/skills-first-migration-plan.md`); the experimental tier was removed;
`docs/workflow-canonical-sources.md` registers a canonical source per workflow.

From AIW-109, corrected premise: Cursor already reaches `AI-WORKFLOWS.md`
through `AGENTS.md` (its declared always-on entry point alongside
`.cursor/rules/*.md`), so the gap is a duplicate-pointer question in one
18-line `.mdc` file, not a parity gap in the loading model.

## Decision Points

1. **Claude skill status (binary).** De facto Claude is already
   skills-first: six workflows route as "skill only, no fallback" in
   `CLAUDE.md`, contradicting its own "commands and runbooks remain the
   compatibility path" line, and `docs/workflow-canonical-sources.md` lists
   ~19 skill-only workflows. Ratify "first-class" (the lagging docs catch up)
   or roll the skill-only routings back.
2. **Cursor `.mdc` pointer.** Add one `AI-WORKFLOWS.md` pointer line to
   `templates/project-cursor-conventions.mdc`, or keep it minimal and
   document that the routing goes via `AGENTS.md`. The original spike's own
   guidance ("choose the simpler option") plus the corrected premise favor
   the second.

## Acceptance Criteria

- [ ] The Claude decision is written down as a binary (first-class or not),
      and `CLAUDE.md`'s "commands remain the compatibility path" wording is
      reconciled with its skill-only routing entries.
- [ ] The Claude row in all four support-matrix copies (`AGENTS.md`,
      `README.md`, `FEATURES.md`, `templates/project-ai-workflows.md`) is
      updated to match the decision, plus the open item in
      `docs/skills-first-migration-plan.md`.
- [ ] `docs/skills-first-migration-plan.md` is closed out or reduced to a
      decision record — its phases are effectively complete except this
      decision.
- [ ] The Cursor decision is applied: either the `.mdc` gains the pointer,
      or the docs state the two-file Cursor loading path (`AGENTS.md` +
      `.cursor/rules/*.md`) explicitly so the minimal `.mdc` reads as
      intentional.
- [ ] `templates/project-cursor-conventions.mdc` and
      `templates/project-AGENTS.md` list the same rule files (the `.mdc`
      currently omits `rules/sonarqube.md`).

## Technical Notes

Root cause worth considering while here: the support matrix is hand-maintained
in four places. A validator-enforced single source (extend
`scripts/validate-skills.mjs`) would prevent the drift this spike keeps
patching — optional scope, flag it in the MR if skipped.

## Out of Scope

- Rewriting commands into skills or removing Copilot support
- New tool integrations
- Broad Cursor behavior changes unrelated to project loading

## Related

- [docs/backlog/spike-decide-skills-first-strategy-and-tool-support-matrix.md](/Users/wietekepots/Web/ai-workflows/docs/backlog/spike-decide-skills-first-strategy-and-tool-support-matrix.md)
- [docs/backlog/spike-decide-cursor-parity-for-ai-workflows-guide.md](/Users/wietekepots/Web/ai-workflows/docs/backlog/spike-decide-cursor-parity-for-ai-workflows-guide.md)
- [docs/skills-first-migration-plan.md](/Users/wietekepots/Web/ai-workflows/docs/skills-first-migration-plan.md)
- [docs/workflow-canonical-sources.md](/Users/wietekepots/Web/ai-workflows/docs/workflow-canonical-sources.md)
- [templates/project-cursor-conventions.mdc](/Users/wietekepots/Web/ai-workflows/templates/project-cursor-conventions.mdc)
