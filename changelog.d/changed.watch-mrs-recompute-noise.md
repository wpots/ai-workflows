- `skills/watch-mrs` no longer reports GitLab's `unchecked`/`checking`
  merge-status recomputes, which fired for every watched MR each time the
  target branch moved. It also reports a reviewer's `requested_changes` that
  outlives its resolved thread as the remaining merge blocker, and notes that
  a running watcher script must be stopped before it is edited and that macOS
  bash 3.2 has no `mapfile`.
  <!-- slack: watch-mrs | geen ruis meer als de target-branch verschuift; meldt blijvende "requested changes" -->
