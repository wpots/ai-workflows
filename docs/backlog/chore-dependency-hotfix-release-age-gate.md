# Chore: dependency-hotfix Installs a Fix Younger Than the Release-Age Gate

## Status

<!-- draft | ready | in-progress | done -->

done

Filed and delivered on 2026-10-21. The npm override was verified at delivery
(Technical Notes).

## Ticket

<!-- no tracker ticket: this repo's own backlog -->

## Priority

medium

## Summary

unicore-template v4 and Trimbos set `minimumReleaseAge: 1440` in
`pnpm-workspace.yaml`. pnpm then refuses any version younger than a day, even
when the version is named exactly. A critical fix is usually hours old: Next
16.4.1 was published three minutes before its two critical advisories.
`dependency-hotfix` does not know the gate, so during the first day the install
fails, and the agent is left to improvise. The skill now bypasses the gate for
that one install and says so in the MR. `npm-maintenance` never bypasses it.

## User Story

As the developer running a critical hotfix on a project with a release-age gate,
I want the skill to install the fresh fix version on purpose and say so, so that
the gate does not cost a day of the 72 hours and is not switched off by
accident.

## Acceptance Criteria

- Step 2 of `dependency-hotfix` reads the gate:
  - `minimumReleaseAge` in `pnpm-workspace.yaml`, in minutes;
  - `min-release-age` in `.npmrc`, in days (npm 11.10 and later).
- Step 2 records the target version's age, read with `npm view <pkg> time --json`.
- When the target is younger than the gate, Step 4 installs it with an override
  on that one command: `pnpm add <pkg>@<version> --config.minimumReleaseAge=0`,
  or the npm equivalent verified at delivery. `pnpm-workspace.yaml` and `.npmrc`
  stay unchanged.
- The plan block and the MR description name the bypass: package, version, the
  version's age, the gate, and the advisory it fixes.
- The per-entry lockfile check in Step 4 names every changed entry that is
  younger than the gate. Only the fix package, its lockstep packages and their
  own dependencies may be among them. Any other young entry stops the run.
- `npm-maintenance` never bypasses the gate, in routine updates, majors or
  vulnerability fixes on development alike. When the newest version is too
  young, it takes the newest version that passes, and says which version waits
  and until when.
- In a project without a gate nothing changes, and neither skill proposes
  adding one.
- A changelog fragment `changelog.d/changed.dependency-hotfix-release-age-gate.md`.

## How to verify

- [x] pnpm 10.34.6, scratch project with `minimumReleaseAge: 1440`:
  `pnpm add next@16.5.0-canary.21 --lockfile-only` fails with
  `ERR_PNPM_NO_MATURE_MATCHING_VERSION`. The same command with
  `--config.minimumReleaseAge=0` resolves. A full
  `pnpm install --frozen-lockfile --ignore-scripts --no-optional` afterwards
  prints "Lockfile is up to date, resolution step is skipped" and installs, with
  the gate still on.
- [x] npm 11.21.1 (`npx --yes npm@11.21.1`), scratch project with
  `min-release-age=1` in `.npmrc`:
  - `npm install next@16.5.0-canary.21 --package-lock-only` fails with
    `ETARGET No matching version found … with a date before …`.
  - The same command with `--min-release-age=0` succeeds.
  - Afterwards, with the gate still on, `npm install --package-lock-only` is
    "up to date", and `npm ci --ignore-scripts --omit=optional` installs.
- [x] `node scripts/validate-skills.mjs` passes.
- [ ] Reviewer: read `skills/dependency-hotfix/SKILL.md` Step 2 (gate bullet),
  the Step 3 plan example (`Gate` line), and the Step 4 install and
  lockfile-diff bullets. Then read `skills/npm-maintenance/SKILL.md` §2,
  step 1.

## Technical Notes

**Probe, 2026-10-21, with pnpm 10.34.6** (the version unicore-template pins). It
ran in a scratch project with `minimumReleaseAge: 1440` and no other settings:

- `pnpm add next@16.5.0-canary.21 --lockfile-only` (11 hours old) fails with
  `ERR_PNPM_NO_MATURE_MATCHING_VERSION … does not meet the minimumReleaseAge
  constraint`.
- The same command with `--config.minimumReleaseAge=0` resolves and writes the
  lockfile.
- Afterwards, `pnpm install --frozen-lockfile --lockfile-only` and
  `pnpm install --lockfile-only` pass with the gate still on. The lockfile
  already satisfies the range, so nothing is resolved again.
- Not tested: a full `pnpm install --frozen-lockfile` with downloads, as CI runs
  it. Test it at delivery.

**pnpm 11** makes `minimumReleaseAgeStrict` default to `true` when the project
sets the gate itself, so an install of a too-young version fails there too.

**Rejected alternative.** `minimumReleaseAgeExclude: ["next@16.4.1"]` (exact
versions since pnpm 10.19) committed with the hotfix. It works, but it puts a
config change into a hotfix, and someone has to remove it later. The CLI
override leaves nothing behind.

**npm.** `min-release-age` (days) and `min-release-age-exclude` (names or globs)
exist since npm 11.10.0. Verified at delivery with npm 11.21.1:
`--min-release-age=0` on the one command switches the filter off, and later
installs pass with the gate on. No Greenberry npm project sets the gate today; a
local search of `~/Web` found only the two pnpm projects.

**Where it lands.**

- `skills/dependency-hotfix/SKILL.md` Step 2: a bullet on the gate.
- Step 4: the install bullet "Direct dependency: install the **exact** target
  version", and the lockfile-diff bullet.
- Step 3: a `Gate` line in the plan example.
- `skills/npm-maintenance/SKILL.md` §2: one sentence after the exact-version
  install bullet.

**Test level.** Prose rules, checked in review, plus `node
scripts/validate-skills.mjs`. A runnable eval would need a registry with a fresh
version. Skip it, and say so in the MR.

**Overlap.** `chore-dependency-checks-run-every-declared-script.md` edits the
validation bullet of the same Step 4. Whichever lands second rebases.

## Out of Scope

- Adding a release-age gate to projects, to the template, or to the shared
  Renovate config. That is a team decision, not a skill change.
- `trustPolicy` and `blockExoticSubdeps`, which unicore-template also sets.
- Renovate's own `minimumReleaseAge`: it governs Renovate's MRs, not a local
  install.

## Related

- [../../skills/dependency-hotfix/SKILL.md](../../skills/dependency-hotfix/SKILL.md)
- [../../skills/npm-maintenance/SKILL.md](../../skills/npm-maintenance/SKILL.md)
- [chore-dependency-checks-run-every-declared-script.md](chore-dependency-checks-run-every-declared-script.md)
- https://pnpm.io/settings/dependency-resolution — `minimumReleaseAge`, `minimumReleaseAgeExclude`, `minimumReleaseAgeStrict`
- [GHSA-673q-mjm6-r5xr](https://github.com/vercel/next.js/security/advisories/GHSA-673q-mjm6-r5xr), [GHSA-2464-fhr4-w9xw](https://github.com/vercel/next.js/security/advisories/GHSA-2464-fhr4-w9xw): published 2026-10-14 17:46 UTC; 16.4.1 at 17:43 UTC
