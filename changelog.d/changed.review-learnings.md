- `create-pr` adds a Rollback section to the MR description when reverting the
  merge does not undo the change: a migration (with its down step and when to
  run it), a CMS schema change, a new env var or a scheduled job.
  <!-- slack: create-pr | MR's met een migratie, CMS-schema, env var of scheduled job krijgen een Rollback-sectie -->
- The self-review in `create-pr` and `work-backlog` runs `code-review` in a
  subagent that gets the branch, base and worktree but none of the session's
  reasoning, so the reviewer does not inherit the author's assumptions.
