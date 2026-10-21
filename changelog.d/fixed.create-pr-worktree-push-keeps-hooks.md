- `skills/create-pr` no longer tells the agent to add `--no-verify` to every
  push from a git worktree. A push keeps its hooks on, and `--no-verify` is
  allowed only for the two cases `references/worktrees.md` names: a hook that
  cannot execute in the worktree, and a hook whose git-calling tests do not
  drop `GIT_*`. Even then, the agent first runs that hook's commands by hand.
  This makes the push step agree with the sandbox rule above it, which says to
  re-run a blocked hook with the bypass, never with `--no-verify`.
