---
name: setup-ai-workflows
description: Set up or refresh the AI-workflow configuration of a project — generates CONVENTIONS.md as the single source of project context, creates thin tool adapters (CLAUDE.md, AGENTS.md, Copilot), adds a developer-facing AI-WORKFLOWS.md guide, emits an env-var-based project .mcp.json for integration tooling, and detects deviations from global rules including type-safety and trust-boundary posture. This is the config lane, not the project kickoff — a whole new project starts with skills/start-project. Use when the user asks to apply ai-workflows to a project, (re)generate CONVENTIONS.md or the tool adapters, or refresh a project's synced workflow assets.
metadata:
  owner: wieteke.pots
---

# Set Up AI Workflows In A Project

Use this skill when the user asks to apply ai-workflows rules, skills, and
commands to a project — or to regenerate `CONVENTIONS.md` and the tool adapters
after the project changed.

It configures **tooling**, not the project itself. Starting a whole new project
(repository, intent documents, journeys, first backlog) is
`skills/start-project/SKILL.md`, which runs this skill as one of its lanes.

This skill is the canonical workflow source for AI-workflow setup on
skill-aware tools. The matching command runbook is a compatibility and fallback
surface.

## Inputs

1. **Project path** — absolute path or relative to `~/Web/`. Ask if not provided.
2. **Project name** — inferred from the directory name if not given.

## Relationship to start-project

`skills/start-project/SKILL.md` owns the kickoff and calls this skill as its
configuration lane. It captures intent — `docs/project-brief.md`,
`docs/project-spec.md`, `docs/architecture.md` — while this skill captures
**detected facts**. The split is what keeps them from drifting:

| This skill writes | That skill wrote |
| --- | --- |
| stack versions, scripts, the folders that exist today, deviations | why the product exists, release rules, intended layer mapping, decisions + rationale |

So when `docs/architecture.md` exists, it is the authority on the intended
mapping — see Step 3. If none of the three documents exist and this is a fresh
project rather than an existing codebase, offer `start-project` first.

## Where The Rules And Templates Come From

Steps 4 and 6 read the shared rules and the project templates as
`<ai-workflows>/rules/` and `<ai-workflows>/templates/`. They ship with the
plugin; a `~/Web/ai-workflows/` clone exists only for developers who cloned the
repo. Use the first that exists:

1. `<skill base directory>/../../` — the harness prints the base directory when
   the skill loads, so this is the installed version exactly. Do not glob the
   plugin cache: old versions linger there.
2. `~/Web/ai-workflows/` — a local clone, and the only option on tools that do
   not load skills from the plugin.

Neither exists → say so and name both paths tried; do not guess a template.
Never edit a file under the plugin cache: an update replaces it.

## Steps

### 1. Validate Target

1. Confirm the target directory exists.
2. Check for existing files and ask before overwriting:
   - `CONVENTIONS.md` — the main output; never overwrite silently
   - `CLAUDE.md`, `AGENTS.md` — will be regenerated as thin adapters

### 2. Detect Stack

Read `package.json` (if present) and classify:

| Detected dependency            | Stack              |
| ------------------------------ | ------------------ |
| `next`                         | Next.js            |
| `next` + `@payloadcms/payload` | Next.js + Payload  |
| `expo` or `react-native`       | React Native + Expo |
| None of the above              | Generic            |

Also detect:

- **Test runner**: vitest, jest, or neither
- **Linting**: eslint, stylelint, biome
- **Styling**: tailwindcss, css modules, styled-components
- **Language**: TypeScript (a `tsconfig.json` and `.ts`/`.tsx` sources),
  JavaScript only (no `tsconfig.json`; a `jsconfig.json` or `checkJs` still
  counts as JavaScript), or mixed (`.js`/`.jsx` and `.ts`/`.tsx` side by side in
  the source folders). Anything but TypeScript deviates from the baseline in
  `rules/project.md`, so Step 4 asks where the project is heading.
- **TypeScript posture**: whether `tsconfig` uses `strict`,
  `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
  `useUnknownInCatchVariables`, `noImplicitOverride`,
  `noPropertyAccessFromIndexSignature`, `noFallthroughCasesInSwitch`, and
  `noEmitOnError`
- **Unsafe-type linting**: whether the project appears to enforce rules such as
  `no-explicit-any`, `no-unsafe-assignment`, and
  `switch-exhaustiveness-check`
- **Boundary validation approach**: whether a validation library or clear guard
  pattern exists for API, env, JSON, database, file, or queue inputs
- **Storybook**: present or not
- **Accessibility primitives**: react-aria-components, radix-ui, etc.
- **Available scripts**: from `package.json` scripts field
- **Notable dependencies**: animation libs, state management, CMS, etc.
- **Hosting and its cost-sensitive metrics**: `vercel.json` or `.vercel/` →
  Vercel (Function Invocations, Edge Requests, Firewall Rate Limit Requests);
  `netlify.toml` → Netlify (function invocations, bandwidth); `clevercloud/`
  or `CC_*` variables in `.env.example` → Clever Cloud (instance count under
  autoscaling). Confirm
  the metric names on the host's usage page and ask the developer for the
  baseline. Never guess one. The risk analysis of every dependency MR
  (`skills/npm-maintenance/references/risk-analysis.md`) reads this.

### 3. Probe Project Structure

List top-level directories under `src/` (or project root if no `src/`).

**If `docs/architecture.md` exists**, do not re-derive the mapping. Read its
layer-mapping table and use it as-is; `CONVENTIONS.md` then lists the folders
that exist and links to that document for the layer and the reason. Only report
a divergence — a folder present in the tree but absent from the table, or mapped
differently — as a finding under Step 4. Never restate the rationale, and never
silently correct the table: an intended mapping changes in
`docs/architecture.md` first, as a decision-log entry.

**If it does not exist**, map the folders to Clean Architecture layers using the
relevant stack rules table and record the mapping for use in CONVENTIONS.md.

### 4. Detect Deviations from Global Rules

Compare the detected project config against global rules in
`<ai-workflows>/rules/` (or `~/.claude/rules/`). Our projects differ in stack and
age, so deviations are normal; the baseline assumes a TypeScript Next.js
project. Flag deviations such as:

- JavaScript where the baseline expects TypeScript — JavaScript only, or a
  mixed tree
- Component libraries that differ from global rules
  (e.g., React Aria Components vs. the "no component libraries" rule)
- Dual test runners (e.g., Jest + Vitest) vs. global testing rules
- Scaffolding tools (e.g., Plop) that overlap with the scaffold-component skill
- Style approaches that differ from global Tailwind rules
- Weaker TypeScript compiler posture than the recommended flags in
  `rules/type-safety.md`
- Missing unsafe-type lint guardrails compared with `rules/type-safety.md`
- Trust-boundary data handled without a documented validation pattern
- Any conventions in existing config files (prettier, eslint, tsconfig) that
  contradict global rules

For each deviation, ask the developer which of two it is. The code cannot tell
you, and a guess becomes a rule every agent follows:

- **accepted** — the project stays this way. Record the reason. The deviation
  is the project's rule, and new code follows it.
- **migrating** — the project is moving to the baseline or another target.
  Record the target, the rule for new code (it follows the target, not the
  files next to it — `rules/clean-architecture.md`, "Conform to the rule, not
  the neighbour"), and how existing code follows: when a file is touched, or
  through backlog items.

A mixed JavaScript/TypeScript tree is the usual **migrating** case, but ask
anyway: a few `.js` config files in a TypeScript project are no migration.

The decision and its rationale have one home. When `docs/architecture.md`
exists, they belong in its decision log and `CONVENTIONS.md` carries only the
working rule plus a link. This skill does not write that log: when the entry is
missing, list it in the summary as a follow-up for `start-project` or the
developer. Without an architecture doc, the reason goes on the deviation line
itself.

### 5. Generate CONVENTIONS.md

Create `CONVENTIONS.md` at the project root. This is the **single source of
truth** for project-specific context. All tool adapters reference this file.

```markdown
# CONVENTIONS.md

## Project

<project-name> — <one-line description from package.json or README>

## Stack

- <detected stack with versions>
- <language: TypeScript | JavaScript | mixed (migrating to TypeScript)>
- <styling>
- <testing>
- <other notable deps>

## Structure

<mapped folder structure with CA layer annotations>
<when docs/architecture.md exists: one line — "Intended layer mapping and the
reasoning behind it: `docs/architecture.md`" — and no restated rationale>

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | <description> |
| ... | ... |

## Tooling

- <MCP servers from `.mcp.json` and the env vars each expects>
- <project CLIs beyond the machine baseline — see docs/tooling.md in ai-workflows>

## Hosting

- <platform and runtime; link `docs/architecture.md` when it exists>
- Cost-sensitive metrics: <metric> (<usage page>), …
- Baseline: <value per day or month, or "unknown">

## Conventions

- <project-specific conventions detected from config files>
- <scaffolding approach, component patterns, etc.>

## Type Safety

- <TypeScript strictness posture if it differs from the baseline>
- <lint guardrails that are present or intentionally absent>
- <how API/env/JSON/database/file boundaries are validated, if documented>

## Deviations from Global Rules

- <deviation> — **accepted**: <reason, or a link to the decision>
- <deviation> — **migrating** to <target>: new code <follows the target>;
  existing code <converted when touched | via backlog items>.
  <Why: `docs/architecture.md`, decision log — when that exists>
- <omit this section if no deviations detected>

## Precedence

Rules in this file override global baseline rules from ai-workflows.
When conflicts arise, this file wins for project-specific decisions.
```

Guidelines:
- Only include sections that have meaningful content.
- When `docs/project-brief.md`, `docs/project-spec.md`, or `docs/architecture.md`
  exist, link them once under `## Project` instead of summarizing them.
- Pull the description from `package.json` or the first paragraph of `README.md`.
- List only scripts that exist in `package.json`.
- Every deviation carries its status. Without one, an agent cannot tell
  whether to follow the existing code or the target.
- Keep it under 80 lines — concise and scannable.
- Distinguish between:
  - universal baseline rules from the adapters and `shared/core-rules.md`
  - deeper policy from `rules/type-safety.md`
  - review-specific audit behavior from the code-review workflow

### 6. Generate Thin Adapters

Generate tool-specific adapter files that reference CONVENTIONS.md.
Use templates from `<ai-workflows>/templates/`:

| File | Template | Strategy |
|------|----------|----------|
| `AI-WORKFLOWS.md` | `project-ai-workflows.md` | Reference guide — explains how each tool uses the synced files |
| `AGENTS.md` | `project-AGENTS.md` | Reference — "read CONVENTIONS.md"; the one adapter every agent shares |
| `CLAUDE.md` | `project-CLAUDE.md` | Import — `@AGENTS.md` and `@CONVENTIONS.md`, plus the Claude-specific lines |
| `.github/copilot-instructions.md` | `project-copilot-instructions.md` | **Inline** — embed CONVENTIONS.md content plus condensed core rules (Copilot can't rely on file refs) |

Cursor is not supported: generate nothing under `.cursor/`, and leave any
`.cursor/` files the project already has as they are.

For the Copilot adapter, read the generated CONVENTIONS.md and inject its
content between `<!-- BEGIN CONVENTIONS -->` and `<!-- END CONVENTIONS -->`
markers in the template. Also inject the shared `core-rules` fragment so the
Copilot file carries a compact coding baseline inline.

After generating adapters, inject shared fragments (command-mappings, safety,
core-rules where applicable) into the generated files using the
`<!-- BEGIN SHARED -->` / `<!-- END SHARED -->` marker pattern.

### 7. Sync Shared Workflow Files

Sync these shared workflow assets into the project:

- `rules/`
- `commands/`
- `.github/prompts/*.prompt.md` generated from `commands/`

These are reusable workflow assets, not project-owned conventions.
The type-safety split should stay visible in the generated project guidance:

- universal baseline in adapters and Copilot core rules
- deeper enforcement policy in `rules/type-safety.md`
- audit behavior in the review workflow

### 8. Emit Project Tooling

Detect integration tooling needs and write the project MCP config. Doctrine
(CLI for scriptable/headless work, MCP for browser control, design context,
and OAuth SaaS) lives in `docs/tooling.md` in ai-workflows.

| Signal | Result |
| ------ | ------ |
| `@playwright/test` in devDependencies | `playwright` server in `.mcp.json` |
| UI/e2e work needing a live, inspectable browser | `chrome-devtools` server in `.mcp.json` |
| GitLab remote on the repo | no server — `glab` CLI (machine baseline); list it in `## Tooling` |
| Ticket keys in `docs/backlog/` or MR templates | no server — `jira` CLI; list it in `## Tooling` with the project key, and the `.jira.yml` and board ids when the repo has one |
| Figma links in `docs/` or CONVENTIONS.md | Figma connector (claude.ai, per user); note it in `## Tooling` |
| Payload/Prepr (or other CMS) in package.json | document the token env vars in `## Tooling` |
| Other SaaS/tool needs | case by case, env-var-based |

Write the file, then document it:

- `.mcp.json` at the project root — checked in; secrets only as `${ENV_VAR}`
  references, never literal values
- record every server and its env vars in the `## Tooling` section of
  CONVENTIONS.md

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"]
    }
  }
}
```

If `.mcp.json` already exists, do not overwrite it — report what a manual
merge should add instead.

Also emit `.claude/skills/verify/SKILL.md` from
`templates/project-verify-SKILL.md` (`scripts/sync.sh --project` does the same
copy), unless the project already has one — never overwrite it; the project owns
it from then on. Claude Code runs a project skill named `verify` before each
commit, except docs-only and tests-only ones. A skill shipped in the plugin does
not count, which is why this one lives in the project.

Also emit `.claude/settings.json` from `templates/project-claude-settings.json`
when the project has none (`scripts/sync.sh --project` does the same copy). It
registers the `ai-workflows` marketplace, which gives teammates the one-time
plugin install prompt when they open the project, and adds the
sync-freshness and graphify hooks. An existing one is never overwritten: report
what a manual merge should add, per `docs/adopt-existing-project.md` in
ai-workflows.

Add `.playwright-mcp/` to the project's `.gitignore` when no line ignores it
yet (`scripts/sync.sh --project` appends it once). The Playwright MCP writes
screenshots, console logs and page snapshots there on every navigation and
refuses paths outside the project and that folder, so `verify` leaves its
screenshots there. An `--output-dir` on the `.mcp.json` entry is not the
answer: an existing `.mcp.json` is never rewritten, and a Playwright MCP added
at user scope never reads it, while the ignore line covers every setup.

### 9. Summary

Output a summary of what was created/synced:

```
Initialized <project-name> with ai-workflows:

  CONVENTIONS.md        [created/updated]  — project conventions (source of truth)
  AI-WORKFLOWS.md       [created/updated]  — developer guide for tool loading behavior
  CLAUDE.md             [created/updated]  — thin adapter (references CONVENTIONS.md)
  AGENTS.md             [created/updated]  — thin adapter (references CONVENTIONS.md)
  .github/copilot-instructions.md  [created/updated]  — Copilot adapter (CONVENTIONS.md + core rules inlined)
  rules/                [synced]           — shared baseline coding rules
  commands/             [synced]           — shared workflow runbooks
  .github/prompts/      [synced]           — Copilot prompt files generated from commands/
  .mcp.json             [created/skipped]  — project MCP servers (env-var-based, checked in)
  .claude/settings.json [created/skipped]  — marketplace prompt + project hooks
  .gitignore            [appended/ok]      — .playwright-mcp/ (browser MCP output)

  Stack: <detected stack>, <language>
  Deviations: <count> from global rules (<n> accepted, <n> migrating)
```

If deviations were detected, list them briefly with their status so the
developer is aware, plus any decision-log entry still missing from
`docs/architecture.md`.

## Constraints

- Do not modify existing source code.
- Do not install dependencies.
- Do not overwrite CONVENTIONS.md without asking first — it's project-owned.
- Do not touch `docs/project-brief.md`, `docs/project-spec.md`, or
  `docs/architecture.md` — they are owned by `skills/start-project/SKILL.md`.
- Do not duplicate an architecture decision into CONVENTIONS.md. Link to it.
- Tool adapters (CLAUDE.md, AGENTS.md, etc.) can be regenerated freely.
- Keep CONVENTIONS.md concise — under 80 lines.
- Never write a secret value into `.mcp.json` — env-var references (`${VAR}`)
  only.
