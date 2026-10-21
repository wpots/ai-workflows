# Feature: Maintenance Sweep Reports Declared Checks That CI Never Runs

## Status

<!-- draft | ready | in-progress | done -->

done

Filed 2026-10-21 after Storybook broke on Next 16.4 in innovatieroute, and
delivered the same day.

## Ticket

<!-- no tracker ticket: this repo's own backlog -->

## Priority

medium

## Summary

innovatieroute's pipeline runs only `npm t`. Its `package.json` also declares
`lint`, `ts-check` and `build`, and nothing runs them on a push or an MR. A
build break then reaches a developer, or the host's build, first. Lane E of the
sweep lists every declared check and whether CI runs it. Storybook checks are
opt-in, so their absence from CI is never a finding.

## User Story

As the developer running the monthly sweep, I want to see which of the
project's checks CI never runs, so that a gap like "the build is not in CI"
becomes a project follow-up before a dependency bump breaks it unnoticed.

## Acceptance Criteria

- Lane E of `maintenance` lists the project's declared checks and, per check,
  either `CI: <job name>` or `not in CI`. The selection rule is the one in
  `npm-maintenance` § Validation, referenced and not copied.
- A check counts as run by CI when the `script:` of a job in `.gitlab-ci.yml`
  calls it: `npm run <name>`, `pnpm run <name>`, or `npm test` / `npm t` for
  `test`.
- The scripts a called script runs itself count too: a job that runs
  `npm run ci`, where `"ci": "npm run lint && npm test"`, covers `lint` and
  `test`.
- With a CI v4 include (`ci-components/node-npm` or `node-pnpm`), the names in
  the `verify` job's `scripts` input count as run, or its default
  `[lint:check, type-check, test]` when the input is absent. Read it with
  `skills/run-checks/scripts/ci-parity.mjs` (2.11.0), not with a second parser.
- Other `include:` entries, such as `greenberrynl/config/ci`, are not resolved.
  The lane says so once and never assumes what they run.
- `build` not in CI is a `high` finding when the host builds on deploy, because
  the host's build is then the first build. A lint, type-check, test or e2e
  script that is not in CI is `medium`.
- Storybook checks (as defined in `npm-maintenance` § Validation) are opt-in.
  When CI runs none, the lane reports nothing about Storybook, whether or not
  the repository has Storybook. When CI runs one in a blocking job, the lane
  notes that the job should be non-blocking (`allow_failure: true`).
- Each finding proposes the project follow-up:
  - on v4: add the script to the `verify` job's `scripts` input;
  - on `config/ci` v2 or v3: add a job.
- The lane only reads. It edits no CI file and starts no pipeline.
- An eval case `evals/maintenance/maintenance-<n>`, runnable with the facts in
  the prompt: innovatieroute's `scripts` block and its `unit_test` job. Its
  graders expect `test` as run by `unit_test`. They expect `lint`, `ts-check`
  and `build` as `not in CI`, with `build` as `high`. They expect no finding
  about `build-storybook` or `test:vrt`. Take the next free number at delivery
  and follow `evals/README.md`.
- A changelog fragment `changelog.d/added.maintenance-declared-checks-ci-skips.md`.

## How to verify

- [x] `node scripts/validate-skills.mjs` prints `OK: 38 skills validated, 97 docs link-checked, no errors.`
- [x] `claude plugin eval . --case maintenance-3 --runs 1 --ablation none --no-publish --trust-plugin --judge-model sonnet --max-cost-usd 3`: score 1.00, 6/6 graders, skill fired. The case is numbered 3 because `feat-critical-ticket-age-flag.md` plans `maintenance-1` and `feat-maintenance-critical-hotfix-handoff.md` takes the next one.
- [x] `node skills/run-checks/scripts/ci-parity.mjs <dir>` on innovatieroute's `.gitlab-ci.yml` and `package.json` from `development`: `parityLine` is `CI parity: approximate (config/ci version/2.0.0)`, and `projectJobs` lists `unit_test` with `npm t` and the deploy jobs with `./scripts/trigger-deploy.sh`. Those are the inputs the lane reads.
- [ ] Reviewer: read lane E's new bullet in `skills/maintenance/SKILL.md` against the acceptance criteria above.

## Technical Notes

**The example.** innovatieroute's `.gitlab-ci.yml` on `development` (read
2026-10-21):

- It includes `greenberrynl/config/ci` at `version/2.0.0`, file
  `/projects/templates/deploy-exonet.yml`.
- Its only check job is `unit_test`, which runs `npm ci`, the Prisma reset and
  migrate, and `npm t`.
- Exonet builds the site on deploy, triggered from `deploy_dev`, `deploy_acc`
  and `deploy_prod`.

**v4's default leaves out `build`.** The `verify` default is
`[lint:check, type-check, test]`. A v4 project whose host builds on deploy needs
`build` in its `scripts` input, or the gap stays after migrating. That is worth
saying in the finding's follow-up. Storybook does not belong in that list:
`verify` gates the merge, and a Storybook job is non-blocking by the
maintainer's decision of 2026-10-21. A project that wants one runs it as its
own job with `allow_failure: true`.

**Parsing.** `skills/run-checks/scripts/ci-parity.mjs` already reads
`.gitlab-ci.yml`. Its JSON report gives the v4 `scripts` list (`parity:
"exact"`) and every job the project defines itself under `projectJobs`, with
its `script:` lines. Match those lines against `(npm|pnpm) run <name>`, `npm t`
and `npm test`. Do not write a second parser. When a job calls a shell script
(`./scripts/x.sh`), report the job as "calls a script, not read", and do not
open the script.

**Where it lands.** `skills/maintenance/SKILL.md` lane E, as a new bullet after
the pipeline-status bullet, plus a line under "Report" for the two severities.

**Overlap.** `feat-critical-ticket-age-flag.md` and
`feat-maintenance-critical-hotfix-handoff.md` edit lane A and "Report" in the
same file. This item touches lane E and one line in "Report". Whichever lands
second rebases.

## Out of Scope

- The portfolio view in `skills/greenberry-maintenance`.
- Editing CI, running CI locally, or reading the shared CI repository's jobs.
- `.github/workflows/`: Greenberry projects run on GitLab.

## Related

Depends on: chore-dependency-checks-run-every-declared-script.md (it adds the
selection rule this lane references)

- [../../skills/maintenance/SKILL.md](../../skills/maintenance/SKILL.md)
- [chore-dependency-checks-run-every-declared-script.md](chore-dependency-checks-run-every-declared-script.md): the selection rule
- [../../skills/run-checks/scripts/ci-parity.mjs](../../skills/run-checks/scripts/ci-parity.mjs): the CI reader to reuse
- [feat-maintenance-critical-hotfix-handoff.md](feat-maintenance-critical-hotfix-handoff.md)
- [feat-critical-ticket-age-flag.md](feat-critical-ticket-age-flag.md)
