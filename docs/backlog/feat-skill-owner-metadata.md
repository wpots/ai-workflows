# Feature: An Owner For Every Skill

## Status

draft

Filed 2026-10-08 from the October 2026 stack review (task T7, second slice). Not
`ready`: which person owns which skill is the maintainer's call, and the first
step is validator work, not content.

## Priority

low

## Summary

Record who owns each of the 38 skills in its frontmatter (`metadata.owner`) and
have the validator require it, so a second contributor knows whom a skill's
review and upkeep go to.

## User Story

As a contributor to the skill library, I want to see who owns a skill, so that I
know whom to ask before changing it and who reviews the change.

## Acceptance Criteria

Sliced because the second step touches 38 files, over the budget in
`rules/mr-sizing.md`:

- [ ] **Slice 1 — the validator accepts it.** `scripts/validate-skills.mjs` parses
      a nested `metadata:` map (its frontmatter parser flattens indented lines
      today) and adds `metadata` to `KNOWN_KEYS`; a skill with `metadata.owner`
      passes, one without it only warns. No skill file changes.
- [ ] **Slice 2 — the owners.** Every `skills/*/SKILL.md` gains
      `metadata:` / `owner: <gitlab username>`, and the check becomes an error.

## Open decision

Who owns which skill. A default of the maintainer for all 38 is possible but makes
the field empty of information; the useful version assigns by who maintains each
skill.

## Technical Notes

`metadata` is a documented free-form map in the Agent Skills frontmatter that
Claude Code ignores
(https://code.claude.com/docs/en/skills, checked 2026-10-08), so it is safe for
Claude, and Codex reads the same standard. Do not reuse a reserved key such as
`paths` inside it.

## Out of Scope

- Org-managed marketplace and `enabledPlugins`: needs a Claude Teams Owner.
- Routing review requests from the owner field.

## Related

- [chore-skill-checkout-paths.md](chore-skill-checkout-paths.md)
- [../../scripts/validate-skills.mjs](../../scripts/validate-skills.mjs)
- https://code.claude.com/docs/en/skills
