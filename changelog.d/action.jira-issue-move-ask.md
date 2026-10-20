- In a project whose `.claude/settings.json` allows `Bash(jira *)`, add
  `"Bash(jira issue move *)"` to `permissions.ask`. The sync never overwrites
  an existing settings file, so only new projects get the rule from the
  template.
  <!-- slack: .claude/settings.json | zet "Bash(jira issue move *)" onder permissions.ask als je project Bash(jira *) toestaat -->
