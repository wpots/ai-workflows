# CLAUDE.md

Read `AI-WORKFLOWS.md` for how this project's AI workflow files are intended to work together.
Read `CONVENTIONS.md` for project-specific context, stack, structure, and conventions.
Read `rules/` for baseline coding standards (shared across all projects).
Load only the relevant focused rule files for the task:

- `rules/tailwind.md` for styling and design-token work
- `rules/testing.md` for tests and test reviews
- `rules/accessibility.md` for interactive UI and accessibility checks
- `rules/backlog.md` for user stories, specs, and backlog work
- the appropriate `rules/stacks/*` file after detecting the stack from `package.json`

## Precedence

1. `CONVENTIONS.md` (project-specific conventions)
2. `rules/` (baseline coding standards)
3. This file (tool adapter)

When CONVENTIONS.md conflicts with rules/, CONVENTIONS.md wins.

## Shared Workflow Source

When a change touches shared workflow assets in a reusable way, suggest
upstreaming it to the [ai-workflows](https://github.com/wpots/ai-workflows) repo rather than keeping it only in this
synced target repo.

Shared workflow assets:

- `AI-WORKFLOWS.md`
- `rules/**`
- `commands/**`
- `.github/prompts/**` (generated from commands/)
- `AGENTS.md`
- `CLAUDE.md`
- `.cursor/rules/**`

## Workflow Strategy

On Claude, use a mixed workflow model:

- prefer a matching skill when the workflow is available and fits the task well
- use `commands/` as the compatibility and fallback path
- keep `rules/` as the policy source of truth

## Command Mapping

When user intent matches one of these triggers, read and follow the corresponding runbook in `commands/`:

<!-- BEGIN SHARED:command-mappings -->
<!-- END SHARED:command-mappings -->

Do not assume command files auto-run. Select and execute them when intent matches.

## Safety

<!-- BEGIN SHARED:safety -->
<!-- END SHARED:safety -->
