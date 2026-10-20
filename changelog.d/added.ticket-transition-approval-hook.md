- The plugin asks before every Jira status change. A PreToolUse hook
  (`scripts/require_ticket_transition_approval.py`) puts up a permission
  prompt for `jira issue move` (also `transition` and `mv`) and for a
  connector `transitionJiraIssue`, even where `Bash(jira *)` is allowed; a
  headless run is denied. This enforces `skills/service-cli` § Ticket status
  in every project with the plugin, so the manual `permissions.ask` edit per
  project is no longer needed.
  <!-- slack: Jira-status | de plugin vraagt nu altijd om een go voordat een ticket van status wisselt -->
