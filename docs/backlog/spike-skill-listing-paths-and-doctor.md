# Spike: Measure the Skill Listing, and Test `paths:` on Stack-Specific Skills

## Status

<!-- draft | ready | in-progress | done -->

in-progress

Go for the headless probe runs on the maintainer's seat given 2026-10-28
("implement T11").

Filed 2026-10-21 from rank 8 (F4/F10, "context pass") of the October 2026 stack
review (`docs/audits/2026-10.md`). The ambient-layer trim from that
rank is done: `CLAUDE.md` went from 25,195 bytes to 19,599 bytes on `main`. Two
parts are still open:
- nobody has run `/skill-doctor`;
- no skill uses `paths:`.

## Ticket

[Audit 2026-10](../audits/2026-10.md) — roadmap item 8

## Priority

low

## Summary

Run `/skill-doctor` once to see what each Greenberry skill costs in the listing
and which ones never fire. Test whether `paths:` frontmatter keeps a plugin skill
out of sessions in projects without that stack, without breaking its triggers
where the stack is present. Record the numbers and a keep/apply decision; the
edits themselves are follow-up items.

## User Story

As the maintainer, I want measured listing costs and a tested answer on
`paths:`, so that I trim the skills that cost the most and scope the
stack-specific ones, instead of guessing which description to shorten.

## Acceptance Criteria

- The `/skill-doctor` report for a session with the `greenberry` plugin enabled
  is recorded in this item: the per-skill cost of the Greenberry skills, and
  which of them it lists as never invoked. Record the Claude Code version and
  the date with it.
- Each of these questions is answered yes or no, with the command run and its
  output:
  - Does a **plugin** skill with `paths:` still appear in the skill listing in
    a session where no matching file has been read or edited?
  - Does it still fire on its trigger phrase in that session?
  - Can the user still run it with `/greenberry:<name>`?
  - Does it fire once a matching file has been read?
- A decision on `payload-jobs`, `migration-check` and `datocms-migration`: add
  `paths:` (with the globs), or leave them listed everywhere. The reason is
  written down.
- Every edit the decision leads to is filed as its own backlog item, under the
  sizing rules. This spike changes no `SKILL.md`.

## How to verify

<!-- Filled in by whoever delivers the item. -->

## Technical Notes

What the docs say, read 2026-10-21 (https://code.claude.com/docs/en/skills):

- **`paths`.** "Glob patterns that limit when this skill is activated. Accepts
  a comma-separated string or a YAML list. When set, Claude loads the skill
  automatically only when working with files matching the patterns. Uses the
  same format as path-specific rules."
- **What the docs leave open about `paths`:**
  - whether a skill with `paths:` is still listed before a match;
  - whether the model or the user can still invoke it without one;
  - whether `paths` applies to plugin skills at all
    (https://code.claude.com/docs/en/plugins/components does not mention it).
- **What counts as a match.** For path-scoped rules, a match is a Read, Write
  or Edit (or a Bash read such as `cat`) of a matching file
  (https://code.claude.com/docs/en/memory#path-specific-rules). Assume the same
  for skills until the probe shows otherwise.
- **The listing.** The combined `description` and `when_to_use` "is truncated
  at 1,536 characters in the skill listing". The whole listing has a budget
  that "scales at 1% of the model's context window". On overflow, Claude Code
  drops descriptions "starting with the skills you invoke least". The settings
  are `skillListingMaxDescChars` and `skillListingBudgetFraction`.
  Correction to the October review, which left the 1% figure out as "not in the
  official docs": it is in them now.
- **`/skill-doctor`.** It reports what each skill costs and how often it runs,
  flags skills that were never invoked, and lists plugins not used recently.
  With `-p` it prints the report as text. The minimum version conflicts: the
  skills page says v2.1.252, the changelog lists it under 2.1.261. The docs do
  not say whether it spends model tokens, or which history it reads.

Probe, on a throwaway branch. `claude -p --plugin-dir <worktree>` loads that
branch's skills over the installed plugin.

1. In a worktree, add `paths: ["**/payload.config.ts"]` to
   `skills/payload-jobs/SKILL.md`. Do not commit it to a branch that will merge.
2. In a scratch directory with no `payload.config.ts`, run
   `claude -p --plugin-dir <worktree> --output-format json "<payload-jobs trigger phrase>"`.
   Check whether a `Skill` tool call to `greenberry:payload-jobs` happens.
   Repeat with `/greenberry:payload-jobs`.
3. Repeat in a scratch directory that has a `src/payload.config.ts`. Run it once
   with a prompt that reads that file first, and once without.
4. Run `claude -p "/skill-doctor"` in this repo, then in one client project
   with the plugin enabled.

Why the probe matters: the triggers of these three skills are often typed
before any file is open ("jobs draaien dubbel", "maak een DatoCMS migratie").
If `paths:` hides the skill until a matching file is read, the trigger misses
in exactly that case. `skills/maintenance` lane F delegates to `payload-jobs`
by name, so check that the delegation still works when the skill is hidden.

Cost: four or five short `claude -p` runs and two `/skill-doctor` runs, on the
maintainer's seat. The maintainer's 2026-10-08 decision keeps model spend
manual and local, so this needs her go. The routing suite, at about $1.81 for 10
cases, is the nearest measured comparison. Expect well under that.

Each probe needs the sandbox bypass. `claude -p` needs api.anthropic.com, and
the sandbox blocks that host.

## Out of Scope

- Editing any `SKILL.md`, `CLAUDE.md` or rules file. That is follow-up work,
  one item per change.
- `paths:` on command files. The docs contradict each other on whether commands
  support it, and this repo registers only two commands.
- Changing `skillListingMaxDescChars` or `skillListingBudgetFraction` in
  settings.

## Related

- `docs/ai-stack-review-2026-10.md`, rank 8 (untracked, maintainer's local copy)
- [../../skills/payload-jobs/SKILL.md](../../skills/payload-jobs/SKILL.md)
- [../../skills/migration-check/SKILL.md](../../skills/migration-check/SKILL.md)
- [../../skills/datocms-migration/SKILL.md](../../skills/datocms-migration/SKILL.md)
- [../../skills/maintenance/SKILL.md](../../skills/maintenance/SKILL.md)
- https://code.claude.com/docs/en/skills
