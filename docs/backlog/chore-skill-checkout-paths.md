# Chore: Stop Hard-Coding The Maintainer's Checkout Path In Skills

## Status

ready

Filed 2026-10-08 from the October 2026 stack review (task T7, first slice). The
review counted 17 hits in 7 shipped files; on `main` it is 19 hits in 8 files, and
12 of them are legitimate, so this is not a blind search and replace. A second
contributor ships through the stack now, and a skill that tells them to edit
`~/Web/ai-workflows/…` fails for anyone who cloned elsewhere or never cloned.

## Priority

medium

## Summary

Where a skill reads from or edits the ai-workflows repo, say `<ai-workflows>` and
say how to resolve it, instead of naming one developer's path. Keep the literal
path only where it is a default for people who cloned, and let the validator stop
it spreading.

## User Story

As a developer who is not the maintainer, I want a skill to find the ai-workflows
files wherever they are, or ask me, so that it does not fail on a path that only
exists on the maintainer's machine.

## Acceptance Criteria

- [ ] `skills/improve-skill/SKILL.md` (lines 30, 31, 69, 108) says
      `<ai-workflows>/…`, and step 1 defines it: the local clone of
      `greenberrynl/config/ai-workflows`, `~/Web/ai-workflows` by default, asking
      for the path when it is not there; the plugin cache copy is never edited
      because an update replaces it.
- [ ] `skills/setup-ai-workflows/SKILL.md` (lines 107 and 203) reads rules and
      templates from `<ai-workflows>`, resolved the way `skills/start-project`
      already documents: the skill's base directory (`../../templates/`,
      `../../rules/`) first, a local clone second, and neither means the check is
      reported as unknown with both paths named.
- [ ] `skills/create-pr/SKILL.md` (line 82) says the change "likely belongs in the
      ai-workflows repo" and drops the path.
- [ ] `scripts/validate-skills.mjs` errors on `~/Web/ai-workflows` in any file under
      `skills/` outside an allowlist kept in the validator: `start-project`,
      `maintenance`, `upstream-rules` and `improve-skill`, the four that name it as
      a documented default or lookup. The existing rule on checkout-path script
      calls stays.
- [ ] A changelog fragment `changelog.d/changed.skill-checkout-paths.md` describes
      the change; `CHANGELOG.md` and the plugin version are untouched.
- [ ] `./scripts/validate-ai-instructions.sh` passes.

## How to verify

<!-- Filled in by whoever delivers the item. -->

## Technical Notes

The 19 hits on `main`, and what each becomes:

| File | Hits | Disposition |
| --- | --- | --- |
| `commands/new-device-setup.md` | 3 | keep: it is the clone destination and the one place to edit workflows |
| `scripts/validate-skills.mjs` | 2 | keep: it is the rule that forbids calling scripts through that path |
| `skills/start-project/SKILL.md` | 2 | keep: it documents the lookup this item reuses |
| `skills/maintenance/SKILL.md` | 1 | keep: already a lookup with a plugin-root first choice |
| `skills/upstream-rules/SKILL.md` | 4 | keep: contributing back needs a clone, and this names the default |
| `skills/improve-skill/SKILL.md` | 4 | change (criterion 1) |
| `skills/setup-ai-workflows/SKILL.md` | 2 | change (criterion 2) |
| `skills/create-pr/SKILL.md` | 1 | change (criterion 3) |

Reading from the plugin install is right for rules and templates, which a skill
only reads. Editing the source needs a clone: `improve-skill` changes files, so it
asks for the clone instead of falling back to the plugin cache.

## Out of Scope

- "Tickets on the user's name" wording in the sprint skills.
- A per-skill owner (`feat-skill-owner-metadata.md`).
- The org-managed marketplace; it needs a Claude Teams Owner.

## Related

- [feat-skill-owner-metadata.md](feat-skill-owner-metadata.md)
- [../../skills/start-project/SKILL.md](../../skills/start-project/SKILL.md)
- [../../skills/improve-skill/SKILL.md](../../skills/improve-skill/SKILL.md)
- [../../scripts/validate-skills.mjs](../../scripts/validate-skills.mjs)
