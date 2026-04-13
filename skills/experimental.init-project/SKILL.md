---
name: init-project
description: Initialize a project with AI workflow configuration — generates CONVENTIONS.md as the single source of project context, creates thin tool adapters (CLAUDE.md, AGENTS.md, Copilot, Cursor), adds a developer-facing AI-WORKFLOWS.md guide, and detects deviations from global rules. Use when the user asks to set up, initialize, or apply ai-workflows to a project.
---

# Init Project Skill

Use this skill when the user asks to apply ai-workflows rules, skills, and
commands to a project — or to initialize/set up a project for AI-assisted
development.

## Inputs

1. **Project path** — absolute path or relative to `~/Web/`. Ask if not provided.
2. **Project name** — inferred from the directory name if not given.

## Steps

### 1. Validate Target

1. Confirm the target directory exists.
2. Check for existing files and ask before overwriting:
   - `CONVENTIONS.md` — the main output; never overwrite silently
   - `CLAUDE.md`, `AGENTS.md` — will be regenerated as thin adapters
   - `.cursor/rules/conventions.mdc` — will be created/updated

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
- **Storybook**: present or not
- **Accessibility primitives**: react-aria-components, radix-ui, etc.
- **Available scripts**: from `package.json` scripts field
- **Notable dependencies**: animation libs, state management, CMS, etc.

### 3. Probe Project Structure

List top-level directories under `src/` (or project root if no `src/`).
Map them to Clean Architecture layers using the relevant stack rules table.
Record the mapping for use in CONVENTIONS.md.

### 4. Detect Deviations from Global Rules

Compare the detected project config against global rules in
`~/Web/ai-workflows/rules/` (or `~/.claude/rules/`). Flag deviations such as:

- Component libraries that differ from global rules
  (e.g., React Aria Components vs. the "no component libraries" rule)
- Dual test runners (e.g., Jest + Vitest) vs. global testing rules
- Scaffolding tools (e.g., Plop) that overlap with the scaffold-component skill
- Style approaches that differ from global Tailwind rules
- Any conventions in existing config files (prettier, eslint, tsconfig) that
  contradict global rules

For each deviation, determine whether it's intentional and document why.

### 5. Generate CONVENTIONS.md

Create `CONVENTIONS.md` at the project root. This is the **single source of
truth** for project-specific context. All tool adapters reference this file.

```markdown
# CONVENTIONS.md

## Project

<project-name> — <one-line description from package.json or README>

## Stack

- <detected stack with versions>
- <styling>
- <testing>
- <other notable deps>

## Structure

<mapped folder structure with CA layer annotations>

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | <description> |
| ... | ... |

## Conventions

- <project-specific conventions detected from config files>
- <scaffolding approach, component patterns, etc.>

## Deviations from Global Rules

- <each deviation with rationale>
- <omit this section if no deviations detected>

## Precedence

Rules in this file override global baseline rules from ai-workflows.
When conflicts arise, this file wins for project-specific decisions.
```

Guidelines:
- Only include sections that have meaningful content.
- Pull the description from `package.json` or the first paragraph of `README.md`.
- List only scripts that exist in `package.json`.
- Keep it under 80 lines — concise and scannable.

### 6. Generate Thin Adapters

Generate tool-specific adapter files that reference CONVENTIONS.md.
Use templates from `~/Web/ai-workflows/templates/`:

| File | Template | Strategy |
|------|----------|----------|
| `AI-WORKFLOWS.md` | `project-ai-workflows.md` | Reference guide — explains how each tool uses the synced files |
| `CLAUDE.md` | `project-CLAUDE.md` | Reference — "read CONVENTIONS.md" |
| `AGENTS.md` | `project-AGENTS.md` | Reference — "read CONVENTIONS.md" |
| `.github/copilot-instructions.md` | `project-copilot-instructions.md` | **Inline** — embed CONVENTIONS.md content plus condensed core rules (Copilot can't rely on file refs) |
| `.cursor/rules/conventions.mdc` | `project-cursor-conventions.mdc` | Reference — "read CONVENTIONS.md" |

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

### 8. Summary

Output a summary of what was created/synced:

```
Initialized <project-name> with ai-workflows:

  CONVENTIONS.md        [created/updated]  — project conventions (source of truth)
  AI-WORKFLOWS.md       [created/updated]  — developer guide for tool loading behavior
  CLAUDE.md             [created/updated]  — thin adapter (references CONVENTIONS.md)
  AGENTS.md             [created/updated]  — thin adapter (references CONVENTIONS.md)
  .github/copilot-instructions.md  [created/updated]  — Copilot adapter (CONVENTIONS.md + core rules inlined)
  .cursor/rules/conventions.mdc    [created/updated]  — Cursor adapter (references CONVENTIONS.md)
  rules/                [synced]           — shared baseline coding rules
  commands/             [synced]           — shared workflow runbooks
  .github/prompts/      [synced]           — Copilot prompt files generated from commands/

  Stack: <detected stack>
  Deviations: <count> from global rules
```

If deviations were detected, list them briefly so the developer is aware.

## Constraints

- Do not modify existing source code.
- Do not install dependencies.
- Do not overwrite CONVENTIONS.md without asking first — it's project-owned.
- Tool adapters (CLAUDE.md, AGENTS.md, etc.) can be regenerated freely.
- Keep CONVENTIONS.md concise — under 80 lines.
