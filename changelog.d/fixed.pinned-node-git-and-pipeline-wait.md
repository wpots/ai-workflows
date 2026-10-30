- `create-pr` commits and pushes from a worktree on the project's pinned Node
  with `env PATH=<pinned node bin>:… git -C <worktree> …`, because the harness
  refuses `fnm exec … git commit` (`worktrees.md` § Running tests, builds and
  hooks).
- `work-backlog` gives its pipeline-wait script a deadline of 9 minutes, below
  the 10-minute Bash cap: at the cap the tool moves the command to the
  background, which step 6 forbids.
