- `skills/service-cli`: a project on another Jira key or board than the
  machine default checks its `jira` config in as `.jira.yml` (the
  `jira init -c .jira.yml` output minus `login`); every command passes
  `-c .jira.yml` after the subcommand so allowlist prefixes still match, and
  the login comes from `JIRA_LOGIN`. Replaces the "own config via
  `JIRA_CONFIG_FILE`" advice; `jira-ticket`, `setup-ai-workflows` and the
  machine setup follow it.
  <!-- slack: Jira-config per project in de repo als `.jira.yml`, met `-c .jira.yml` en `JIRA_LOGIN` -->
