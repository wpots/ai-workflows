# Copilot Instructions

## Project Conventions

<!-- BEGIN CONVENTIONS -->
No CONVENTIONS.md found. Run init-project to generate one.
<!-- END CONVENTIONS -->

## Precedence

1. Project conventions above (from CONVENTIONS.md)
2. Global baseline rules from ai-workflows

When project conventions conflict with global rules, project conventions win.

## Shared Workflow Source

When a change touches shared workflow assets in a reusable way, suggest
upstreaming it to the [ai-workflows](https://github.com/wpots/ai-workflows) repo rather than keeping it only in this
synced target repo.

Treat these as shared workflow assets:

- `rules/**`
- `.github/prompts/**`
- `AGENTS.md`
- `CLAUDE.md`
- `.cursor/rules/**`

## Command Mapping

When user intent matches one of these prompts, read and follow the corresponding prompt or runbook:

<!-- BEGIN SHARED:command-mappings -->
<!-- END SHARED:command-mappings -->

Do not assume command files auto-run. Select and execute them when intent matches.

## Safety

<!-- BEGIN SHARED:safety -->
<!-- END SHARED:safety -->
