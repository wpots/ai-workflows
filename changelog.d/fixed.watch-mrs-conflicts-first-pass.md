- `skills/watch-mrs` no longer claims `.detailed_merge_status` covers
  conflicts: it names only the first failing check, and `not_approved` comes
  first, so the watcher tracks `.has_conflicts` on its own.
- `skills/watch-mrs` marks an MR's first pass with its own `initialized` file:
  deriving it from the merge-status file kept an MR stuck on `unchecked` in
  first-pass mode, which marked its new comments as seen without reporting
  them.
- `skills/watch-mrs` says how to tell a sleeping laptop from a hung call
  (`pmset -g log`), and that a `glab` timeout needs SIGKILL, since the Go
  binary ignores SIGALRM.
