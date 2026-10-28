- Project sync and `setup-ai-workflows` stop generating Copilot files: no more
  `.github/copilot-instructions.md` or `.github/prompts/*.prompt.md`, and the
  `shared/core-rules.md` fragment that only the Copilot adapter carried is gone.
  Files an earlier sync left in a project's `.github/` stay where they are; delete
  them by hand if you want them gone. The shared rules, templates and project
  guide no longer name Copilot as a target, so each synced project is reported
  stale once, with the usual note naming `sync.sh --project`, until its next
  re-sync.
