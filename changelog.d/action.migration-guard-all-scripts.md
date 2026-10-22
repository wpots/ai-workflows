- In a project with a Payload preset, replace the migration guard in
  `.claude/settings.json` (the `PreToolUse` `Bash` hook whose reason starts
  with `Blocked: migrate:fresh`) with the one in
  `templates/project-claude-settings.json`. The sync never overwrites an
  existing settings file, so only new projects get the wider guard from the
  template.
  <!-- slack: .claude/settings.json | neem de nieuwe migration guard uit de template over: blokkeert elk migrate-script -->
