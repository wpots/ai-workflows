- `skills/run-checks` now runs what CI runs. In a project that includes the
  CI v4 component `node-npm` or `node-pnpm` from `ci-components`, it runs
  exactly the names in that include's `scripts` input, in order, or the
  default `lint:check`, `type-check`, `test`. It reports
  `CI parity: exact (ci-components <version>)` and the names `package.json`
  lacks before it runs anything.
  Projects on `config/ci` keep the convention sweep, now labelled
  `CI parity: approximate (config/ci <ref>)`.
  Either way, the summary lists drift against `.husky/pre-push` (CI v4 only)
  and the project's own CI jobs as `project job, not covered`.
  `skills/run-checks/scripts/ci-parity.mjs` reads `.gitlab-ci.yml`. It never
  runs a job or anything from a job's `before_script`.
  <!-- slack: run-checks | draait in een CI v4-project precies de scripts van de verify-job en meldt de CI-pariteit -->
