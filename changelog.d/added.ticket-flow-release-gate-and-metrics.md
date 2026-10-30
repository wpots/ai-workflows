- `release`: lists every shipped ticket without the product owner's approval,
  with its link and the reason (no comment for the product owner, no reply yet,
  rejected, or unclear), classified the way `ticket-handoff` does. Done tickets
  are checked too. It reports in the plan and the recap and blocks nothing: the
  ticket still gets the version and the release goes on.
- `close-sprint`: opt-in flow metrics per ticket (Phase 3b), read from the
  ticket's status history: returns from In Test or Acceptatie to In Progress,
  stays over five working days, and first time right. They land in a `## Flow`
  section of the changelog and are never written to the tracker.
- `service-cli`: the Jira reference names the route to an issue's status
  history, the connector's `listJiraIssueChangelogs`, since the `jira` CLI
  returns no changelog.
  <!-- slack: ticket-flow | Release meldt tickets zonder akkoord van de PO; sprint close kan desgewenst de flow per ticket tonen -->
