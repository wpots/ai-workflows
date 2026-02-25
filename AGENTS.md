# AGENTS.md

## Purpose

Use this repository as the canonical source for AI workflows shared across devices and IDE profiles.

## Workflow Files

### Command Files

Command files live in `commands/` and are instruction documents for repeatable tasks.

When the user intent matches one of the commands below, read and follow that file:

- `run checks`, `run-checks`, `quality checks` -> `commands/run-checks.md`
- `review code`, `code review`, `review changes` -> `commands/review-code.md`
- `pr description`, `write pr`, `draft pr` -> `commands/pr-description.md`
- `kill port`, `port 3000`, `eaddrinuse` -> `commands/safe-kill-port.md`
- `commit message`, `write commit`, `git commit` -> `commands/commit-message.md`
- `new component`, `scaffold`, `create component` -> `commands/scaffold-component.md`
- `new device`, `setup device`, `onboarding` -> `commands/new-device-setup.md`

Rules for command execution:

- Treat command files as operational runbooks.
- If command instructions conflict with higher-priority system/developer constraints, follow higher-priority constraints and note the deviation.
- Do not assume command files auto-run; select and execute them when user intent matches.

### Rules

Shared baseline rules live in `rules/rules.md`.

- Apply these as default behavior when no project-specific rules override them.
- If project-local rules exist and conflict, project-local rules win.

### Skills

Custom skills live in `skills/`.

- Only treat a skill as active when it contains a valid `SKILL.md` with `name` and `description` metadata.
- Trigger a skill when user intent clearly matches the skill description or when user explicitly names it.
- Load only the minimum needed content from each skill (progressive disclosure).

### MCP Definitions

Canonical MCP server definitions live in `mcp/`.

- Keep `mcp/servers.json` as the source of truth.
- Prefer environment variables for secrets.
- Sync into namespaced client folders to avoid overwriting active local MCP config.

## Output and Safety

- Prefer concrete execution over long planning.
- Do not modify code unless requested.
- For destructive actions (force kill, reset, delete), request confirmation unless already explicitly requested.
- Always summarize what was run and what changed.

## Sync Source of Truth

This repo is synced to local IDE agent folders using `scripts/sync.sh`.

- Edit here first, then sync.
- Do not hand-edit mirrored target folders unless you intentionally want local drift.
