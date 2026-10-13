# Chore: Skills Stop Naming Cursor

## Status

<!-- draft | ready | in-progress | done -->

in-progress

Go given by the maintainer on 2026-10-13. Slice 1 merged (!188).

## Ticket

<!-- no tracker ticket: this repo's own backlog -->

## Slice

2/3 — skill wording

## Priority

low

## Summary

Eight skills still name Cursor in passing, as one of the tools a runbook is
shared with or a connector name differs in. Those mentions go, so the skills
describe the tools the team actually runs: Claude and Codex.

## User Story

As a developer reading a skill, I want it to name only the tools we support, so
that I do not wonder whether Cursor still needs to keep working.

## Acceptance Criteria

- The "thin wrapper around that runbook so Codex, Cursor, and Claude Code share"
  sentence near the top of `close-sprint`, `compact-sprint`, `refinement`,
  `release-notes`, `sprint-demo` and `sprint-planning` names Codex and Claude
  Code only.
- The tool list in `skills/improve-skill/SKILL.md` ("shared across tools
  (Claude, Copilot, Cursor, Codex)") drops Cursor.
- The connector-name sentence in `skills/service-cli/SKILL.md` drops Cursor.
- `rg -n -i cursor skills/` prints nothing.
- `node scripts/validate-skills.mjs` passes.
- A changelog fragment `changelog.d/changed.skills-drop-cursor.md` records the
  wording change.

## How to verify

<!-- Filled in by whoever delivers the item. -->

## Technical Notes

Wording only. No skill description in the frontmatter mentions Cursor once
slice 1 has changed `setup-ai-workflows`, so routing is unaffected.

Skills are not part of the freshness stamp, so this slice prompts no re-sync in
synced projects.

`skills/upstream-rules` and `skills/setup-ai-workflows` are not in this slice:
they name the deleted templates or the files sync stopped writing, so slice 1
changes them.

## Out of Scope

- Anything slice 1 or slice 3 covers.
- Rewording a skill beyond removing Cursor.

## Related

Depends on: chore-retire-cursor-adapters-1-stop-emitting.md

- [chore-retire-cursor-adapters-1-stop-emitting.md](chore-retire-cursor-adapters-1-stop-emitting.md)
- [chore-retire-cursor-adapters-3-docs.md](chore-retire-cursor-adapters-3-docs.md)
