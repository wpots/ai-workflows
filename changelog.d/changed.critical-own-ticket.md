- `skills/dependency-hotfix`, `skills/npm-maintenance` — maintenance work
  no longer creates Jira subtasks. A critical on production gets its own
  Task with label `maintenance:critical`: the hotfix reuses the open one the
  dependency scanner filed through gb-dashboard, or creates it, and the MR
  closes it. Everything else (highs within two weeks, moderate, low, other
  upkeep) only names the quarter's maintenance ticket, as `Part of <KEY>`
  and never with `Closes`, so the merge leaves that ticket open for a human.
  `references/maintenance-ticket.md` holds both procedures. Eval
  `dependency-hotfix-4` now checks the critical ticket instead of two
  subtasks, and `dependency-hotfix-6` covers reusing the scanner's ticket.
