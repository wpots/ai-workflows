- The migration guard in `templates/project-claude-settings.json` denies every
  migrate script an agent runs through pnpm, npm, yarn, bun, npx or `payload`
  (`migrate`, `migrate:status`, `migrate:create`, `migrate:fresh`,
  `migrate:reset`, `payload migrate*`), not only `migrate:fresh` and
  `migrate:create`. Text after `git`, `glab`, `gh`, `jira`, `jq`, `echo` and
  the read tools is a mention, so a commit message or MR title that names a
  migrate command no longer trips it. `scripts/test_migration_guard.py` runs
  the hook from the template against both lists.
