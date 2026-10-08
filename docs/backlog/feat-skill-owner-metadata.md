# Feature: An Owner For Every Skill

## Status

in-progress

Filed 2026-10-08 from the October 2026 stack review (task T7, second slice). The
owner decision was made on 2026-10-08 (see `## Decision`), which made the item
deliverable.

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

- [x] **Slice 1 — the validator accepts it.** `scripts/validate-skills.mjs` parses
      a nested `metadata:` map (its frontmatter parser flattens indented lines
      today) and adds `metadata` to `KNOWN_KEYS`; a skill with `metadata.owner`
      passes, one without it only warns. No skill file changes.
- [ ] **Slice 2 — the owners.** Every `skills/*/SKILL.md` gains
      `metadata:` / `owner: <gitlab username>`, and the check becomes an error.

## How to verify

Slice 1:

- [x] `node scripts/validate-skills.mjs` — exit 0, 38 warnings
      `frontmatter has no 'metadata.owner'`, one per skill, no errors.
- [x] Add `metadata:` / `  owner: wieteke.pots` under the `description` line of
      `skills/commit-message/SKILL.md` and rerun — 37 warnings, none for
      `commit-message`, and no `unknown frontmatter key 'metadata'`. On
      `gitlab/main` the same edit gives only `unknown frontmatter key 'metadata'`
      and no owner warnings: the old parser has no owner check.
- [x] Same edit with an empty `owner:` — the `commit-message` warning is back
      (38 warnings).
- [x] `bash scripts/validate-ai-instructions.sh` — passes.

## Decision

2026-10-08, Wieteke Pots (maintainer): every skill is owned by `wieteke.pots`
(GitLab username) for now. Both slices go ahead, and in slice 2 a missing owner
becomes a validator error.

## Technical Notes

`metadata` is a documented free-form map in the Agent Skills frontmatter that
Claude Code ignores
(https://code.claude.com/docs/en/skills, checked 2026-10-08), so it is safe for
Claude, and Codex reads the same standard. Do not reuse a reserved key such as
`paths` inside it.

Rechecked 2026-10-08 at delivery: https://agentskills.io/specification defines
`metadata` as "a map from string keys to string values", and the Claude Code docs
say it "drops a value that isn't a map". `owner` is not a frontmatter field name,
and the block sits outside `description`, so the 1,024-character Codex limit the
validator enforces is measured on the same text as before.

## Out of Scope

- Org-managed marketplace and `enabledPlugins`: needs a Claude Teams Owner.
- Routing review requests from the owner field.

## Related

- [chore-skill-checkout-paths.md](chore-skill-checkout-paths.md)
- [../../scripts/validate-skills.mjs](../../scripts/validate-skills.mjs)
- https://code.claude.com/docs/en/skills
- Slice 1 MR: https://gitlab.com/greenberrynl/config/ai-workflows/-/merge_requests/162
