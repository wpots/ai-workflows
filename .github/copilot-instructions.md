# Copilot Instructions

Use this repository as the single source of truth for shared AI workflows.

## Source Of Truth

- Canonical policy: `AGENTS.md`
- Baseline defaults: `rules/rules.md`
- Runbooks: `commands/*.md`

Read `rules/rules.md` before making project-level decisions.

## Command Mapping

When user intent matches one of these prompts, read and follow the
corresponding runbook:

- `run checks`, `run-checks`, `quality checks` ->
  `commands/run-checks.md`
- `review code`, `code review`, `review changes` ->
  `commands/review-code.md`
- `pr description`, `write pr`, `draft pr` ->
  `commands/pr-description.md`
- `kill port`, `port 3000`, `eaddrinuse` ->
  `commands/safe-kill-port.md`

Do not assume command files auto-run. Select and execute them when intent
matches.

## Safety

- Prefer concrete execution over long planning.
- Do not modify code unless requested.
- Ask before destructive actions (force kill, reset, delete) unless
  explicitly requested.
- Always summarize what was run and what changed.
