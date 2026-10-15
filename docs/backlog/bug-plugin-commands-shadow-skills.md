# Bug: Plugin Commands Shadow The Skills They Fall Back For

## Status

done

Filed 2026-10-13, found while recording the plugin demo video. Found again
2026-10-14 by the post-merge check of `feat-delivery-guidance-1-ready-check.md`,
fixed in !207 (merged 2026-10-15) and released in 2.9.1 (!208). Post-release
check passed 2026-10-15.

## Priority

high

The collision does more than clutter a menu: invoking a skill by name can load
the command runbook instead of `SKILL.md`, and the skill is where the blocking
rules live (see `## Reproduction`, step 3).

## Summary

The `greenberry` plugin ships `commands/` as slash commands next to `skills/`.
Fourteen runbooks share their name with a skill, so the `/` menu lists each of
those names twice, and a skill invoked by name can run on the runbook's text
instead of its own.

## User Story

As a developer using the greenberry plugin, I want each workflow to appear once
in the `/` menu and to run the skill when I pick it, so that I get the skill's
rules and not an older fallback text.

## Reproduction

1. In Claude Code (seen on v2.1.296) with `greenberry@ai-workflows` enabled,
   type `/greenberry:` in any project.
2. The menu shows `/greenberry:backlog` twice: once as "Backlog Runbook"
   (`commands/backlog.md`) and once with the skill's description. The same
   holds for `/greenberry:create-pr`. The demo recording frames of 2026-10-13
   show both.
3. In a session in this repo, a `Skill` tool call for `greenberry:backlog`
   returned the body of `commands/backlog.md` ("# Backlog Runbook", "Canonical
   runbook for drafting and updating backlog items"), not
   `skills/backlog/SKILL.md`. The runbook lacks the skill's blocking split
   check against `rules/mr-sizing.md`, its jira-ticket scope section and its
   size check before finishing.

Step 3 is one observation, for one skill. Which file wins for the other
thirteen names is not verified yet.

Verified 2026-10-15: the command wins. A test plugin with `commands/foo.md` and
`skills/foo/SKILL.md`, loaded with `claude -p … --plugin-dir`, loaded the command
for `ptest:foo`; on installed 2.9.0, `greenberry:backlog` and `greenberry:create-pr`
both returned their runbook.

## Acceptance Criteria

- Typing `/greenberry:` lists each skill once.
- Picking any of the fourteen colliding names, or asking for it in plain
  language, runs the skill's `SKILL.md`.
- `/greenberry:new-device-setup` and `/greenberry:safe-kill-port`, the two
  runbooks without a skill, still work as slash commands.
- `/greenberry:review-code` no longer appears; `/greenberry:code-review` is the
  only review entry.
- Synced projects keep their `commands/` runbooks, and Copilot keeps its
  generated `.github/prompts/`.

## How to verify

- [x] **After the 2.9.1 release:** after `/reload-plugins`, picking
  `/greenberry:backlog` loaded from `greenberry/2.9.1/skills/backlog` and opened
  with "# Backlog Skill" (on 2.9.0 the same pick gave "# Backlog Runbook"). The
  `/greenberry:` menu was checked by the maintainer in the same session.
- [x] Skill tool, all fourteen names plus two controls, on `main` after !207
  (`claude -p … --plugin-dir <worktree of 543e376>`): every colliding name loads
  its `SKILL.md` — backlog, close-sprint, commit-message, compact-sprint,
  create-pr, refinement, release-notes, sprint-demo and sprint-planning open with
  "# … Skill"; run-checks, scaffold-component, sustainable-review and
  work-backlog with their skill's heading, which differs from the runbook's;
  setup-ai-workflows shares its heading with the runbook, and the next line
  ("Use this skill when …") is the skill's. `safe-kill-port` still loads as a
  command; `review-code` is not found.
- [x] Same prompt on installed 2.9.0 for comparison: "# Backlog Runbook" and
  "# Create Pull Request" (runbooks).
- [x] `node scripts/validate-skills.mjs` with the new check: 14 errors on the old
  manifest, none after the fix.
- [x] `claude plugin validate .` on 543e376: "Validation passed with warnings".
  The warnings were there before: the runbooks have no frontmatter, and
  `CLAUDE.md` at the plugin root is not loaded as context. The validator lints
  every file under `commands/`, registered or not, so its list is not the
  registered set.
- [x] `commands/` is unchanged, so project sync and `.github/prompts/` are too; the
  pre-commit hook's project sync smoke test passes.

## Technical Notes

- `.claude-plugin/plugin.json` sets no `commands` key, so Claude Code scans the
  whole `commands/` directory. The manifest reference says `commands` *replaces*
  the default scan
  (https://code.claude.com/docs/en/plugins-reference, "How each key combines
  with its default location", read 2026-10-13). Listing only the two
  skill-less runbooks keeps them and drops the rest:

  ```json
  "commands": ["./commands/new-device-setup.md", "./commands/safe-kill-port.md"]
  ```

  Paths inside the default folder produce no "Default commands/ folder is
  ignored" warning, per the same page.
- The fourteen colliding names: backlog, close-sprint, commit-message,
  compact-sprint, create-pr, refinement, release-notes, run-checks,
  scaffold-component, setup-ai-workflows, sprint-demo, sprint-planning,
  sustainable-review, work-backlog. `review-code` has no name collision but
  duplicates `skills/code-review`.
- The runbook files stay in the repo and in the plugin. Several skills read
  them as their first step (`skills/sprint-demo/SKILL.md`: "Read
  `commands/sprint-demo.md`"), and `scripts/sync.sh` copies them into projects
  and generates `.github/prompts/` from them. Only their registration as slash
  commands goes.
- The ai-workflows marketplace entry sets no `commands` or `strict`, so it adds
  nothing back.
- This changes what the plugin ships: add a `changelog.d/fixed.<slug>.md`
  fragment, and do not touch `CHANGELOG.md` or the plugin `version`.
- Run `claude plugin validate .` and `bash scripts/validate-ai-instructions.sh`.
- `README.md` says Claude Code gets "skills and commands" from the plugin, and
  the manifest `description` names "fallback runbooks in commands/". Reword
  both where they would now mislead.
- Delivered: the manifest change and the `description` in !207, together with a
  `validate-skills.mjs` check that errors when a registered command shares a
  skill's name, and a step in `docs/contributing.md` ("Add Or Update A
  Command"). The `README.md` line follows in the MR that files this item.

## Out of Scope

- Renaming or moving `commands/`, or retiring the runbooks for Copilot.
- The routing table in `CLAUDE.md`: its command paths are file references, not
  slash commands.

## Related

- MR: https://gitlab.com/greenberrynl/config/ai-workflows/-/merge_requests/207
- [chore-skill-diet.md](chore-skill-diet.md)
- [chore-ambient-layer-trim-3-command-rows.md](chore-ambient-layer-trim-3-command-rows.md)
- [feat-delivery-guidance-1-ready-check.md](feat-delivery-guidance-1-ready-check.md)
- https://code.claude.com/docs/en/plugins-reference
