# Spike: Measure the Skill Listing, and Test `paths:` on Stack-Specific Skills

## Status

<!-- draft | ready | in-progress | done -->

done

Go for the headless probe runs on the maintainer's seat given 2026-10-28
("implement T11"). Probe spend: $1.48 on Sonnet. `/skill-doctor` and `/context`
cost nothing.

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

Every run needs the sandbox bypass (`claude -p` reaches api.anthropic.com).
`<probe>` is a detached worktree of `gitlab/main`, never committed, with
`paths: ["**/migrations/*.ts"]` added to `skills/migration-check/SKILL.md` and
`paths: ["**/payload.config.ts"]` added to `skills/payload-jobs/SKILL.md`.
`<empty>` is a scratch directory holding only a `README.md`. `<payload>` is a
scratch directory with `src/payload.config.ts` and
`src/migrations/20261028_120000.ts`.

- [ ] `claude -p "/skill-doctor"` in this repo prints the report under
      Findings. With `--output-format json` it shows `total_cost_usd: 0`.
- [ ] `claude plugin validate <probe>` reports no warning for either
      `SKILL.md`, so `paths:` parses.
- [ ] `--plugin-dir` really replaces the installed plugin: a marker sentence
      added to `commit-message`'s description in `<probe>` moves its `/context`
      row from `~60` to `~150`.
- [ ] Q1, in `<empty>`: `claude -p "/context" --plugin-dir <probe>` and the
      same run against an unchanged worktree both list
      `greenberry:migration-check` at `~150` tokens. Asked with no tools to
      quote its listing line, Sonnet returns the full description in both arms.
- [ ] Q2, in `<empty>`:
      `claude -p "<trigger>" --model sonnet --output-format stream-json --verbose --plugin-dir <probe>`.
      The first tool call is `Skill {"skill":"greenberry:migration-check"}`
      for "Ik heb net een Payload migratie gegenereerd en npm run migrate faalt
      met 'relation "users" already exists'. Check de migratie voordat ik hem
      commit.", and `Skill {"skill":"greenberry:payload-jobs"}` for "Onze
      Payload jobs draaien dubbel sinds we op Clever Cloud naar twee instances
      zijn gegaan. Wat moeten we checken?".
- [ ] Q3, in `<empty>`: `claude -p "/greenberry:migration-check" … --plugin-dir <probe>`
      runs the skill body ("Starting with step 1: locating the migrations
      directory"). The `init` event lists the skill in `skills` and
      `slash_commands`.
- [ ] Q4, in `<payload>`: a prompt that reads
      `src/migrations/20261028_120000.ts` first gives `Read`, then
      `Skill {"skill":"greenberry:migration-check"}`. The Read result carries no
      injected skill text.

## Findings

Measured 2026-10-28 on Claude Code 2.1.296 with plugin `greenberry` 2.14.3.
Opus 5.5, Sonnet 5.5 and Haiku 5.5 all report a 1M context window here.

### The listing is already at its budget

- `/context` reports the Skills row at 10k tokens, 1.0%: the budget itself. It
  is the same on all three models. Greenberry's 40 rows (38 skills and the two
  commands) take about 5.45k of the 10k.
- Over budget, Claude Code drops the descriptions of the least-invoked skills.
  In every measured session these Greenberry skills were listed by name only:
  `datocms-migration`, `greenberry-maintenance`, `payload-jobs`,
  `user-journeys` and `wcag-audit`. In this repo `component-spec` is also
  name-only. The set shifts with what else loads: `architecture-review` was
  name-only in one interactive session and listed in the headless runs.
- So trimming a description saves no tokens on this setup. The listing costs
  its budget either way, and a trim only lets one more description in. A
  teammate whose listing fits under the budget does save the trimmed tokens.
- Each name-only skill has a trigger row in the mapping table of `CLAUDE.md`.
  `payload-jobs` fired on a Dutch trigger with only its name in the listing.
  Its row (`jobs draaien dubbel` → `skills/payload-jobs`) and the name itself
  are the only text that could have routed it. For these skills the table is
  not a duplicate of the descriptions: it is the routing text that is left.
- The ambient layer, `~/.claude/rules/ai-workflows.md`, is 22,022 bytes and
  8.5k tokens. That is up from 18,866 bytes after the October trim; about 2 KB
  of the growth is the Node pin section. In this repo it loads twice, once as
  the user rule and once as the project `CLAUDE.md`, so 17k tokens per session.
  Elsewhere it loads once.

### `/skill-doctor` report, Greenberry rows

Run in this repo. `uses` and `last used` count the sessions on the
maintainer's machine only; a teammate's numbers differ. The client-project run
from probe step 4 was skipped: the listing is per user and plugin, and the five
name-only skills were the same in a scratch directory outside any project.

| Skill | Listing | Uses | Last used |
| --- | --- | --- | --- |
| architecture-review | ~120 | 0 | never |
| component-spec | < 20 | 0 | never |
| datocms-migration | < 20 | 0 | never |
| greenberry-maintenance | < 20 | 0 | never |
| payload-jobs | < 20 | 0 | never |
| user-journeys | < 20 | 0 | never |
| wcag-audit | < 20 | 0 | never |
| maintenance | ~190 | 1 | 42 days |
| test-driven-development | ~140 | 1 | 29 days |
| migration-check | ~150 | 1 | 21 days |
| npm-maintenance | ~160 | 3 | 20 days |
| release | ~340 | 1 | 19 days |
| new-device-setup (command) | – | 2 | 12 days |
| safe-kill-port (command) | – | 1 | 12 days |
| compact-sprint | ~210 | 1 | 12 days |
| refinement | ~150 | 3 | 12 days |
| release-notes | ~160 | 3 | 12 days |
| scaffold-component | ~80 | 1 | 12 days |
| sprint-demo | ~180 | 3 | 12 days |
| sprint-planning | ~170 | 4 | 12 days |
| sustainable-review | ~160 | 2 | 12 days |
| setup-ai-workflows | ~230 | 7 | 8 days |
| run-checks | ~70 | 5 | 7 days |
| address-review-comments | ~120 | 15 | 6 days |
| close-sprint | ~250 | 5 | 6 days |
| watch-mrs | ~180 | 45 | 6 days |
| start-project | ~270 | 2 | 5 days |
| dependency-hotfix | ~250 | 1 | 3 days |
| improve-skill | ~260 | 37 | 1 day |
| backlog | ~130 | 48 | today |
| code-review | ~130 | 44 | today |
| commit-message | ~60 | 27 | today |
| create-pr | ~70 | 86 | today |
| jira-ticket | ~180 | 26 | today |
| mr-merged | ~200 | 37 | today |
| receiving-code-review | ~160 | 8 | today |
| service-cli | ~170 | 12 | today |
| upstream-rules | ~140 | 16 | today |
| upstream-to-unicore | ~260 | 15 | today |
| work-backlog | ~110 | 42 | today |

Never invoked on this machine: `architecture-review`, `component-spec`,
`datocms-migration`, `greenberry-maintenance`, `payload-jobs`,
`user-journeys` and `wcag-audit`.

### `paths:` on a plugin skill

| Question | Answer |
| --- | --- |
| Still listed before a match? | Yes, with its full description |
| Fires on its trigger without a match? | Yes |
| Runs as `/greenberry:<name>`? | Yes |
| Fires once a matching file was read? | Yes, through the Skill tool, with nothing injected |

On 2.1.296, `paths:` on a plugin skill has no observable effect. It saves no
listing tokens and does not scope invocation. `skills/maintenance` lane F still
reaches `payload-jobs` by name, because the skill is never hidden.

### Decision

Leave `payload-jobs`, `migration-check` and `datocms-migration` listed
everywhere, without `paths:`.

- It buys nothing measurable today (above).
- If it starts gating, it would gate in the wrong place for us. The docs
  (re-read 2026-10-28) say a `paths` skill does not activate for files outside
  the session's working directory, "such as those in a sibling git worktree".
  Greenberry work happens in `~/.worktrees/<repo>-<slug>`, outside it, and
  these triggers are typed before any file is open.
- Revisit when the Claude Code changelog gives `paths` a listing effect for
  plugin skills.

No follow-up item is filed: the decision leads to no edit.

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
    Re-read 2026-10-28: the skills page now says plugin skills take "every
    field in the table above", and that patterns match only inside the
    session's working directory, so not in a sibling worktree. The first two
    points are still open in the docs; the probe answers them (Findings).
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

- [../audits/2026-10.md](../audits/2026-10.md), rank 8
- MR: https://gitlab.com/greenberrynl/config/ai-workflows/-/merge_requests/304
- [../../skills/payload-jobs/SKILL.md](../../skills/payload-jobs/SKILL.md)
- [../../skills/migration-check/SKILL.md](../../skills/migration-check/SKILL.md)
- [../../skills/datocms-migration/SKILL.md](../../skills/datocms-migration/SKILL.md)
- [../../skills/maintenance/SKILL.md](../../skills/maintenance/SKILL.md)
- https://code.claude.com/docs/en/skills
