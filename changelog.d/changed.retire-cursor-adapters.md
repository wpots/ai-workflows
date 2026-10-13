- Project sync and `setup-ai-workflows` stop generating Cursor files: no more
  `.cursor/rules/conventions.mdc`, `.cursor/rules/graphify.mdc` or
  `.cursor/mcp.json`, and the global `sync.sh` no longer copies commands and
  skills into `~/.cursor`. Files an earlier sync left in a project's `.cursor/` or
  in `~/.cursor/` stay where they are; delete them by hand if you want them gone.
  The shared rules, commands and project guide no longer name Cursor, so each
  synced project is reported stale once, with the usual note naming
  `sync.sh --project`, until its next re-sync.
