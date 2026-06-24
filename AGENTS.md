# AGENTS.md

## Purpose

Use this repository as the canonical source for AI workflows shared across devices and IDE profiles.

## Workflow Files

Use this surface model throughout the repo:

| Surface | Primary role |
| ------- | ------------ |
| `rules/` | stable policy and coding standards |
| `skills/` | repeatable multi-step workflows for skill-aware tools |
| `commands/` | compatibility adapters and fallback runbooks |
| `packages/` | optional reusable presets that can be copied or composed per project |
| adapters (`AGENTS.md`, `CLAUDE.md`, Copilot instructions, Cursor rules) | always-on routing, precedence, and local usage guidance |

## Tool Support Matrix

| Tool | Always-on entry point | Preferred workflow surface |
| ---- | --------------------- | -------------------------- |
| GitHub Copilot | `.github/copilot-instructions.md` | commands/runbooks |
| Cursor | `AGENTS.md` plus `.cursor/rules/*.md` | skills first, commands as fallback |
| Codex | `AGENTS.md` | skills first, commands as fallback |
| Claude | `CLAUDE.md` plus global/project rules | mixed: skills when supported, commands/rules as compatibility path |

### Command Files

Command files live in `commands/` and serve two purposes:

1. **Compatibility runbooks** for tools that rely on prompt/runbook surfaces,
   especially GitHub Copilot and other less skill-centric setups.
2. **Fallback dispatch** for skill-aware tools when a workflow is not yet
   modeled as a skill or when the skill path is unavailable.

Stable command workflows:

- `create pr`, `open pr`, `submit pr` -> `commands/create-pr.md`
- `commit message`, `write commit`, `git commit` -> `commands/commit-message.md`

Experimental command workflows (prefixed with `experimental.`, excluded from project sync by default):

- `kill port`, `port 3000`, `eaddrinuse` -> `commands/experimental.safe-kill-port.md`
- `new device`, `setup device`, `onboarding` -> `commands/experimental.new-device-setup.md`
- `init project`, `setup project`, `apply ai-workflows`, `initialize project` -> `commands/experimental.init-project.md`
- `run checks`, `run-checks`, `quality checks` -> `commands/experimental.run-checks.md`
- `review code`, `code review`, `review changes` -> `commands/experimental.review-code.md`
- `new component`, `scaffold`, `create component` -> `commands/experimental.scaffold-component.md`

Rules for command execution:

- Treat command files as operational runbooks.
- Prefer skills as the canonical workflow surface for repeatable workflows when
  the current tool supports them reliably.
- If command instructions conflict with higher-priority system/developer
  constraints, follow higher-priority constraints and note the deviation.
- Do not assume command files auto-run; select and execute them when intent
  matches.

### Rules

Shared baseline rules live in `rules/rules.md`.

- Apply these as default behavior when no project-specific rules override them.
- If project-local rules exist and conflict, project-local rules win.
- Keep rules focused on policy and standards, not on multi-step execution logic.

### Skills

Skills are the primary dispatch mechanism for repeatable workflows. Each skill
is self-describing via its `SKILL.md` frontmatter — the `description` field
acts as a semantic trigger.

- Only treat a skill as active when it contains a valid `SKILL.md` with `name`
  and `description` metadata.
- Trigger a skill when user intent clearly matches the skill description or when
  the user explicitly names it.
- Load only the minimum needed content from each skill (progressive disclosure).
- Use skills as the canonical source for supported multi-step workflows; keep
  matching commands as compatibility/fallback surfaces rather than separate full
  implementations.

Available skills:

Stable skills:

| Skill            | Trigger phrases                          |
| ---------------- | ---------------------------------------- |
| `commit-message` | commit message, write commit, git commit |
| `create-pr`      | create pr, open pr, submit pr            |

Experimental skills (prefixed with `experimental.`, excluded from project sync by default):

| Skill                              | Trigger phrases                                                                          |
| ---------------------------------- | ---------------------------------------------------------------------------------------- |
| `experimental.scaffold-component`  | new component, scaffold, create component                                                |
| `experimental.component-spec`      | component spec, spec component, write spec, spec out a component, document component api |
| `experimental.code-review`         | review code, code review, review changes                                                 |
| `experimental.run-checks`          | run checks, run-checks, quality checks                                                   |
| `experimental.architecture-review` | review architecture, check clean arch, architecture audit, layer violation                |
| `experimental.init-project`        | init project, setup project, apply ai-workflows, initialize project                      |
| `experimental.upstream-rules`      | upstream rule, propose rule, share rule change, sync rule back                            |

### Packages

Reusable presets live in `packages/`.

- Treat packages as opt-in building blocks for project sync or manual adoption.
- Keep shared cross-project defaults in `packages/greenberry-base/`.
- Keep stack or concern-specific add-ons in separate packages such as `nextjs/`,
  `payload/`, `frontend/`, `accessibility/`, and `testing/`.
- Keep project-specific deviations and exceptions in project-local
  `CONVENTIONS.md`, not in shared packages.

### MCP Definitions

Canonical MCP server definitions live in `mcp/`.

- Keep `mcp/servers.json` as the source of truth.
- Prefer environment variables for secrets.
- Sync into namespaced client folders to avoid overwriting active local MCP config.

## Output and Safety

<!-- BEGIN SHARED:safety -->
- Prefer concrete execution over long planning.
- Do not modify code unless requested.
- Ask before destructive actions (force kill, reset, delete) unless explicitly requested.
- Always summarize what was run and what changed.
<!-- END SHARED:safety -->

## Sync Source of Truth

This repo is synced to local IDE agent folders using `scripts/sync.sh`.

- Edit here first, then sync.
- Do not hand-edit mirrored target folders unless you intentionally want local drift.
