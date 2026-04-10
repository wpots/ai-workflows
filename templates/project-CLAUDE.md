# CLAUDE.md

Read `CONVENTIONS.md` for project-specific context, stack, structure, and conventions.
Read `rules/` for baseline coding standards (shared across all projects).

## Precedence

1. `CONVENTIONS.md` (project-specific conventions)
2. `rules/` (baseline coding standards)
3. This file (tool adapter)

When CONVENTIONS.md conflicts with rules/, CONVENTIONS.md wins.

## Shared Workflow Source

When a change touches shared workflow assets in a reusable way, suggest
upstreaming it to `~/Web/ai-workflows/` rather than keeping it only in this
synced target repo.

Shared workflow assets:

- `rules/**`
- `commands/**`
- `.github/prompts/**` (generated from commands/)
- `AGENTS.md`
- `CLAUDE.md`
- `.cursor/rules/**`

## Command Mapping

When user intent matches one of these triggers, read and follow the corresponding runbook in `commands/`:

<!-- BEGIN SHARED:command-mappings -->
<!-- END SHARED:command-mappings -->

Do not assume command files auto-run. Select and execute them when intent matches.

## Safety

<!-- BEGIN SHARED:safety -->
<!-- END SHARED:safety -->
