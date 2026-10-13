- `setup-ai-workflows` now detects the project's language (TypeScript,
  JavaScript only, or mixed) and asks for every deviation from the global
  rules whether it is **accepted** (the project stays this way) or
  **migrating** (a target, a rule for new code, and how existing code follows).
  `CONVENTIONS.md` records that status on each deviation line, so an agent in a
  JavaScript project moving to TypeScript writes new files in TypeScript
  instead of copying the files next to it. The rationale stays in the decision
  log of `docs/architecture.md` when that exists.
- `setup-ai-workflows` also writes `.claude/settings.json` from the project
  template when the project has none, as `sync.sh --project` already did, so a
  project set up through the skill gives teammates the plugin install prompt
  too.
- The setup docs no longer say a local clone is needed to set up a project:
  on Claude Code the skills read the templates from the plugin. The clone is
  for Codex, the `sync.sh --project` script and changes to the shared config.
