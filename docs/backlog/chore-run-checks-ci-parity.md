# Chore: run-checks Runs What The CI v4 `verify` Job Runs

## Status

<!-- draft | ready | in-progress | done -->

draft

**Becomes `ready` when DEV-655 slice 1 is merged in
`greenberrynl/config/ci-components`.** That slice builds the `verify` job and
fixes the name and default of its `scripts` input; this item reads both. The
4.0.0 tag is not the gate. The input can still change until that slice merges.

Re-evaluated 2026-10-13 against CI v4 (`greenberrynl/config/ci-components`,
pre-release). The old blocker was the question of how a CI job's `script:` line
maps to a local command. v4 makes the answer a contract instead of a parse:

- `verify` is the only merge-gating job in the `node-npm` and `node-pnpm`
  components.
- It runs `<pm> run <name>` for each entry of its `scripts` input, with the
  default `[lint:check, type-check, test]`, after `npm ci` (or the pnpm
  equivalent).
- ADR-0004 makes the Husky pre-push run the same list.
- The v4 brief says no component contains its own lint or test command.

Building against v3 now would be throwaway work, for three reasons:

- 73 active projects still include `greenberrynl/config/ci`, 54 of them on
  `version/2.0.0`.
- The v3 branches move: `version/3.1.1` moved twice on 2026-10-13 alone.
- v3 gets no new features.

The GitLab CI lint API (`ci/lint?dry_run=true`) is no source either. It only
simulates a push to the default branch, so MR-only jobs are missing from its job
list (ADR-0009). It returns no image, and it needs a token.

History: readiness pass 2026-07-29 blocked this item on the CI-job-to-command
mapping. The rewrite above removes that question.

## Priority

medium

## Summary

`skills/run-checks` takes its command list from the project's CI v4 `verify`
include, so that "green locally" means "green in CI". Projects still on
`config/ci` keep the convention sweep, labelled as approximate.

## User Story

As a developer running the checks before pushing, I want the sweep to be the
exact list CI's `verify` job will run, so that a passing local run is a real
signal and a missing script fails here instead of in the pipeline.

## Acceptance Criteria

- When `.gitlab-ci.yml` includes `ci-components/node-npm@<version>` or
  `ci-components/node-pnpm@<version>`, `skills/run-checks` reads the include's
  `inputs.scripts`, or the component's documented default when the input is
  absent. It runs `npm run <name>` or `pnpm run <name>` for each entry, in that
  order, and reports `CI parity: exact (ci-components <version>)`.
- A name in that list that `package.json` does not define is reported before
  anything runs, as the failure the `verify` job will produce.
- When `.husky/pre-push` exists, names that appear in only one of the two lists
  are reported as drift.
- Jobs the project defines itself in `.gitlab-ci.yml` (not from a component) are
  listed as `project job, not covered`, with their `script:` lines. They are
  never run.
- When the project includes `greenberrynl/config/ci` instead, the skill keeps
  today's convention sweep and reports `CI parity: approximate (config/ci
  <ref>)`. It does not parse that repository's jobs.
- Without a `.gitlab-ci.yml`, the skill keeps the convention sweep and reports
  `no CI config found`.
- The skill never asks how to map a job, never pulls a CI image, and never runs
  `apk add` or anything else from a job's `before_script`.
- The sustainability guidance holds: the full sweep runs once at the boundary,
  with targeted scopes while iterating.
- The summary table gains the parity line and, where relevant, the drift and
  `project job, not covered` lines.
- `commands/run-checks.md` says the same as the skill, and its generated prompt
  is regenerated.
- An eval case under `evals/run-checks/` covers the v4 path: an include with
  `scripts: [lint:check, test]` produces exactly those two runs plus the parity
  line. Follow `evals/README.md`; tag it `needs-scaffold` if it needs a fixture.
- A changelog fragment `changelog.d/changed.run-checks-ci-parity.md` records the
  change.

## How to verify

<!-- Filled in by whoever delivers the item. -->

## Technical Notes

Sources in `greenberrynl/config/ci-components` (project 87395123, read
2026-10-13; re-read before building, the repository is pre-release):

- `README.md`: the include form is `component:
  $CI_SERVER_FQDN/greenberrynl/config/ci-components/<component>@<version>` with
  `inputs:`.
- `docs/backlog/DEV-655-feat-node-npm-1-verify-job.md`: the `verify` job
  (`stage: test`, `image: node:<node_version>`). It checks the names first, then
  runs `npm ci --no-audit --no-fund`, then one `npm run <name>` per entry.
- `docs/adr/` ADR-0004 (pre-push runs the same list) and ADR-0009 (`dry_run`
  simulates a push only).
- `docs/plan/ci-v4.md`, `docs/project-spec.md`: the component list and what
  comes after 4.0.0 (browser tests DEV-666, Payload migration check DEV-687,
  among others). A later component that gates the MR extends this item.

Read the include with a small, bounded extractor. Find the
`component: …/ci-components/node-(npm|pnpm)@` line, then the `scripts:` list
under its `inputs:`. Do not build a YAML evaluator. When the include uses a
variable or a `local:` file the extractor cannot resolve, say so and fall back
to the approximate path. `skills/greenberry-maintenance/scripts/collect_gitlab.py`
has the same bounded style for `config/ci` includes.

The default list uses `lint:check`, while today's convention sweep runs `lint`.
The v4 path takes the names from the list and never renames them.

GitHub Actions is out: Greenberry projects run on GitLab.

The first consumer is the RFW canary (DEV-659). Use it for `How to verify` once
it is on v4.

## Out of Scope

- Parsing `greenberrynl/config/ci` (v2/v3) jobs, or a mapping table for them.
- Running CI containers locally (act, gitlab-runner exec).
- Changing CI configuration, or anything in `ci-components`.
- `.github/workflows/`.

## Related

- [../../skills/run-checks/SKILL.md](../../skills/run-checks/SKILL.md)
- [../../commands/run-checks.md](../../commands/run-checks.md)
- [feat-pipeline-triage.md](feat-pipeline-triage.md): its reproduce-locally step
  waits on this item
- https://gitlab.com/greenberrynl/config/ci-components — CI v4, DEV-650
