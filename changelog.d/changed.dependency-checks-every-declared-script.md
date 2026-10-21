- `npm-maintenance` and `dependency-hotfix` validate with every check the
  project declares (`lint*`, type checks such as `ts-check`, `test*`,
  `build*`) instead of a fixed list, leaving out watch, update and
  per-environment variants. A script that rewrites files (`eslint --fix`)
  runs only in its check-only form. Storybook checks are opt-in, through a CI
  job that runs one or the user asking, and never block: a failure is
  reported, not a stop or a Draft. A failing test is rerun on the target
  branch before the bump is blamed.
  <!-- slack: Onderhoud | Dependency-updates draaien alle projectchecks; Storybook alleen als je kiest, nooit blokkerend -->
