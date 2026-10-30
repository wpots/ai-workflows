# Feature: Maintenance Sweep Hands a Critical on Production to dependency-hotfix

## Status

<!-- draft | ready | in-progress | done -->

in-progress

Filed 2026-10-21 from a question after the plugin demo: how do the skills
chain, for example maintenance into a hotfix via main. Ready check
the same day: every point passes; flipped to `ready` by the maintainer.

## Ticket

<!-- no tracker ticket: this repo's own backlog -->

## Priority

medium

## Summary

`skills/maintenance` finds criticals in lane A, through the Inventory mode of
`npm-maintenance`, but treats them like any other finding: a ranked line and a
proposed backlog item. Nothing in the skill points at `skills/dependency-hotfix`,
the skill that owns a critical's path to production. This item makes the report
name the hotfix as the next step for a critical that runs on production, and
keeps that critical out of the backlog list.

## User Story

As the developer running the monthly sweep, I want a critical that runs on
production to come out of the report as "run dependency-hotfix now", so that it
reaches production within the 72 hours agreed for criticals instead of waiting
in the backlog for the next release.

## Acceptance Criteria

- For every critical vulnerability lane A finds, the finding says whether it
  runs on production: "on production" when the production branch's lockfile
  resolves the package to a version inside the advisory's vulnerable range,
  "development only" when it does not.
- A critical on production makes lane A's verdict `urgent`, and its finding's
  fix names `/greenberry:dependency-hotfix` with the package and the advisory.
- While a critical runs on production, the verdict block of the report ends with
  one `Next step:` line naming `/greenberry:dependency-hotfix` and the
  package(s). Several criticals on production share that one line, because one
  hotfix run moves several packages together.
- A critical on production does not appear in the proposed backlog list. A
  critical that is "development only" stays on the regular path: its fix names
  `skills/npm-maintenance`, and it is proposed as a backlog item under the
  existing threshold.
- When the production branch or its lockfile cannot be read, the finding says
  "production not checked" and is handled as on production. The report never
  downgrades a critical because the check did not run.
- The sweep stays read-only: it does not start `dependency-hotfix`, create a
  branch or MR, or create, comment on or transition a ticket.

## How to verify

## Technical Notes

**Where it lands.** The SKILL.md body was at 499 of its 500-line budget, so
the check and its routing went into a reference that loads only when a critical
turns up:

- `skills/maintenance/references/production-check.md`: the production check
  below, the "on production" / "development only" / "production not checked"
  label, and per label lane A's verdict, the fix, the backlog exclusion, and the
  hotfix's place before every other fix (its Step 3 plan is the approval, so the
  sweep adds none of its own).
- `skills/maintenance/SKILL.md`, lane A: the critical bullet links that check.
- `skills/maintenance/references/report-format.md` §1 "Scope and verdicts": the
  `Next step:` line. The report layout moved there after this item was filed;
  there is no "Verdict per lane" heading any more.

**The production check.** Read-only, on the local checkout:

- Production branch: the rule `dependency-hotfix` uses — `main`, or `master`
  when there is no `main` (its Step 1 table).
- `git fetch origin <branch>`, then read the lockfile with
  `git show origin/<branch>:<lockfile>` into the scratchpad. Lockfile by package
  manager, as lane 0 records it: `package-lock.json` →
  `packages["node_modules/<name>"].version` (every nested
  `node_modules/**/node_modules/<name>` entry too); `pnpm-lock.yaml` → the
  `<name>@<version>` keys under `packages:`.
- The vulnerable range comes from the audit output the Inventory mode already
  produced (`npm audit --json` → `vulnerabilities.<name>.range`; pnpm audit →
  `advisories.*.vulnerable_versions`). Test each resolved version with
  `npx --yes semver -r "<range>" <version>`, which prints the version when it is
  inside the range and nothing when it is not.

**Why the check is needed.** The sweep audits the local checkout, usually the
development branch. The dependency scanner reads production, and
`dependency-hotfix` is triggered from its report, so a critical the sweep finds
may or may not be on production. Without the check, a critical fixed on
development but still live on production reads as done.

**Test level.**

- Eval case `evals/maintenance/maintenance-2`, runnable, with the facts in the
  prompt: an `npm audit --json` excerpt with two criticals, a production
  lockfile that resolves one of them inside its range and the other outside it.
  Graders: one `Next step:` naming `/greenberry:dependency-hotfix` and only the
  first package, no backlog line for the first package, a backlog line for the
  second. A grader for lane A `urgent` was dropped: the base already gives any
  critical `urgent`, so it cannot fail. Follow `evals/README.md`.
- `node scripts/validate-skills.mjs`.
- The skill's `description` does not change, so the routing evals do not run.

**Overlap.** `feat-critical-ticket-age-flag.md` also edits lane A and the Report
layout of the same skill. The two are independent; whichever lands second
rebases.

**Changelog.** Fragment `changelog.d/changed.maintenance-critical-hotfix-handoff.md`,
because this changes what the plugin ships.

## Out of Scope

- Starting `dependency-hotfix` from the sweep, or any write it would do.
- Highs and lower: they stay on `npm-maintenance` on development, as the routing
  in `CLAUDE.md` says.
- Linking a critical to an open `maintenance:critical` ticket and its age: that
  is `feat-critical-ticket-age-flag.md`.
- `skills/greenberry-maintenance`: the portfolio inventory runs no audit per
  project.
- `Next step:` lines in other skills, and a page that shows how skills chain:
  `feat-delivery-guidance-3-next-step-in-recaps.md` and
  `feat-delivery-guidance-4-path-page.md` cover the delivery path; the other
  flows are not filed.

## Related

- [../../skills/maintenance/SKILL.md](../../skills/maintenance/SKILL.md)
- [../../skills/dependency-hotfix/SKILL.md](../../skills/dependency-hotfix/SKILL.md)
- [../../skills/npm-maintenance/SKILL.md](../../skills/npm-maintenance/SKILL.md): "Maintenance ticket" already sends a critical on production to `dependency-hotfix`
- [feat-critical-ticket-age-flag.md](feat-critical-ticket-age-flag.md)
- [feat-delivery-guidance-3-next-step-in-recaps.md](../2026-q4/feat-delivery-guidance-3-next-step-in-recaps.md)
