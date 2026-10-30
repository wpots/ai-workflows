- `new-device-setup`: `ai-sync` is now a shell function instead of an alias.
  It pulls `main` fast-forward-only before running `sync.sh` and passes its
  flags through. It refuses to run when the clone is on another branch, so
  unmerged rules never reach `~/.claude` or `~/.codex`.
  <!-- slack: new-device-setup | ai-sync pullt nu eerst main en weigert op een feature branch -->
