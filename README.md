# ai-workflows

Shared AI workflow configuration for local agents and synced project adapters.

This repo is the source of truth for reusable:

- command runbooks
- baseline rules
- custom skills
- optional preset packages
- adapter fragments
- MCP definitions
- sync scripts

## How Tools Load Instructions

The main design constraint in this repo is that the tools do not load instructions the same way.

| Tool | What it reliably loads | Practical implication |
| ---- | ---------------------- | --------------------- |
| GitHub Copilot | `.github/copilot-instructions.md` | Important coding rules must be inlined there. Prompt files help, but are not guaranteed auto-context. |
| Claude Code | `~/.claude/CLAUDE.md`, every file in `~/.claude/rules/`, and installed plugins | Global Claude rules must stay universal and slim. Skills and commands ship via the `greenberry` plugin (see Claude Plugin Marketplace below). |
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
| `packages/` | optional reusable preset bundles for project-specific sync or copy/adopt flows |
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
| Claude | `CLAUDE.md` plus global/project rules | skills first (via the `greenberry` plugin), commands as fallback |

That means the repo is intentionally not “skills only.” Copilot still needs command-friendly runbooks. Claude is skills-first as of 2026-07 (see the decision record in [docs/skills-first-migration-plan.md](docs/skills-first-migration-plan.md)): skills are canonical there and ship via the plugin marketplace, with commands as the fallback surface.

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
| CMS-backed content block architecture and transforms | `rules/content-blocks.md` |
| Payload CMS schemas, generated types, hooks, and integrations | `rules/payload.md` |
| Stack-specific architecture | the matching file in `rules/stacks/` after checking `package.json` |

This means the separate rule files are mostly conditional rather than ambient. That keeps the default context smaller and avoids applying React Native rules to a Next.js task, or vice versa.

## Type-Safety Model

The repo now treats type safety as a three-layer concern:

- universal baseline: compact rules in `shared/core-rules.md`, which are inlined
  into Copilot-facing instructions and mirrored by the general baseline rules
- deeper policy: `rules/type-safety.md` for trust boundaries, strict `tsconfig`
  posture, lint guardrails, and transport-to-domain separation
- review audit: `code-review` checks runtime validation gaps,
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
- `packages/`: optional preset bundles that can be combined per target project
- `templates/`: thin project adapter templates
- `mcp/`: canonical MCP server definitions
- `AGENTS.md`: canonical repo policy for agents that can inspect the repo
- `CLAUDE.md`: global Claude adapter
- `.github/copilot-instructions.md`: canonical Copilot adapter for this repo
- `scripts/generate-adapters.sh`: injects shared fragments and regenerates derived files
- `scripts/sync.sh`: syncs either global agent folders or a target project
- `scripts/validate-ai-instructions.sh`: regenerates adapters and checks for drift
- `docs/pipeline-map.md`: which rule, skill, and command fires in which delivery phase

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
- `.cursor/rules/graphify.mdc`, `.claude/settings.json`: graphify knowledge-graph rule + hooks (both guarded; settings only written when the project has none)

Project-local conventions always win over the shared baseline.

## Global Sync Model

`./scripts/sync.sh` syncs reusable assets into local agent folders.

Current targets:

- `~/.cursor/commands`
- `~/.cursor/skills-cursor/ai-workflows`
- `~/.cursor/mcp/ai-workflows`
- `~/.codex/skills/custom`
- `~/.claude/CLAUDE.md`
- `~/.claude/rules` with the universal subset only

All commands, rules, and skills are synced by default. The repository has no
separate opt-in workflow tier.

Claude Code is the exception to file-copy sync: it gets skills and commands
from the plugin marketplace below, and sync removes any copies left behind by
earlier syncs (repo-owned names only) so they cannot shadow the plugin.

## Claude Plugin Marketplace

Claude Code loads skills and commands from the `greenberry` plugin instead of
file copies. The repo root is the plugin (`.claude-plugin/` holds both the
plugin and marketplace manifests), so `skills/` and `commands/` are served
without duplication and every commit to `main` is a new plugin version.

### Migrating a developer machine (one-time, ~5 minutes)

1. **Check GitLab access.** The marketplace clones over git. Test SSH with
   `ssh -T git@gitlab.com` — a `Welcome to GitLab, @you!` means you are set.
   No SSH key? Either add one under *GitLab → Preferences → SSH Keys*
   (recommended; background auto-update only works over SSH), or use the
   HTTPS URL in step 2 — install and manual refresh then run through your
   glab login, but background auto-updates stay off.

2. **Install the plugin — before running sync.** Inside Claude Code:

   ```
   /plugin marketplace add git@gitlab.com:greenberrynl/config/ai-workflows.git
   /plugin install greenberry@ai-workflows
   ```

   (HTTPS variant: `/plugin marketplace add https://gitlab.com/greenberrynl/config/ai-workflows.git`)

   The order is deliberate: the sync in step 3 removes the old skill copies
   from `~/.claude`, so installing the plugin first means you are never
   without skills.

3. **Refresh the local sync.**

   ```bash
   cd ~/Web/ai-workflows
   git checkout main && git pull --ff-only
   ./scripts/sync.sh
   ```

   Sync removes the old copies in `~/.claude/skills` and `~/.claude/commands`
   (repo-owned names only; personal skills stay) and refreshes `CLAUDE.md`
   plus the universal rules subset.

4. **Verify.** `/plugin` lists `greenberry` as installed and enabled, typing
   `/greenberry:` shows the skills, and asking for e.g. a commit message in
   plain language still triggers the skill through its description.

### Existing projects

Project sync never overwrites an existing `.claude/settings.json`. If a
project already has one, merge these keys in manually — teammates opening the
project then get a one-time install prompt:

```json
"extraKnownMarketplaces": {
  "ai-workflows": {
    "source": {
      "source": "url",
      "url": "git@gitlab.com:greenberrynl/config/ai-workflows.git"
    },
    "autoUpdate": true
  }
},
"enabledPlugins": {
  "greenberry@ai-workflows": true
}
```

Projects without their own settings get this automatically on the next
`./scripts/sync.sh --project <path>`.

### How it behaves

- Plugin skills invoke as `/greenberry:<skill>` (for example
  `/greenberry:create-pr`). Natural-language triggers keep working through
  each skill's `description` frontmatter.
- Global sync still ships the ambient layer (`~/.claude/CLAUDE.md` and the
  universal rules subset). Plugins have no primitive for always-on context,
  so rules stay on sync by design.
- Updates arrive automatically over SSH; Claude Code prompts to reload when
  something new landed.

### Troubleshooting

| Symptom | Fix |
| ------- | --- |
| `Permission denied (publickey)` on marketplace add | No SSH key for gitlab.com — see step 1. |
| Skills show up twice | Old copies still in `~/.claude/skills` — run `./scripts/sync.sh` again (step 3). |
| glab reports `invalid_grant` and `git push` fails with `could not read Username` | The glab OAuth token broke and git-HTTPS auth runs through glab. Re-authenticate with `glab auth login` using a **Personal Access Token** (scopes `api` + `write_repository`) — PATs have no refresh races. |
| A merged skill change is not visible yet | `/plugin marketplace update ai-workflows`, then `/reload-plugins`. |

## Knowledge Graph (graphify)

[graphify](https://github.com/safishamsi/graphify) builds a queryable knowledge
graph of a codebase so agents can ask scoped questions instead of grepping raw
files. The adapter guidance lives in `shared/graphify.md` (injected into the
CLAUDE/AGENTS/Copilot templates), and project sync writes `.cursor/rules/graphify.mdc`
plus a graphify-hooked `.claude/settings.json` (only when the project has none).
Everything is guarded on `graphify-out/graph.json`, so it no-ops in repos without a graph.

The graph data (`graphify-out/`) is gitignored, so each developer builds their own:

```bash
brew install uv                 # if uv is not installed
uv tool install graphifyy       # installs the graphify CLI to ~/.local/bin
graphify install                # register rules/hooks for the local agents
graphify update .               # build the initial local graph
```

After that, `graphify update .` (also run automatically by the Claude PostToolUse
hook) keeps the graph current — AST-only, no API cost.

## First-Time Setup

```bash
git clone git@gitlab.com:greenberrynl/config/ai-workflows.git ~/Web/ai-workflows
cd ~/Web/ai-workflows
./scripts/generate-adapters.sh
./scripts/sync.sh
./scripts/install-hooks.sh
```

For Claude Code, also install the plugin once (inside Claude Code):

```
/plugin marketplace add git@gitlab.com:greenberrynl/config/ai-workflows.git
/plugin install greenberry@ai-workflows
```

`install-hooks.sh` installs two hooks: a pre-commit drift check
(`validate-ai-instructions.sh`) and a pre-push guard that refuses direct pushes
to `main`/`master`.

## Contributing to This Repo

Every change here lands via a **GitLab MR with `wieteke.pots` as reviewer** —
never a direct push to `main`, not even a one-line doc fix. The same rule
applies to the `upstream-rules` and `upstream-to-unicore` skills when they are
run from a project. The canonical wording lives in `shared/upstream-mr.md` and
is injected into every adapter (`CLAUDE.md`, `AGENTS.md`, Copilot instructions,
project templates).

```bash
git switch -c <type>/<slug>
git push -u <gitlab-remote> HEAD
glab mr create -R greenberrynl/config/ai-workflows \
  --target-branch main --reviewer wieteke.pots \
  --title "<type>: <summary>" --description "<body>"
```

Useful variants:

```bash
# preview sync changes
./scripts/sync.sh --dry-run

# sync adapters and runbooks into a project
./scripts/sync.sh --project /path/to/project
```

## Project Sync Quick Start

Use this flow when a developer starts on a new or existing project.

### 1. Initialize the project context

Open the target project in Codex, Claude, or Cursor and ask:

> Initialize this project with the `init-project` workflow. Use
> `~/Web/ai-workflows` as the canonical source.

The workflow analyzes the stack and project structure and creates
`CONVENTIONS.md`. This file is the project-owned source of truth for local
scripts, structure, conventions, and intentional deviations from the shared
baseline.

### 2. Preview the project sync

Run the sync command from the `ai-workflows` checkout. The target directory must
already exist.

```bash
cd ~/Web/ai-workflows
./scripts/sync.sh --dry-run --project ~/Web/my-project
```

Review the preview before writing files, especially when the project already
contains agent instructions or workflow directories.

### 3. Apply the project sync

```bash
./scripts/sync.sh --project ~/Web/my-project
```

The sync preserves the project-owned `CONVENTIONS.md` and installs or refreshes:

- `AI-WORKFLOWS.md`
- `AGENTS.md` and `CLAUDE.md`
- `.github/copilot-instructions.md` and `.github/prompts/`
- `.cursor/rules/`
- `rules/` and `commands/`

An existing `.claude/settings.json` is also preserved. Merge the generated
graphify hooks manually when that project should use them.

### 4. Review and commit

In the target project:

1. Run `git status --short` and review the generated changes.
2. Confirm that `CONVENTIONS.md` accurately describes the project.
3. Run the project's normal validation commands.
4. Commit the synchronized files using the project's normal Git workflow.

Put project-specific changes in `CONVENTIONS.md`. Treat the other synchronized
workflow files as generated assets: a later sync can overwrite them. Make
reusable workflow changes in this repository first, then re-sync the projects
that should receive them.

### 5. Keep a project current

```bash
cd ~/Web/ai-workflows
git pull --ff-only
./scripts/sync.sh --dry-run --project ~/Web/my-project
./scripts/sync.sh --project ~/Web/my-project
```

## Daily Use

1. Edit the canonical source in this repo.
2. Run `./scripts/generate-adapters.sh`.
3. Run `./scripts/validate-ai-instructions.sh`.
4. Commit the source changes.
5. Re-run `./scripts/sync.sh` globally or `./scripts/sync.sh --project <path>` for target repos.

## Adjusting Rules

Use this split when deciding where a change belongs:

- Put reusable project presets or opt-in bundles in `packages/`.
- Put project-specific stack, structure, scripts, and exceptions in `CONVENTIONS.md`.
- Put reusable coding standards in `rules/`.
- Keep compact universal type-safety doctrine in `shared/core-rules.md`, and
  put the detailed enforcement guidance in `rules/type-safety.md`.
- Put reusable multi-step workflows in `skills/` first.
- Put Copilot-compatible wrappers and fallback procedures in `commands/`.
- Put tool-specific adapter wording in `templates/`, `AGENTS.md`, `CLAUDE.md`, or `.github/copilot-instructions.md`.
- Put repeated adapter snippets in `shared/`.

If a synced project changes a shared workflow file in a generally reusable way, upstream it back into this repo instead of letting that project drift.

## Package Composition

The new `packages/` layer is intended for Greenberry-flavored project presets.
Use [packages/selection.md](/Users/wietekepots/Web/ai-workflows/packages/selection.md) as the composition rule:

- start with `greenberry-base`
- add stack packages such as `frontend`, `nextjs`, and `payload`
- add concern packages such as `accessibility` and `testing`
- keep final project exceptions in `CONVENTIONS.md`

Each package exposes a lightweight `package.yaml` manifest so future sync or
bootstrap tooling can select packages without coupling the repo to one agent or
IDE.

## Maintainer Notes

### Add or update a command

1. Edit the runbook in `commands/`.
2. Add or update the trigger mapping in `shared/command-mappings.md`.
3. Run `./scripts/generate-adapters.sh`.

### Add or update a skill

1. Edit or create `skills/<name>/SKILL.md`.
2. Record the canonical surface in `docs/workflow-canonical-sources.md`.
3. Place it in the process in `docs/pipeline-map.md` — which phase it fires in,
   and which gate it helps close.
4. Run `./scripts/validate-ai-instructions.sh`; steps 2 and 3 are checked, so a
   missing entry shows up as a warning rather than staying invisible.

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

This smoke test covers the default project sync path, all shared workflow
assets, prompt generation alignment, and both `CONVENTIONS.md` present/missing
behavior.

## Safety

- Make edits in this repo first, then sync.
- Avoid hand-editing synced targets unless you intentionally want local drift.
- Codex system skills are never touched; sync writes only to `~/.codex/skills/custom`.
- Cursor MCP files are namespaced under `mcp/ai-workflows` so existing local MCP config is not overwritten.
- Adapter files are partially generated; edit the canonical source, not the injected content between shared markers.
