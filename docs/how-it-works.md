# How It Works

The design model behind the repo: why there are four surfaces, which one a tool
actually reads, and which files you may edit.

Just trying to get set up? → [setup-machine.md](setup-machine.md).

## Tools Do Not Load Instructions The Same Way

This is the main design constraint in the repo. Everything else follows from it.

| Tool | What it reliably loads | Practical implication |
| ---- | ---------------------- | --------------------- |
| GitHub Copilot | `.github/copilot-instructions.md` | Important coding rules must be inlined there. Prompt files help, but are not guaranteed auto-context. |
| Claude Code | `~/.claude/CLAUDE.md`, every file in `~/.claude/rules/`, and installed plugins | Global Claude rules must stay universal and slim. The plugin delivers them to `~/.claude/rules/` (this repo's `CLAUDE.md` as `ai-workflows.md`) and leaves `~/.claude/CLAUDE.md` to the user. Skills and commands ship via the `greenberry` plugin. |
| Codex | `AGENTS.md`, skills, and repo files it can inspect | `AGENTS.md` stays thin and points to the real project context. |

Because of that:

- Claude global sync ships only universal rules: `communication.md`,
  `project.md`, `clean-architecture.md`.
- Copilot project sync inlines both `CONVENTIONS.md` and a condensed shared
  baseline.
- Synced projects get an `AI-WORKFLOWS.md` guide explaining the per-tool loading
  model locally.

## The Surfaces And Their Jobs

| Surface | Primary role |
| ------- | ------------ |
| `rules/` | stable policy and coding standards |
| `skills/` | repeatable multi-step workflows for skill-aware tools |
| `commands/` | compatibility adapters and fallback runbooks |
| tool adapters | always-on routing, precedence, and local usage guidance |

Recommended default when adding something:

- new policy → add or update a rule file
- new reusable workflow → create a skill first
- Copilot or fallback support for that workflow → add a command/runbook wrapper
- always-on baseline → keep it compact in adapters or shared fragments

[workflow-canonical-sources.md](workflow-canonical-sources.md) records the
declared canonical source of each reusable workflow.

## Tool Support Matrix

| Tool | Always-on entry point | Preferred workflow surface |
| ---- | --------------------- | -------------------------- |
| GitHub Copilot | `.github/copilot-instructions.md` | commands/runbooks |
| Cursor | not supported; sync generates nothing for it | — |
| Codex | `AGENTS.md` | skills first, commands as fallback |
| Claude | `CLAUDE.md` (which imports `AGENTS.md` and `CONVENTIONS.md`) plus global/project rules | skills first (via the `greenberry` plugin), commands as fallback |

The repo is intentionally not “skills only.” Copilot still needs
command-friendly runbooks. Claude is skills-first as of 2026-07 — the decision
record is in [skills-first-migration-plan.md](skills-first-migration-plan.md).

## Always-On Vs On-Demand Rules

The rule split is intentional: always-on guidance stays compact and durable,
while focused files in `rules/` load when the task calls for them.

| Task type | Rule to consult |
| --------- | --------------- |
| TypeScript-heavy code, API/JSON/env/database boundaries | `rules/type-safety.md` |
| Styling, tokens, Tailwind | `rules/tailwind.md` |
| Tests and test reviews | `rules/testing.md` |
| Interactive UI and accessibility checks | `rules/accessibility.md` |
| User stories, specs, backlog work | `rules/backlog.md` |
| Sizing or slicing work, and MR scope | `rules/mr-sizing.md` |
| CMS-backed content block architecture and transforms | `rules/content-blocks.md` |
| Payload CMS schemas, generated types, hooks, integrations | `rules/payload.md` |
| Stack-specific architecture | the matching file in `rules/stacks/` after checking `package.json` |

So the separate rule files are mostly conditional rather than ambient. That keeps
default context smaller and avoids applying React Native rules to a Next.js task.

### How developers should use them

Treat the synced setup as two layers: the **ambient baseline** (tool adapter plus
`CONVENTIONS.md`) and **task-specific guidance** (the relevant file in `rules/`,
`skills/`, or `commands/`).

- For broad implementation tasks, just start — the adapter and `CONVENTIONS.md`
  already set the baseline.
- For narrow tasks, name the rule in the prompt: `rules/testing.md`,
  `rules/accessibility.md`, `rules/tailwind.md`.
- For trust-boundary work, name `rules/type-safety.md` so the tool audits runtime
  validation and unsafe assertions, not just TypeScript syntax.
- For repeatable multi-step workflows on Codex, prefer the matching skill when
  one exists.
- For Copilot, rely on commands/runbooks rather than assuming skills exist, and
  assume only `.github/copilot-instructions.md` is ambient.
- For reviews and audits, name the policy you want checked — e.g.
  `rules/clean-architecture.md` plus the matching stack rule.

Even on tools that can inspect local files, naming the focused rule gives a
better signal for specialized tasks.

## Type-Safety Model

Three layers:

- **universal baseline** — the TypeScript section of `rules/project.md`, which
  loads in every Claude session
- **deeper policy** — `rules/type-safety.md` for trust boundaries, strict
  `tsconfig` posture, lint guardrails, transport-to-domain separation
- **review audit** — `code-review` checks runtime validation gaps, unsafe
  assertions, and missing workflow guardrails

The posture is compile-time strictness *plus* runtime validation at trust
boundaries. TypeScript alone is not treated as proof that external data is safe.

## Generated Vs Canonical Files

Canonical source files — edit these directly:

- `commands/`
- `rules/`
- `skills/`
- `shared/`
- `templates/`
- `scripts/`

Generated or derived convenience artifacts — do not hand-edit:

- `AGENTS.md`
- `CLAUDE.md`
- `.vscode/tasks.json`

`.vscode/tasks.json` stays in the repo as a generated convenience surface for
local execution, not as a primary architectural artifact.

In adapter files, the content between `<!-- BEGIN SHARED:<name> -->` markers comes
from `shared/` — edit the fragment, not the injected copy.

## Project Documents

Adoption writes several documents into a project, and the whole point is that each
fact has exactly one home. Duplicate a boundary and one copy is wrong within a
sprint.

| Document | Owns | Written by |
| --- | --- | --- |
| `docs/project-brief.md` | why the product exists, for whom, what success is | `start-project` |
| `docs/project-spec.md` | the product rules of this release | `start-project` |
| `docs/journeys/<slug>.md` | how a user walks one journey, step by step, plus its slice candidates | `user-journeys` |
| `docs/architecture.md` | intent and rationale of the structure, decision log, known debt | `start-project` |
| `CONVENTIONS.md` | detected facts as they are today | `setup-ai-workflows` |
| `docs/backlog/` | the work, one item per reviewable MR | `backlog` |

A journey references a spec rule instead of restating it; `CONVENTIONS.md` links to
the architecture doc for the *why*. Work is sized where it is written, not at MR
time — [`rules/mr-sizing.md`](../rules/mr-sizing.md) holds that budget.

## Sync Models

**Global sync** (`./scripts/sync.sh`) writes reusable assets into local agent
folders; targets are listed in
[setup-machine.md](setup-machine.md#clone-the-repo).

**Project sync** (`./scripts/sync.sh --project <path>`) installs a project-facing
setup with a clear split:

- `CONVENTIONS.md` — project-owned source of truth
- `AI-WORKFLOWS.md` — developer guide for how the setup works per tool
- `CLAUDE.md`, `AGENTS.md` — thin adapters; `AGENTS.md` is the one Codex and
  Claude share, and `CLAUDE.md` imports it
- `.github/copilot-instructions.md` — Copilot adapter with context inlined
- `rules/`, `commands/` — shared baseline rules and runbooks;
  `rules/payload.md` only for projects with a `payload` or `@payloadcms/*`
  dependency
- `.github/prompts/` — Copilot prompt wrappers generated from `commands/`
- `.claude/settings.json` — graphify hooks, only written when the project has
  none

Project-local conventions always win over the shared baseline.

## The Delivery Pipeline

[pipeline-map.md](pipeline-map.md) is the canonical map of which rule, skill,
command, hook, and loop fires in which delivery phase, and how each is invoked.

A rendered copy — diagrams and all — is published for people who do not read the
repo:

<https://claude.ai/code/artifact/7df7be86-8147-44c9-a1bb-748cd31f480f>

That copy is **private by default**; it has to be shared explicitly from the
page's share menu. It is a rendered snapshot, not a second source: after changing
`docs/pipeline-map.md` or one of its diagrams, republish that same file to that
same URL, or the two drift apart. The map embeds `diagrams/pipeline.drawio.svg`
and `diagrams/improve-loop.drawio.svg` by relative path, so pass both from
`docs/diagrams/` as supporting files at those paths; without them the page shows
two broken images, and a changed diagram stays old.

## Knowledge Graph

Optional per developer, guarded on `graphify-out/graph.json` so it no-ops in repos
without a graph. Setup and behavior: [setup-machine.md](setup-machine.md#optional-knowledge-graph-graphify).
