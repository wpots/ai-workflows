- `skills/watch-mrs` can act on new review comments instead of only relaying
  them (asked once per invocation, or settled by the user's memory): it
  evaluates them with `receiving-code-review`, applies the ones without a
  crucial decision through `address-review-comments`, replies on each GitLab
  thread and posts `replied` / `pushed changes` in the MR's Slack thread. A
  crucial decision goes to the user as that one question.
- `skills/watch-mrs` pauses at night: between 23:00 and 06:00, after two
  polls without an event, it stops polling until 06:00, with the quiet count
  kept in a state file so a re-armed Monitor keeps it.
- `skills/watch-mrs` can post an MR in a Slack channel once it is ready apart
  from approvals: a reply in the MR's existing thread, else a new message,
  once per head SHA.
- `skills/receiving-code-review`: feedback that changes a template MR's
  approach is traced to the projects that ported the change or plan to.
