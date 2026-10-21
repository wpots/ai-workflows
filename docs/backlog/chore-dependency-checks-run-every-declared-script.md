# Chore: Dependency MRs Run Every Check the Project Declares

## Status

<!-- draft | ready | in-progress | done -->

done

Filed and delivered on 2026-10-21, in the MR that files the other
dependency-regression items. Maintainer decision on the day: Storybook checks
are opt-in and never block, and having Storybook in the repository is not the
opt-in.

## Ticket

<!-- no tracker ticket: this repo's own backlog -->

## Priority

high

## Summary

`npm-maintenance` validated with a fixed list (lint, types, tests, build) and
ran Storybook only "when the update can affect UI tooling". `dependency-hotfix`
ran lint, type-check, tests and the production build. Projects declare more than
that: innovatieroute has `ts-check`, `build-storybook` and `test:vrt`. Next 16.4
broke every Storybook story there, and nobody saw it for six days. Both skills
now run every build and test script the project declares. Storybook runs when
the project opts in, and its result never blocks.

## User Story

As the developer who merges a dependency MR, I want the MR to have run every
check the project has, so that a break in a declared check shows up in that MR
and not days later.

## Acceptance Criteria

- `npm-maintenance` § Validation builds its list from `package.json`: every
  script whose name is, or starts with, `lint`, `type-check`, `typecheck`,
  `ts-check`, `test` or `build`.
- Left out of that list:
  - watch mode, and baseline or snapshot updates (`*:update`);
  - scripts that open a UI or a browser window;
  - per-environment variants of a script already in the list (`build:local:ghz`
    when `build` runs);
  - a script that another script in the list already calls (`test:shell` when
    `test` is `jest && npm run test:shell`);
  - Storybook checks, unless the project opted in.
- A script that rewrites files (`--fix`, `--write`) does not run as declared.
  Its check-only form runs instead when the project declares one (`lint:check`).
  Otherwise it is listed as skipped, with the reason "writes files".
- Storybook checks (`build-storybook`, `test-storybook`, and a `vitest` script
  that runs the Storybook project) run only when a job in the project's CI runs
  one of them, or when the user asks for them. Storybook being in the repository
  does not count as opting in.
- A failing Storybook check is reported in the summary and the MR description,
  with the failing stories. It does not stop the run and does not keep the MR in
  Draft.
- Every script in the list runs once, on its own, and its exit code is read.
- A script that cannot run on the machine is listed as skipped, with the reason:
  it needs a database, browsers or secrets the machine does not have. "Not
  relevant to this bump" is not a reason.
- When a check fails, the failing tests or stories run once more without the
  bump before the bump is blamed: on the target branch, with that branch's own
  lockfile installed. A failure that also happens there is reported as
  pre-existing, with its cause when known.
- `dependency-hotfix` Step 4 runs the same list. It points to `npm-maintenance`
  § Validation instead of copying the rule. A failing production build stops the
  hotfix, as before.
- The `npm-maintenance` summary and the hotfix plan's `Verified` line list every
  check with its result, skipped ones included.
- Eval case `evals/npm-maintenance/npm-maintenance-5` covers the selection on
  innovatieroute's `scripts` block, where Storybook is not opted in.
  `npm-maintenance-6` covers an opted-in Storybook build that fails without
  blocking.
- A changelog fragment `changelog.d/changed.dependency-checks-every-declared-script.md`.

## How to verify

- [ ] `node scripts/validate-skills.mjs` prints `OK: 38 skills validated, 97 docs link-checked, no errors.`
- [ ] `claude plugin eval . --case 'npm-maintenance-*' --runs 1 --ablation none --no-publish --trust-plugin --judge-model sonnet --max-cost-usd 0` loads every case without a `✗`.
- [ ] `claude plugin eval . --case npm-maintenance-5 --runs 1 --ablation none --no-publish --trust-plugin --judge-model sonnet --max-cost-usd 3`: every grader passes.
- [ ] The same with `--case npm-maintenance-6`: every grader passes.
- [ ] Read `skills/npm-maintenance/SKILL.md` § Validation and `skills/dependency-hotfix/SKILL.md` Step 4 side by side. The hotfix points to § Validation and does not repeat its list.

## Technical Notes

**What happened in innovatieroute** (`origin/development`, read 2026-10-21):

| When | Commit or MR | `next` in the lockfile |
| --- | --- | --- |
| 2026-10-14 | !918 `chore(deps)`, the maintenance run | 16.3.6 → 16.3.8 |
| 2026-10-14 | `98dbc9c6` "Regenerate package lock to see if this helps the development build on Exonet" | 16.4.0 |
| 2026-10-15 | `5038194c` "regenerate package-lock to fix build errors" | 16.4.1 |
| 2026-10-20 | !927 "fix(storybook): restore visual regression tests on Next 16.4" | — |

16.4.1 carries the fix for two critical advisories (GHSA-673q-mjm6-r5xr,
GHSA-2464-fhr4-w9xw). 16.3.x got no backport, so a hotfix would have had to
cross the minor anyway. The minor could not have been avoided. Catching the
break in the same MR could have happened, had the project opted in to Storybook
checks.

!927 names the cause: Next 16.4's `useRouter` reads
`LayoutRouterContext.parentRenderTree.data`, which Storybook 10.6's mocked app
router does not provide. `@storybook/nextjs-vite` declares
`next: ^14.1.0 || ^15.0.0 || ^16.0.0`, so npm gave no peer warning. The project's
CI runs only `npm t`, so the pipeline stayed green.

**Why Storybook is opt-in.** The maintainer's call. Many repositories carry a
Storybook nobody maintains. A gate that switches on just because Storybook is
present would make dependency work fail on Storybook drift that has nothing to
do with the bump. A project that wants the signal adds a CI job, which should
be non-blocking (`allow_failure: true`), and the skills run the same check
locally.

**Pre-existing failures are real.** !927's visual regression run had 2
failures out of 323, and both came from VIG-1083 (`c3be5d3e`), not from Next
16.4. Without the rerun on the target branch, the bump would have taken the
blame for them.

**Why not through `run-checks`.** It runs what CI runs: the CI v4 `verify`
list when there is one (default `lint:check`, `type-check`, `test`, so no
build), and otherwise a fixed sweep (`lint`, `type-check`, `stylelint`, `test`,
`build`). Either way it would skip `ts-check` here. A dependency MR needs
every declared check, not CI's subset, so this item leaves `run-checks` alone.

## Out of Scope

- `skills/run-checks`: it got CI v4 parity in 2.11.0 and stays as it is.
- CI configuration in projects. `feat-maintenance-declared-checks-ci-skips.md`
  reports the gap; the project decides what to do about it.
- Two ideas considered and dropped:
  - A dependents analysis in `risk-analysis.md`.
  - Exact pins in `package.json`. In this case the minor carried the critical
    fix, so a pin would only have made the jump explicit.
- Repairing a Storybook break: the project does that, as !927 did.

## Related

- [../../skills/npm-maintenance/SKILL.md](../../skills/npm-maintenance/SKILL.md)
- [../../skills/dependency-hotfix/SKILL.md](../../skills/dependency-hotfix/SKILL.md)
- [../../skills/run-checks/SKILL.md](../../skills/run-checks/SKILL.md)
- [feat-maintenance-declared-checks-ci-skips.md](feat-maintenance-declared-checks-ci-skips.md)
- [chore-dependency-hotfix-release-age-gate.md](chore-dependency-hotfix-release-age-gate.md)
- [innovatieroute!927](https://gitlab.com/greenberrynl/rijksoverheid/ministerie-van-volksgezondheid-welzijn-en-sport/innovatieroute/-/merge_requests/927)
