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
| Claude | `CLAUDE.md` plus global/project rules | skills first (via the `greenberry` plugin), commands as fallback |

### Command Files

Command files live in `commands/` and serve two purposes:

1. **Compatibility runbooks** for tools that rely on prompt/runbook surfaces,
   especially GitHub Copilot and other less skill-centric setups.
2. **Fallback dispatch** for skill-aware tools when a workflow is not yet
   modeled as a skill or when the skill path is unavailable.

Command workflows:

- `create pr`, `open pr`, `submit pr` -> `commands/create-pr.md`
- `commit message`, `write commit`, `git commit` -> `commands/commit-message.md`

- `kill port`, `port 3000`, `eaddrinuse` -> `commands/safe-kill-port.md`
- `new device`, `setup device`, `onboarding` -> `commands/new-device-setup.md`
- `init project`, `setup project`, `apply ai-workflows`, `initialize project` -> `commands/init-project.md`
- `run checks`, `run-checks`, `quality checks` -> `commands/run-checks.md`
- `review code`, `code review`, `review changes` -> `commands/review-code.md`
- `new component`, `scaffold`, `create component` -> `commands/scaffold-component.md`
- `work backlog`, `work the backlog`, `next backlog item`, `autonomous delivery` -> `commands/work-backlog.md`

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

| Skill            | Trigger phrases                          |
| ---------------- | ---------------------------------------- |
| `commit-message` | commit message, write commit, git commit |
| `create-pr`      | create pr, open pr, submit pr            |
| `scaffold-component`  | new component, scaffold, create component                                                |
| `component-spec`      | component spec, spec component, write spec, spec out a component, document component api |
| `code-review`         | review code, code review, review changes                                                 |
| `run-checks`          | run checks, run-checks, quality checks                                                   |
| `architecture-review` | review architecture, check clean arch, architecture audit, layer violation                |
| `init-project`        | init project, setup project, apply ai-workflows, initialize project                      |
| `upstream-rules`      | upstream rule, propose rule, share rule change, sync rule back                            |
| `improve-skill`       | improve skill, take learnings, verbeter je skill                                         |
| `work-backlog`        | work backlog, next backlog item, autonomous delivery                                     |

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

## Shared Workflow Assets Land via MR

<!-- BEGIN SHARED:upstream-mr -->
This is a hard rule, not a preference. It applies whenever you work in a
canonical config repo (`ai-workflows`, `unicore-template`) **or** run an
upstream skill (`upstream-rules`, `upstream-to-unicore`) from any project.

- NEVER commit or push to `main` (or the template's target branch) directly —
  not for a one-line doc fix, not even when the push would succeed.
- Always: feature branch off the latest remote base → commit → push → open a
  **GitLab MR** on the canonical GitLab remote (resolve that remote by URL,
  never by assuming its name).
- Always request review from the maintainer, `wieteke.pots`, on that MR:
  `glab mr create … --reviewer wieteke.pots`. On an MR that already exists:
  `glab mr update <iid> --reviewer wieteke.pots`.
- When the MR changes what the `greenberry` plugin ships or how it behaves —
  `skills/`, `commands/`, `.claude-plugin/`, `hooks/`, a script a hook runs, or
  the ambient layer (`CLAUDE.md`, `rules/communication.md`,
  `rules/project.md`, `rules/clean-architecture.md`) — bump the `version` in
  `.claude-plugin/plugin.json` and add the matching `CHANGELOG.md` entry in
  the same MR. The install path is version-keyed, so an unbumped release is
  invisible in `/plugin` and indistinguishable from the previous one.
- An MR without that reviewer is not done. Confirm it with
  `glab mr view <iid>` before reporting, and report the real MR URL — never
  claim an MR or a reviewer the CLI did not confirm.
- The GitHub mirror is not a substitute: these repos are reviewed on GitLab
  (GitHub also refuses a review request from the PR author).
<!-- END SHARED:upstream-mr -->

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
