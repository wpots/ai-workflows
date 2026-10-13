# Feature: Flag open critical tickets older than 72 hours in the maintenance reports

## Status

ready

Readiness pass 2026-10-13: no decision open. The lookup it reuses is "The
critical ticket" in `skills/npm-maintenance/references/maintenance-ticket.md`;
neither maintenance skill calls it yet. The eval case in Technical Notes
carries its facts in the prompt, so the automated check needs no live ticket.
The live checks in `How to verify` need a Jira project with an open
`maintenance:critical` ticket. Until the dependency scanner's ticket job is
switched on (it waits for the gb-dashboard `CRON_SECRET` rotation), those
tickets only come from `dependency-hotfix` — when none is open at delivery,
put the over-72-hour check first in `How to verify` and leave the item
`in-progress`.

## Priority

medium

## Summary

A critical on production gets its own Jira Task with label
`maintenance:critical` (ai-workflows!172). Nothing reports one that stays
open, so the 72-hour agreement goes unchecked. And while such a ticket is
open, the scanner files no new ticket for that Jira project. Both
maintenance reports list the open critical tickets with their age and flag
every one older than 72 hours.

## User Story

As the developer on the maintenance rotation, I want the maintenance report to
show which critical tickets are still open and for how long, so that a missed
72-hour deadline, and a ticket that blocks the scanner's next one, show up
without searching Jira.

## Acceptance Criteria

- The dependency lane (A) of `maintenance` lists every open
  `maintenance:critical` ticket in the project's Jira project: key, summary,
  status, assignee and age.
- Age runs from the ticket's creation to the moment of the run. A ticket open
  longer than 72 hours is flagged, and lane A's verdict is `urgent` while one
  is.
- With no open critical ticket, lane A says so in one line ("no open critical
  tickets"). The check is never left out silently.
- In a Jira project that holds several GitLab projects (IAMS, IDHM), the lane
  lists the open tickets with the note "shared Jira project", because the
  ticket may belong to another GitLab project.
- `greenberry-maintenance` reports the open `maintenance:critical` tickets per
  Jira key of the Live projects in the Notion register, with key, age and the
  72-hour flag, and names every GitLab project that shares that key.
- A Live project without a Jira key in Notion is listed as "no Jira key, not
  checked", never as "no open tickets".
- When Jira cannot be read (no `jira` CLI, no authentication, an error), the
  report says the check did not run. It never reports "no open tickets" in
  that case.
- Both skills only read Jira. They create, comment on, link or transition no
  ticket, and they never call the gb-dashboard endpoint.

## How to verify

- [ ] Run `/greenberry:maintenance` with scope `deps` in a project whose
      Jira project has an open `maintenance:critical` ticket older than 72
      hours. The report lists the ticket with its age and the flag, and lane
      A reads `urgent`.
- [ ] Run the same in a project without one. Lane A has the one-line "no
      open critical tickets".
- [ ] Run it with `jira` unauthenticated. The report says the check did not
      run.
- [ ] Run `/greenberry:greenberry-maintenance`. The report has the
      critical-ticket table per Jira key, and `git diff` shows changes only
      under `docs/maintenance/`.
- [ ] `node scripts/validate-skills.mjs` passes, and the new eval case
      (Technical Notes) passes with `claude plugin eval`.

## Technical Notes

**Query.** Both skills use the lookup from "The critical ticket" in
`skills/npm-maintenance/references/maintenance-ticket.md`, through the `jira`
CLI (`skills/service-cli`). Point to that section instead of copying the
command:

```sh
jira issue list -p <KEY> -q 'labels = "maintenance:critical" AND statusCategory != Done' --order-by created --plain --columns key,status,summary,assignee,created
```

The sort goes in `--order-by`; an `ORDER BY` inside `-q` fails with a 400.

**The Jira key.**

- `maintenance` runs inside one project. Take the key from the ticket
  convention in `CONVENTIONS.md` or from recent MR titles (`RFW-325: …`).
  When neither shows it, ask.
- `greenberry-maintenance` already reads the Notion register. Use each row's
  `Jira key` property; gb-dashboard's endpoint reads the same property. Query
  each key once, because projects can share one.

**72 hours** comes from the dev weekly of 30 September 2026: critical within
72 hours, high within two weeks. Keep the threshold in one place per skill.

**Why a stale ticket matters beyond the deadline.** gb-dashboard's
`src/app/api/create-issue/[gitlabId]/vulnerability/route.js` skips a Jira
project while it has an open `maintenance:critical` ticket
(`getIssuesByLabel`, `statusCategory != Done`). A ticket left open
therefore silences the scanner for that Jira project. In a shared one that
includes the other GitLab projects too.

**Where it lands.**

- `skills/maintenance/SKILL.md`: lane A first delegates to the Inventory mode
  of `npm-maintenance`. The ticket check is a tracker read, not an npm one, so
  it belongs to lane A itself, after the delegation. Under "Report", an
  over-72-hour ticket is an `urgent` finding. Name the assignee as the
  person on it, not as the owner.
- `skills/greenberry-maintenance/SKILL.md`: a "Jira" bullet under step 4.
  `references/sources-and-evidence.md` gets Jira as a read-only source (CLI,
  query, key per Notion row). It also gets the gb-dashboard endpoint as the
  creator of these tickets, with the note that it is never called, because a
  POST creates a ticket. The skill's "Grenzen" already forbids starting
  external tickets; reads are allowed.
- An eval case `evals/maintenance/maintenance-1`, runnable with the facts in
  the prompt (Jira project RFW with RFW-330, `maintenance:critical`, Open,
  created four days before the run). It expects the flag and `urgent`. Follow
  `evals/README.md`.
- A changelog fragment `changelog.d/added.critical-ticket-age-flag.md`,
  because this changes what the plugin ships.

## Out of Scope

- Closing, transitioning or commenting on tickets, and nudging the assignee
  over Slack or mail.
- A signal pushed to someone when a ticket passes 72 hours. That needs a
  scheduled check outside these skills, for example in gb-dashboard or the
  scanner.
- Highs. They get no ticket of their own, so there is nothing to age here;
  their two-week deadline is visible in the scanner report.
- Changes to the gb-dashboard endpoint, such as dedup per GitLab project
  instead of per Jira project.

## Related

- [ai-workflows!172](https://gitlab.com/greenberrynl/config/ai-workflows/-/merge_requests/172): criticals get their own ticket instead of a subtask (merged 12 October 2026)
- [../../skills/npm-maintenance/references/maintenance-ticket.md](../../skills/npm-maintenance/references/maintenance-ticket.md)
- [../../skills/maintenance/SKILL.md](../../skills/maintenance/SKILL.md)
- [../../skills/greenberry-maintenance/SKILL.md](../../skills/greenberry-maintenance/SKILL.md)
- [../../skills/service-cli/SKILL.md](../../skills/service-cli/SKILL.md)
- [gb-dashboard!5](https://gitlab.com/greenberrynl/the-orchard/gb-dashboard/-/merge_requests/5): the ticket route answers with the new ticket's key, or 502
- [dependency-scanner!12](https://gitlab.com/greenberrynl/the-greenhouse/dependency-scanner/-/merge_requests/12): the scanner's ticket job
