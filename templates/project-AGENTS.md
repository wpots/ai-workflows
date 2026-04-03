# AGENTS.md

Read `CONVENTIONS.md` for project-specific context, stack, structure, and conventions.

## Precedence

1. `CONVENTIONS.md` (project-specific conventions)
2. This file (workflow dispatch)
3. Global baseline rules from ai-workflows

When CONVENTIONS.md conflicts with global rules, CONVENTIONS.md wins.

## Workflow Dispatch

### Skills

Skills are the primary dispatch mechanism for repeatable workflows.

| Skill                 | Trigger phrases                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------- |
| `commit-message`      | commit message, write commit, git commit                                                    |
| `scaffold-component`  | new component, scaffold, create component                                                   |
| `create-pr`           | create pr, open pr, submit pr                                                               |
| `code-review`         | review code, code review, review changes                                                    |
| `run-checks`          | run checks, run-checks, quality checks                                                      |
| `architecture-review` | review architecture, check clean arch, architecture audit, layer violation, check structure  |
| `init-project`        | init project, setup project, apply ai-workflows, initialize project                         |

### Command-Only Workflows

- `kill port`, `port 3000`, `eaddrinuse` -> `commands/safe-kill-port.md`
- `new device`, `setup device`, `onboarding` -> `commands/new-device-setup.md`

## Safety

<!-- BEGIN SHARED:safety -->
<!-- END SHARED:safety -->
