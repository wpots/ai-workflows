# ai-workflows

Shared AI workflow configuration for Claude Code, Cursor, Codex, and GitHub
Copilot — and the sync that installs it into a project.

This repo is the source of truth for reusable:

- custom skills
- baseline rules
- command runbooks
- adapter fragments
- integration tooling doctrine (`docs/tooling.md`)
- sync scripts

## Start Here

Adoption has two axes: **your machine** (once per developer) and **each project**
(once, then kept current). Find your situation.

| Your situation | Go to |
| --- | --- |
| I want the skills and rules available in my tools | [Set up your machine](docs/setup-machine.md) |
| Do I even need a local clone of this repo? | [Do I need a local clone?](docs/setup-machine.md#do-i-need-a-local-clone) |
| New project, **no repo yet** | [Start a new project → No repo yet](docs/adopt-new-project.md#no-repo-yet) |
| New project, **repo exists** (empty or template clone) | [Start a new project → Repo exists](docs/adopt-new-project.md#repo-exists) |
| Existing project with code and **its own AI setup** (hand-written `CLAUDE.md`, Cursor rules, Copilot instructions) | [Adopt in an existing project](docs/adopt-existing-project.md) |
| Existing project **already on ai-workflows** — keep it current | [Keep current](docs/keep-current.md) |
| Something is broken | [Troubleshooting](docs/troubleshooting.md) |
| I want to change a rule, skill, or command | [Contributing](docs/contributing.md) |

Shortest possible version for a new developer on an already-adopted project:
install the Claude plugin, and you are done —
[why](docs/setup-machine.md#do-i-need-a-local-clone).

## What You Get

| Surface | What it is |
| --- | --- |
| `skills/` | multi-step workflows — kickoff, user journeys, backlog, sprint, review, audit, maintenance. Canonical surface on skill-aware tools. |
| `rules/` | Coding and policy baseline, loaded per task rather than all at once. |
| `commands/` | The same workflows as runbooks, for tools that cannot use skills (Copilot). |
| tool adapters | `CLAUDE.md`, `AGENTS.md`, Copilot instructions, Cursor rules — thin, generated, always-on routing. |
| `mcp/` | Canonical MCP server definitions. |

Full inventory of every skill, command, rule, and MCP server:
[FEATURES.md](FEATURES.md).

Two things worth knowing up front:

- **Claude Code gets skills and commands from the `greenberry` plugin**, not from
  file copies, and its ambient layer refreshes itself through a `SessionStart`
  hook. Cursor and Codex are file-copy only, via `scripts/sync.sh`.
- **`CONVENTIONS.md` in a project is project-owned** and never overwritten.
  Everything else sync writes is generated — edit it here, not there.

Why the surfaces are split that way, what each tool actually loads, and which
files are generated: [How it works](docs/how-it-works.md).

## Repository Layout

| Path | Contains |
| --- | --- |
| `skills/` | custom skills (the canonical workflow surface) |
| `commands/` | reusable workflow runbooks (fallback surface) |
| `rules/` | focused baseline rule files plus stack-specific add-ons in `rules/stacks/` |
| `shared/` | canonical fragments injected into adapter files |
| `templates/` | thin project adapter and document templates |
| `.claude-plugin/` | plugin and marketplace manifests for the `greenberry` plugin |
| `hooks/hooks.json` | hooks shipped by that plugin: the `PreToolUse` gates, the added-comments check, the ambient-layer `SessionStart` sync and the `Stop` prompt for the improve-skill retrospective |
| `scripts/` | sync, adapter generation, validation, smoke tests |
| `docs/` | the guides below, plus the pipeline map and decision records |
| `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md` | generated adapters for this repo itself |

Key scripts:

| Script | Does |
| --- | --- |
| `scripts/sync.sh` | syncs global agent folders, or a target project with `--project` |
| `scripts/sync-ambient.sh` | owns the Claude ambient layer; called by `sync.sh` and by the plugin hook |
| `scripts/generate-adapters.sh` | injects shared fragments and regenerates derived files |
| `scripts/validate-ai-instructions.sh` | full validation pipeline (also the pre-commit hook) |
| `scripts/install-hooks.sh` | installs the pre-commit drift check and the push-to-`main` guard |

## Documentation

| Doc | For |
| --- | --- |
| [docs/setup-machine.md](docs/setup-machine.md) | one-time developer setup: clone, plugin, sync targets, ambient layer, graphify |
| [docs/adopt-new-project.md](docs/adopt-new-project.md) | new project, with or without a repo |
| [docs/adopt-existing-project.md](docs/adopt-existing-project.md) | retrofit onto an existing codebase and its existing AI instructions |
| [docs/keep-current.md](docs/keep-current.md) | keeping machine and projects up to date, and what a re-sync overwrites |
| [docs/how-it-works.md](docs/how-it-works.md) | the design model: loading per tool, surfaces, rule split, type-safety model, generated vs canonical |
| [docs/troubleshooting.md](docs/troubleshooting.md) | symptom → fix |
| [docs/contributing.md](docs/contributing.md) | the MR rule, daily loop, maintainer notes, plugin releases, validation |
| [FEATURES.md](FEATURES.md) | full inventory of skills, commands, rules, MCP servers |
| [docs/pipeline-map.md](docs/pipeline-map.md) | which rule, skill, hook, and loop fires in which delivery phase |
| [docs/workflow-canonical-sources.md](docs/workflow-canonical-sources.md) | declared canonical source per reusable workflow |
| [docs/skills-first-migration-plan.md](docs/skills-first-migration-plan.md) | decision record for skills-first on Claude |

## Contributing

Every change lands via a **GitLab MR with `wieteke.pots` as reviewer** — never a
direct push to `main`, not even a one-line doc fix. Details, plus the plugin
release rule: [docs/contributing.md](docs/contributing.md).
