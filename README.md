# ai-workflows

Shared AI workflow configuration for local agents and synced project adapters.

This repo is the source of truth for reusable:

- command runbooks
- baseline rules
- custom skills
- adapter fragments
- MCP definitions
- sync scripts

## How Tools Load Instructions

The main design constraint in this repo is that the tools do not load instructions the same way.

| Tool | What it reliably loads | Practical implication |
| ---- | ---------------------- | --------------------- |
| GitHub Copilot | `.github/copilot-instructions.md` | Important coding rules must be inlined there. Prompt files help, but are not guaranteed auto-context. |
| Claude Code | `~/.claude/CLAUDE.md` and every file in `~/.claude/rules/` | Global Claude rules must stay universal and slim. Project-specific detail belongs in project files. |
| Codex | `AGENTS.md`, skills, and repo files it can inspect | `AGENTS.md` should stay thin and point to the real project context. |
| Cursor | `AGENTS.md` plus `.cursor/rules/*.md` | Cursor can follow project files well, and its rules folder can auto-apply a small adapter. |

Because of that:

- Claude global sync only ships universal rules: `communication.md`, `project.md`, `clean-architecture.md`.
- Copilot project sync inlines both `CONVENTIONS.md` and a condensed shared baseline.
- Synced projects get an `AI-WORKFLOWS.md` guide that explains the per-tool loading model locally.

## Workflow Surface Strategy

The repo uses four distinct surfaces with different jobs:

| Surface | Primary role |
| ------- | ------------ |
| `rules/` | stable policy and coding standards |
| `skills/` | repeatable multi-step workflows for skill-aware tools |
| `commands/` | compatibility adapters and fallback runbooks |
| tool adapters | always-on routing, precedence, and local usage guidance |

Recommended default:

- new policy -> add or update a rule file
- new reusable workflow -> create a skill first
- Copilot or fallback support for that workflow -> add a command/runbook wrapper
- always-on baseline -> keep it compact in adapters or shared fragments

See [workflow-canonical-sources.md](/Users/wietekepots/Web/ai-workflows/docs/workflow-canonical-sources.md) for the current declared canonical source of each reusable workflow.

## Tool Support Matrix

Use this as the intended support model for the repo:

| Tool | Always-on entry point | Preferred workflow surface |
| ---- | --------------------- | -------------------------- |
| GitHub Copilot | `.github/copilot-instructions.md` | commands/runbooks |
| Cursor | `AGENTS.md` plus `.cursor/rules/*.md` | skills first, commands as fallback |
| Codex | `AGENTS.md` | skills first, commands as fallback |
| Claude | `CLAUDE.md` plus global/project rules | mixed: skills when supported, commands/rules as compatibility path |

That means the repo is intentionally not “skills only.” Copilot still needs command-friendly runbooks, and Claude should not depend exclusively on skills unless its support model is made more explicit in the future.

## Always-On Vs On-Demand Rules

The rule split is intentional:

- Always-on guidance should stay compact and durable.
- Focused rule files in `rules/` are on-demand and should be loaded when the task calls for them.

Use the focused rules like this:

| Task type | Rule to consult |
| --------- | --------------- |
| TypeScript-heavy code, API/JSON/env/database boundaries | `rules/type-safety.md` |
| Styling, tokens, Tailwind | `rules/tailwind.md` |
| Tests and test reviews | `rules/testing.md` |
| Interactive UI and accessibility checks | `rules/accessibility.md` |
| User stories, specs, backlog work | `rules/backlog.md` |
| Stack-specific architecture | the matching file in `rules/stacks/` after checking `package.json` |

This means the separate rule files are mostly conditional rather than ambient. That keeps the default context smaller and avoids applying React Native rules to a Next.js task, or vice versa.

## Type-Safety Model

The repo now treats type safety as a three-layer concern:

- universal baseline: compact rules in `shared/core-rules.md`, which are inlined
  into Copilot-facing instructions and mirrored by the general baseline rules
- deeper policy: `rules/type-safety.md` for trust boundaries, strict `tsconfig`
  posture, lint guardrails, and transport-to-domain separation
- review audit: `experimental.code-review` checks runtime validation gaps,
  unsafe assertions, and missing workflow guardrails

The recommended posture is compile-time strictness plus runtime validation at
trust boundaries. TypeScript alone is not treated as proof that external data is
safe.

## How Developers Should Use The Rules

Developers should treat the synced setup as two layers:

- ambient baseline: the tool adapter plus `CONVENTIONS.md`
- task-specific guidance: the relevant file in `rules/`, `skills/`, or `commands/`

Practical guidance:

- For broad implementation tasks, start normally; the adapter and `CONVENTIONS.md` should already set the baseline.
- For narrow tasks, mention the rule explicitly in the prompt: for example `rules/testing.md`, `rules/accessibility.md`, or `rules/tailwind.md`.
- For trust-boundary work, mention `rules/type-safety.md` explicitly so the
  tool audits runtime validation and unsafe assertions, not just TypeScript
  syntax.
- For repeatable multi-step workflows on Cursor or Codex, prefer invoking the matching skill when one exists.
- For Copilot, rely on commands/runbooks rather than assuming skills exist.
- For reviews and audits, name the policy you want checked: for example `rules/clean-architecture.md` plus the matching stack rule.
- For Copilot, assume only `.github/copilot-instructions.md` is ambient; if a focused rule matters, call it out in the prompt or use the related prompt/runbook.
- For Cursor, Claude Code, and Codex, the tools can inspect local files, but explicitly naming the focused rule still gives a better signal for specialized tasks.

## Repository Structure

- `shared/`: canonical fragments injected into adapter files
- `commands/`: reusable workflow runbooks
- `rules/`: focused baseline rule files plus stack-specific add-ons
- `skills/`: custom skills for Codex/Cursor/Claude-compatible setups
- `templates/`: thin project adapter templates
- `mcp/`: canonical MCP server definitions
- `AGENTS.md`: canonical repo policy for agents that can inspect the repo
- `CLAUDE.md`: global Claude adapter
- `.github/copilot-instructions.md`: canonical Copilot adapter for this repo
- `scripts/generate-adapters.sh`: injects shared fragments and regenerates derived files
- `scripts/sync.sh`: syncs either global agent folders or a target project
- `scripts/validate-ai-instructions.sh`: regenerates adapters and checks for drift

## Generated Vs Canonical Files

Treat these as the canonical source files you edit directly:

- `commands/`
- `rules/`
- `skills/`
- `shared/`
- `templates/`
- `scripts/`

Treat these as generated or derived convenience artifacts:

- `AGENTS.md`
- `CLAUDE.md`
- `.github/copilot-instructions.md`
- `.github/prompts/*.prompt.md`
- `.vscode/tasks.json`

`.vscode/tasks.json` stays in the repo as a generated convenience surface for
local execution, but it is not a primary architectural artifact in the project
sync model.

## Project Sync Model

`./scripts/sync.sh --project <path>` installs a project-facing setup with a clear split:

- `CONVENTIONS.md`: project-owned source of truth
- `AI-WORKFLOWS.md`: developer guide for how the setup works per tool
- `CLAUDE.md`, `AGENTS.md`, `.cursor/rules/conventions.mdc`: thin adapters that point back to project context
- `.github/copilot-instructions.md`: Copilot adapter with important context inlined
- `rules/` and `commands/`: shared baseline rules and reusable runbooks
- `.github/prompts/`: Copilot prompt wrappers generated from `commands/`

Project-local conventions always win over the shared baseline.

## Global Sync Model

`./scripts/sync.sh` syncs reusable assets into local agent folders.

Current targets:

- `~/.cursor/commands`
- `~/.cursor/skills-cursor/ai-workflows`
- `~/.cursor/mcp/ai-workflows`
- `~/.roo/commands`
- `~/.roo/rules-code`
- `~/.codex/skills/custom`
- `~/.claude/CLAUDE.md`
- `~/.claude/commands`
- `~/.claude/rules` with the universal subset only
- `~/.claude/skills`

Commands and skills prefixed with `experimental.` are excluded by default from sync. Use `--include-experimental` to opt in.

## First-Time Setup

```bash
git clone git@github.com:wpots/ai-workflows.git ~/Web/ai-workflows
cd ~/Web/ai-workflows
./scripts/generate-adapters.sh
./scripts/sync.sh
./scripts/install-hooks.sh
```

Useful variants:

```bash
# preview sync changes
./scripts/sync.sh --dry-run

# include experimental workflows
./scripts/sync.sh --include-experimental

# sync adapters and runbooks into a project
./scripts/sync.sh --project /path/to/project
```

## Daily Use

1. Edit the canonical source in this repo.
2. Run `./scripts/generate-adapters.sh`.
3. Run `./scripts/validate-ai-instructions.sh`.
4. Commit the source changes.
5. Re-run `./scripts/sync.sh` globally or `./scripts/sync.sh --project <path>` for target repos.

## Adjusting Rules

Use this split when deciding where a change belongs:

- Put project-specific stack, structure, scripts, and exceptions in `CONVENTIONS.md`.
- Put reusable coding standards in `rules/`.
- Keep compact universal type-safety doctrine in `shared/core-rules.md`, and
  put the detailed enforcement guidance in `rules/type-safety.md`.
- Put reusable multi-step workflows in `skills/` first.
- Put Copilot-compatible wrappers and fallback procedures in `commands/`.
- Put tool-specific adapter wording in `templates/`, `AGENTS.md`, `CLAUDE.md`, or `.github/copilot-instructions.md`.
- Put repeated adapter snippets in `shared/`.

If a synced project changes a shared workflow file in a generally reusable way, upstream it back into this repo instead of letting that project drift.

## Maintainer Notes

### Add or update a command

1. Edit the runbook in `commands/`.
2. Add or update the trigger mapping in `shared/command-mappings.md`.
3. Run `./scripts/generate-adapters.sh`.

### Add or update a shared fragment

1. Create or edit `shared/<name>.md`.
2. Add matching `<!-- BEGIN SHARED:<name> -->` markers where it should render.
3. Run `./scripts/generate-adapters.sh`.

### Add or update a project adapter

1. Edit the relevant file in `templates/`.
2. If the adapter should render shared content, add shared markers.
3. Re-run project sync against a test repo and confirm the generated output.

### Smoke test project sync

Run this before merging changes that affect project templates or sync behavior:

```bash
./scripts/smoke-test-project-sync.sh
```

This v1 smoke test covers the default project sync path, prompt generation
alignment, and both `CONVENTIONS.md` present/missing behavior. Experimental
inclusion via `--include-experimental` is still out of scope for the first
version.

## Safety

- Make edits in this repo first, then sync.
- Avoid hand-editing synced targets unless you intentionally want local drift.
- Codex system skills are never touched; sync writes only to `~/.codex/skills/custom`.
- Cursor MCP files are namespaced under `mcp/ai-workflows` so existing local MCP config is not overwritten.
- Adapter files are partially generated; edit the canonical source, not the injected content between shared markers.
