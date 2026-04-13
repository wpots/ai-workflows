# AGENTS.md

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
3. This file (workflow dispatch)

When CONVENTIONS.md conflicts with rules/, CONVENTIONS.md wins.

## Workflow Dispatch

### Skills

Skills are the primary dispatch mechanism for repeatable workflows.

| Skill            | Trigger phrases                          |
| ---------------- | ---------------------------------------- |
| `commit-message` | commit message, write commit, git commit |
| `create-pr`      | create pr, open pr, submit pr            |

## Shared Workflow Source

Changes to shared AI workflow assets should usually be proposed upstream in
the [ai-workflows](https://github.com/wpots/ai-workflows) repo instead of living only in this synced target repo.

Treat these as shared workflow assets:

- `AI-WORKFLOWS.md`
- `rules/**`
- `commands/**`
- `.github/prompts/**` (generated from commands/)
- `AGENTS.md`
- `CLAUDE.md`
- `.cursor/rules/**`

When a task changes those files in a generally reusable way, proactively
suggest creating a PR in `ai-workflows` so the change can be synced back into
target repos.

### Command Runbooks

When user intent matches a trigger phrase, read and follow the corresponding runbook in `commands/`.

<!-- BEGIN SHARED:command-mappings -->
<!-- END SHARED:command-mappings -->

Do not assume command files auto-run. Select and execute them when intent matches.

## Safety

<!-- BEGIN SHARED:safety -->
<!-- END SHARED:safety -->
