- `jira-ticket`: a ticket is read by the product owner in one minute, so a
  Story is capped at 250 words and 8 one-sentence criteria, a Task at 100 and a
  Bug at 150, counted with `wc -w` before the confirm step. Tech notes, slicing,
  code names and file paths stay in the backlog item; dependencies become Jira
  issue links. A ticket over a cap is never trimmed silently or created: the
  confirm step proposes moving detail to the backlog item, splitting by
  capability, or grouping the criteria, and the user decides. `mr-merged`'s
  "How to test this" comment follows the same one-minute rule, and a new eval
  case guards the caps.
  <!-- slack: Jira-tickets | Story max. 250 woorden en 8 criteria, Task 100, Bug 150; tech-detail blijft in het BLI -->
