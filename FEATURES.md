# Feature Reference

Quick inventory of everything in this repo.

## Packages

Optional reusable presets live in `packages/`. These are intended as
copyable/composable bundles for shared Greenberry conventions across projects,
while project-specific exceptions remain in `CONVENTIONS.md`.

| Package | Path | Purpose |
|---------|------|---------|
| Greenberry Base | `packages/greenberry-base/` | Shared default baseline for Greenberry projects |
| Frontend | `packages/frontend/` | Shared frontend-oriented conventions and assets |
| Next.js | `packages/nextjs/` | Next.js-specific package layer |
| Payload | `packages/payload/` | Payload CMS-specific package layer |
| Accessibility | `packages/accessibility/` | Accessibility-focused add-on package |
| Testing | `packages/testing/` | Testing-focused add-on package |

Package manifests live in `packages/*/package.yaml`, and composition guidance
lives in `packages/selection.md`.

## Commands

Operational runbooks in `commands/`. Triggered by natural language intent.
Commands are compatibility adapters and fallback workflows when a tool cannot
rely on skills directly.

| Command | File | What it does | Trigger phrases |
|---------|------|--------------|-----------------|
| Commit Message | `commands/commit-message.md` | Generate a conventional commit message from staged diff | `commit message`, `write commit`, `git commit` |
| Create PR | `commands/create-pr.md` | Push branch and create a GitHub PR or GitLab MR with structured description | `create pr`, `open pr`, `submit pr` |
| Scaffold Component | `commands/scaffold-component.md` | Create a new React component with correct file structure and conventions | `new component`, `scaffold`, `create component` |
| Code Review | `commands/review-code.md` | Review code changes against remote base branch | `review code`, `code review`, `review changes` |
| Init Project | `commands/init-project.md` | Apply ai-workflows to a project and generate thin adapters plus developer guide | `init project`, `setup project`, `apply ai-workflows`, `initialize project` |
| Run Checks | `commands/run-checks.md` | Run lint, type-check, stylelint, test, build in sequence | `run checks`, `run-checks`, `quality checks` |
| Safe Kill Port | `commands/safe-kill-port.md` | Stop a process on a port safely (default: 3000) | `kill port`, `port 3000`, `eaddrinuse` |
| New Device Setup | `commands/new-device-setup.md` | Bootstrap AI workflows on a new machine | `new device`, `setup device`, `onboarding` |
| Work Backlog | `commands/work-backlog.md` | Deliver one eligible backlog item end-to-end | `work backlog`, `next backlog item`, `autonomous delivery` |

## Skills

Self-describing workflows in `skills/`. Each has a `SKILL.md` with frontmatter
metadata. Skills are the canonical workflow surface on skill-aware tools.
Commands remain the compatibility and fallback surface. On Claude Code the
skills ship via the `greenberry` plugin (`.claude-plugin/`), invoked as
`/greenberry:<skill>`.

| Skill | Description | Has matching command? |
|-------|-------------|----------------------|
| `commit-message` | Generate a conventional commit message from staged or unstaged diff | Yes |
| `create-pr` | Push branch and create a GitHub PR or GitLab MR with structured description from branch diff | Yes |
| `scaffold-component` | Create a new React component with correct file structure, templates, and project conventions | Yes |
| `code-review` | Review current branch changes against remote base branch with severity-ordered findings, explicit type-safety audit, and actionable fixes | Yes |
| `run-checks` | Run project quality checks sequentially, stop on failures for user decision, summarize results | Yes |
| `architecture-review` | Review codebase for clean architecture violations — probes folder structure, maps to CA layers, checks principles | No (skill only) |
| `component-spec` | Generate component specification from design or requirements | No (skill only) |
| `init-project` | Initialize a new project with ai-workflows setup, thin adapters, and type-safety deviation detection | Yes |
| `upstream-rules` | Propose rule changes back to the ai-workflows repo | No (skill only) |
| `improve-skill` | Fold durable session learnings back into workflow sources | No (skill only) |
| `work-backlog` | Deliver the next eligible backlog item with a WIP limit of one | Yes |
| `maintenance` | Periodic project maintenance sweep — deps, runtime EOL, credential/API-key currency (incl. Prepr tokens), quality baseline, CI, data, doc drift | No (skill only) |

## MCP Servers

Defined in `mcp/servers.json`. Secrets use environment variables.

| Server | Package | Purpose |
|--------|---------|---------|
| `github` | `@modelcontextprotocol/server-github` | GitHub API access (issues, PRs, repos) |
| `filesystem` | `@modelcontextprotocol/server-filesystem` | Local filesystem read/write via MCP |
| `context7` | `@upstash/context7-mcp` | Up-to-date library documentation and code examples |

## Rules

Baseline rules in `rules/`. Loaded contextually — not all apply at once.

| File | Covers |
|------|--------|
| `rules/rules.md` | Index — lists all rule files and when to load them |
| `rules/communication.md` | Tone, formatting, response style |
| `rules/project.md` | File structure, naming, imports, component architecture |
| `rules/type-safety.md` | Trust boundaries, strict TypeScript posture, lint guardrails, review checklist |
| `rules/tailwind.md` | Tailwind 4 tokens, `@theme`, design system mapping |
| `rules/testing.md` | Testing strategy, query priority, coverage expectations |
| `rules/accessibility.md` | Semantic HTML, ARIA, keyboard nav, color contrast |
| `rules/backlog.md` | User stories, specs, backlog item structure |
| `rules/content-blocks.md` | CMS-backed block architecture, transforms, registry, stories, and tests |
| `rules/payload.md` | Payload schemas, generated types, hooks, and integration boundaries |
| `rules/clean-architecture.md` | Layer boundaries, dependency direction, CA principles |

### Stack-Specific Rules

| File | Stack |
|------|-------|
| `rules/stacks/nextjs-payload.md` | Next.js + Payload CMS conventions |
| `rules/stacks/react-native-expo.md` | React Native + Expo conventions |

## Generated Artifacts

These files are generated or derived from the canonical repo sources:

- `AGENTS.md`
- `CLAUDE.md`
- `.github/copilot-instructions.md`
- `.github/prompts/*.prompt.md`
- `.vscode/tasks.json`

`.vscode/tasks.json` is kept as a generated convenience surface, not as a
primary project-model artifact.

## Tool Support Matrix

Shows the intended support model for the main workflow surfaces.

| Tool | Always-on entry point | Preferred workflow surface |
|------|------------------------|----------------------------|
| **GitHub Copilot** | `.github/copilot-instructions.md` | commands/runbooks |
| **Cursor** | `AGENTS.md` plus `.cursor/rules/*.md` | skills first, commands as fallback |
| **Codex** | `AGENTS.md` | skills first, commands as fallback |
| **Claude Code** | `CLAUDE.md` plus global/project rules | skills first (via the `greenberry` plugin), commands as fallback |
