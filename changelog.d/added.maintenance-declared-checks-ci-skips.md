- `maintenance` lane E lists every check the project declares and whether CI
  runs it, reading the CI through `run-checks`' `ci-parity.mjs`. `build` not
  in CI is high when the host builds on deploy; any other declared check not
  in CI is medium, with a CI job (or the v4 `verify` input) as the fix.
  Storybook stays opt-in and is never a finding.
  <!-- slack: Onderhoud | De sweep meldt welke checks van het project CI nooit draait; Storybook blijft opt-in -->
