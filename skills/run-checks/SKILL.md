---
name: run-checks
description: Run project quality checks sequentially, stop on failures for user decision, and summarize results. Use when user asks to run checks, lint/type/test/build pipeline, or validate branch health.
metadata:
  owner: wieteke.pots
---

# Run Project Checks

Use this skill when the user asks to run project checks or validate branch quality.

This skill is the canonical workflow source for run-checks on skill-aware
tools. The matching command runbook is a compatibility and fallback surface.

## Workflow

1. Read `package.json` and detect available scripts. Take the package manager
   from the lockfile (`pnpm-lock.yaml` → pnpm, `package-lock.json` → npm).
2. **Find out what CI runs.** From the project root run
   `node <skill-dir>/scripts/ci-parity.mjs`. It reads `.gitlab-ci.yml` and
   prints a JSON report. It never runs a job, pulls an image or executes
   anything from a job's `before_script`, and neither do you. Never ask the
   user how a job maps to a command.
   - **`parity: "exact"`.** The project includes the CI v4 component
     `node-npm` or `node-pnpm` from `ci-components`. Its `verify` job is the
     only check CI runs on an MR. `scripts` is that job's list: the include's
     `scripts` input, or the component default `lint:check, type-check, test`.
     - Run exactly those names, in that order, as `<pm> run <name>` with the
       component's package manager. Nothing from the convention list in step
       3 runs, and no name is renamed (`lint:check` stays `lint:check`).
     - When `missingScripts` names anything, report it before running anything:
       `verify` fails on it with `verify: missing script(s) in package.json: …`.
       Then ask, as for a failed check.
   - **`approximate` or `none`.** The project is on `config/ci` v2/v3, has a
     config the script cannot read, or has no CI at all. Run the convention
     sweep of step 3.
   - Either way, the summary carries `parityLine`, and two more lines when they
     have content:
     - `prePushDrift`: each name that only CI or only `.husky/pre-push` runs,
       as drift;
     - `projectJobs`: each job the project defines itself, as
       `project job, not covered`, with its `script:` lines. Never run them.
   - Without Node, apply the same rules by reading `.gitlab-ci.yml` yourself.
3. Convention sweep, when there is no exact list: run `lint`, `type-check`,
   `stylelint`, `test`, `build` in that order, each as `<pm> run <script>`.
   Not the shorthand `pnpm lint`: it matches no allow rule, so every check
   stops on a permission prompt. Skip missing scripts and report skipped items.
4. If a check fails:
- Show error output and failing command.
- Stop and ask whether to `fix`, `skip`, or `abort`.
5. Continue automatically after successful checks.
6. End with a summary table of pass/fail/skip, **anchored to evidence**:
   - name the exact commit verified (`git rev-parse --short HEAD`) — a sweep
     that ran before later edits verified nothing;
   - per check, quote the tail of the real output (the line with counts:
     tests passed, files linted, build result) — never a bare "passed";
   - a check that was skipped or scoped says so in the table, explicitly;
   - the `parityLine` from step 2, plus its drift and
     `project job, not covered` lines when there are any.

## Constraints

- Do not modify code unless user explicitly asks.
- Do not run fix variants unless user explicitly asks.
- Prefer scripts exactly as defined in `package.json`.

## Sustainable verification

Checks cost compute — run them leanly (sustainable IT):

- Run the **full** pipeline once at a logical boundary (end of a coherent change,
  pre-push, branch validation), not after every edit.
- While iterating, prefer **targeted scopes** — `test <path>`, `lint <files>`,
  `type-check` on demand — and reserve the full sweep for the boundary.
- **Don't re-run a check that already passed** unless the files it covers changed
  since; report "already green, unchanged" instead of re-running.
- **Batch** independent checks into one invocation where the tooling allows it.

This complements the pre-push full sweep in `create-pr` — that sweep is the
single full run; do not duplicate it mid-task.
