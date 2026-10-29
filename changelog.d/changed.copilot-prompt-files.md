- This repo stops generating Copilot prompt files: `scripts/generate-adapters.sh`
  no longer writes `.github/prompts/`, and the folder and the Copilot Chat
  settings in `.vscode/settings.json` are gone. A change to a `commands/`
  runbook no longer produces a second file to stage, so `improve-skill` and
  `upstream-rules` drop the step that staged the regenerated prompt.
  `upstream-rules` also stops treating `.github/prompts/` as a shared asset to
  upstream.
