- `create-pr` reviews the branch, not the main checkout, when the branch lives
  in a worktree: the self-review step passes the branch name and the worktree
  path, because `HEAD` in the main checkout is another branch plus the user's
  uncommitted work (`worktrees.md` § Reviewing the branch). The two-step MR
  creation in `push-and-mr-mechanics.md` names `--source-branch`, which
  `glab mr create` otherwise takes from the cwd.
  <!-- slack: create-pr | Self-review leest de worktree van de branch, niet de main checkout; glab mr create krijgt --source-branch -->
