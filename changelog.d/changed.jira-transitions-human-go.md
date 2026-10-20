- No skill changes a Jira ticket's status on its own any more. Jira's
  automation moves tickets from the pipeline, and a transition runs only on
  the user's go per ticket (`skills/service-cli` § Ticket status).
  `skills/release` sets versions or labels and reads the status back instead
  of moving shipped tickets to Done; asked to move them, it lists them with
  their current status and waits for a go on that list. `skills/mr-merged`
  reads the ticket status back and no longer proposes a transition. A
  critical ticket created after its MR merged (`npm-maintenance`,
  `dependency-hotfix`) is reported, not moved.
  `templates/project-claude-settings.json` puts `Bash(jira issue move *)`
  under `ask`, so the `Bash(jira *)` allow rule no longer lets a transition
  through without a prompt.
  <!-- slack: Jira-status | skills zetten geen tickets meer door; dat doet de pipeline of jij, met een go per ticket -->
