# AGENTS.md

Read `CONVENTIONS.md` for project-specific context, stack, structure, and conventions.
Read `rules/` for baseline coding standards (shared across all projects).

## Precedence

1. `CONVENTIONS.md` (project-specific conventions)
2. `rules/` (baseline coding standards)
3. This file (workflow dispatch)

When CONVENTIONS.md conflicts with rules/, CONVENTIONS.md wins.

## Workflow Dispatch

### Skills

Skills are the primary dispatch mechanism for repeatable workflows.

| Skill                 | Trigger phrases                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------- |
| `commit-message`      | commit message, write commit, git commit                                                    |
| `scaffold-component`  | new component, scaffold, create component                                                   |
| `component-spec`      | component spec, spec component, write spec, spec out a component, document component api    |
| `create-pr`           | create pr, open pr, submit pr                                                               |
| `code-review`         | review code, code review, review changes                                                    |
| `run-checks`          | run checks, run-checks, quality checks                                                      |
| `architecture-review` | review architecture, check clean arch, architecture audit, layer violation, check structure  |
| `init-project`        | init project, setup project, apply ai-workflows, initialize project                         |
| `upstream-rules`      | upstream rule, propose rule, share rule change, sync rule back                              |

## Shared Workflow Source

Changes to shared AI workflow assets should usually be proposed upstream in
`~/Web/ai-workflows/` instead of living only in this synced target repo.

Treat these as shared workflow assets:

- `rules/**`
- `.github/prompts/**`
- `AGENTS.md`
- `CLAUDE.md`
- `.cursor/rules/**`

When a task changes those files in a generally reusable way, proactively
suggest creating a PR in `ai-workflows` so the change can be synced back into
target repos.

### Command-Only Workflows

- `kill port`, `port 3000`, `eaddrinuse` -> `commands/safe-kill-port.md`
- `new device`, `setup device`, `onboarding` -> `commands/new-device-setup.md`

## Safety

<!-- BEGIN SHARED:safety -->
<!-- END SHARED:safety -->
