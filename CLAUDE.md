# CLAUDE.md

## Purpose

Use this repository as the canonical source for AI workflows shared across devices and IDE profiles.

## Source Of Truth

- Canonical policy: `AGENTS.md`
- Baseline defaults: `rules/rules.md`
- Runbooks: `commands/*.md`

Read `rules/rules.md` before making project-level decisions.

## Command Mapping

When user intent matches one of these prompts, skills, or command requests, read and follow the corresponding prompt, skill, or runbook:

<!-- BEGIN SHARED:command-mappings -->
- `create pr`, `open pr`, `submit pr` -> `commands/create-pr.md`
- `commit message`, `write commit`, `git commit` -> `commands/commit-message.md`
<!-- END SHARED:command-mappings -->

### Experimental Commands & Skills

> Prefixed with `experimental.` — excluded from project sync by default.
> Use `--include-experimental` flag with sync.sh to include them.

- `run checks`, `run-checks`, `quality checks` -> `commands/experimental.run-checks.md`
- `review code`, `code review`, `review changes` -> `commands/experimental.review-code.md`
- `kill port`, `port 3000`, `eaddrinuse` -> `commands/experimental.safe-kill-port.md`
- `new component`, `scaffold`, `create component` -> `commands/experimental.scaffold-component.md`
- `component spec`, `spec component`, `write spec`, `spec out a component`, `document component api` -> `.github/prompts/component-spec.prompt.md`
- `new device`, `setup device`, `onboarding` -> `commands/experimental.new-device-setup.md`
- `init project`, `setup project`, `apply ai-workflows` -> `skills/experimental.init-project`
- `upstream rule`, `propose rule`, `share rule change` -> `skills/experimental.upstream-rules`

Do not assume command files auto-run. Select and execute them when intent matches.

## Safety

<!-- BEGIN SHARED:safety -->
- Prefer concrete execution over long planning.
- Do not modify code unless requested.
- Ask before destructive actions (force kill, reset, delete) unless explicitly requested.
- Always summarize what was run and what changed.
<!-- END SHARED:safety -->
