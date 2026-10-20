- `watch-mrs`: under a Claude Code sandbox, the watcher keeps its state in
  `/tmp/claude/mr-watch/` when `~/.claude/state` is not writable. A `Monitor`
  command has no sandbox bypass, so the prescribed path failed with
  `Operation not permitted`. The Monitor also declares `gitlab.com` in
  `allowed_domains`, so `glab` reaches the API without a bypass.
  <!-- slack: watch-mrs | Werkt nu ook in de sandbox: state in /tmp/claude/mr-watch en gitlab.com in allowed_domains -->
