- In a pnpm project whose `.claude/settings.json` already exists, add
  `"Bash(pnpm run *)"`, `"Bash(pnpm test *)"`, `"Bash(pnpm exec *)"` and
  `"Bash(pnpm install --frozen-lockfile*)"` to `permissions.allow`. The sync
  never overwrites an existing settings file, so only new projects get the
  rules from the template.
  <!-- slack: .claude/settings.json | zet de vier pnpm-regels onder permissions.allow als je pnpm-project al een settings.json heeft -->
