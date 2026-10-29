- The migration guard in the project settings template
  (`templates/project-claude-settings.json`) no longer splits a command on a
  `;`, `&` or `|` inside quotes. A search pattern such as
  `rg "db:up|pnpm run migrate:fresh"` or a commit message that mentions a
  migrate script was denied as if it ran one. Real runs, including chained,
  multi-line and `bash -c` ones, are still denied.
  <!-- slack: project settings | Migration guard blokkeert geen zoekopdracht of commit message meer die een migrate script noemt -->
