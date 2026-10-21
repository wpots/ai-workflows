# Run All Checks

This runbook is the compatibility and fallback surface for the canonical
`run-checks` skill.

Preferred path:

1. If the current tool supports skills reliably, use
   `skills/run-checks/SKILL.md` as the primary workflow.
2. Use this runbook for prompt-first tools such as Copilot, or when the skill
   path is unavailable.

Run project quality checks in sequence with review prompts between failures.

## CI Parity First

Read `.gitlab-ci.yml` before choosing what to run. Never run a CI job or
anything from its `before_script`, and never ask how a job maps to a command.
`skills/run-checks/scripts/ci-parity.mjs` prints the same report as JSON.

- **CI v4.** When the file includes `ci-components/node-npm@<version>` or
  `ci-components/node-pnpm@<version>`, run exactly the names in that include's
  `scripts` input. Without that input, run the default `lint:check`,
  `type-check`, `test`.
  - Run them in that order, as `npm run <name>` for node-npm or
    `pnpm run <name>` for node-pnpm, instead of the list below.
  - Report the names `package.json` lacks before running anything.
  - Report `CI parity: exact (ci-components <version>)`.
- **Otherwise,** run the list below and report one of these:
  - `CI parity: approximate (config/ci <ref>)` for a `greenberrynl/config/ci`
    include;
  - `CI parity: no CI config found` when there is no `.gitlab-ci.yml`.
- **Drift, CI v4 only:** list names that only CI or only `.husky/pre-push`
  runs.
- **Project jobs, in every case:** list jobs the project defines itself as
  `project job, not covered`, with their `script:` lines.

## Checks to Run (in order)

`<pm>` is the package manager the lockfile names (`pnpm-lock.yaml` → `pnpm`,
`package-lock.json` → `npm`). Keep the `run`: the shorthand `pnpm lint` matches
no allow rule.

1. **lint** - `<pm> run lint`
2. **type-check** - `<pm> run type-check`
3. **stylelint** - `<pm> run stylelint`
4. **test** - `<pm> run test`
5. **build** - `<pm> run build`

## Fallback Rules

1. **Check package.json first** - Only run checks if the script exists in package.json
2. **Sequential execution** - Run checks one at a time in the order listed above
3. **No automatic code edits** - Do NOT run fix variants unless explicitly asked (for example `lint:fix`)
4. **Failure handling**:
   - If a check fails, display the error output
   - List what failed clearly
   - **STOP and prompt the user** before continuing to the next check
   - Ask: "Check failed. Would you like to: [fix it / skip to next check / abort]?"
5. **Success handling** - If a check passes, automatically continue to the next one
6. **Summary** - At the end, provide a summary of all checks run and their results, with the CI parity line

## Sustainable verification

Checks cost compute — run them leanly (sustainable IT):

- Run the **full** pipeline once at a logical boundary (end of a coherent change,
  pre-push, branch validation), not after every edit.
- While iterating, prefer **targeted scopes** (`test <path>`, `lint <files>`,
  `type-check` on demand) and reserve the full sweep for the boundary.
- **Don't re-run** a check that already passed unless the files it covers changed
  since; report "already green, unchanged" instead of re-running.
- **Batch** independent checks into one invocation where the tooling allows it.

This complements the pre-push full sweep in `create-pr` — that sweep is the
single full run; do not duplicate it mid-task.

## Important

- Do NOT modify any code unless explicitly asked
- Run scripts exactly as defined in package.json
- Present failures clearly and wait for user decision
- Skip checks that don't have scripts in package.json (mention this)

## Note

Even if all checks pass, commits/pushes may still fail due to:

- Git hooks (pre-commit, commit-msg, pre-push)
- Protected branch rules or CI/CD checks
- Formatting requirements (Prettier, etc.)
- Server-side validations
