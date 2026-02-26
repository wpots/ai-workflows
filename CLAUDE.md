# CLAUDE.md

## Purpose

Use this repository as the canonical source for AI workflows shared across devices and IDE profiles.

## Source Of Truth

- Canonical policy: `AGENTS.md`
- Baseline defaults: `rules/rules.md`
- Runbooks: `commands/*.md`

Read `rules/rules.md` before making project-level decisions.

## Command Mapping

When user intent matches one of these prompts, read and follow the corresponding runbook:

<!-- BEGIN SHARED:command-mappings -->
- `run checks`, `run-checks`, `quality checks` -> `commands/run-checks.md`
- `review code`, `code review`, `review changes` -> `commands/review-code.md`
- `create pr`, `open pr`, `submit pr` -> `commands/create-pr.md`
- `kill port`, `port 3000`, `eaddrinuse` -> `commands/safe-kill-port.md`
- `commit message`, `write commit`, `git commit` -> `commands/commit-message.md`
- `new component`, `scaffold`, `create component` -> `commands/scaffold-component.md`
- `new device`, `setup device`, `onboarding` -> `commands/new-device-setup.md`
<!-- END SHARED:command-mappings -->

Do not assume command files auto-run. Select and execute them when intent matches.

## Safety

<!-- BEGIN SHARED:safety -->
- Prefer concrete execution over long planning.
- Do not modify code unless requested.
- Ask before destructive actions (force kill, reset, delete) unless explicitly requested.
- Always summarize what was run and what changed.
<!-- END SHARED:safety -->
