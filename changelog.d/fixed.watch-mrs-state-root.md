- `watch-mrs`: the watcher keeps its state in `~/.worktrees/.mr-watch/`
  instead of `~/.claude/state`, which a sandbox never lets a `Monitor` write.
  `~/.worktrees` is already writable for the worktree flow and survives a
  reboot. `/tmp/claude/mr-watch/` stays as the fallback, and the skill now
  says it loses comments that arrive across a reboot.
  <!-- slack: watch-mrs | state staat nu in ~/.worktrees/.mr-watch, overleeft ook een reboot -->
