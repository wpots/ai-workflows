- pnpm projects run without permission prompts.
  `templates/project-claude-settings.json` allows `pnpm run`, `pnpm test`,
  `pnpm exec` and `pnpm install --frozen-lockfile`, next to the npm rules.
  `pnpm dlx` and a bare `pnpm *` stay off the list: `add`, `remove`, `update`
  and `publish` keep asking. `CLAUDE.md` and `skills/run-checks` take the
  package manager from the lockfile and spell its commands out in full
  (`pnpm run lint`, not `pnpm lint`), because the shorthand matches no allow
  rule. `commands/new-device-setup` checks for pnpm, which unicore-template v4
  and every project created from it use.
  <!-- slack: pnpm | pnpm run/test/exec staan in de project-allowlist; agents schrijven `pnpm run <script>` voluit -->
