# Feature Reference

Quick inventory of everything in this repo.

## Commands

Operational runbooks in `commands/`. Triggered by natural language intent.

| Command | File | What it does | Trigger phrases |
|---------|------|--------------|-----------------|
| Commit Message | `commands/commit-message.md` | Generate a conventional commit message from staged diff | `commit message`, `write commit`, `git commit` |
| Scaffold Component | `commands/scaffold-component.md` | Create a new React component with correct file structure and conventions | `new component`, `scaffold`, `create component` |
| Create PR | `commands/create-pr.md` | Push branch and create a GitHub PR or GitLab MR with structured description | `create pr`, `open pr`, `submit pr` |
| Code Review | `commands/review-code.md` | Review code changes against remote base branch | `review code`, `code review`, `review changes` |
| Run Checks | `commands/run-checks.md` | Run lint, type-check, stylelint, test, build in sequence | `run checks`, `run-checks`, `quality checks` |
| Safe Kill Port | `commands/safe-kill-port.md` | Stop a process on a port safely (default: 3000) | `kill port`, `port 3000`, `eaddrinuse` |
| New Device Setup | `commands/new-device-setup.md` | Bootstrap AI workflows on a new machine | `new device`, `setup device`, `onboarding` |

## Skills

Self-describing workflows in `skills/`. Each has a `SKILL.md` with frontmatter metadata. Skills are the primary dispatch for Cursor and Codex; commands serve as fallback for non-skill-aware tools.

| Skill | Description | Has matching command? |
|-------|-------------|----------------------|
| `commit-message` | Generate a conventional commit message from staged or unstaged diff | Yes |
| `scaffold-component` | Create a new React component with correct file structure, templates, and project conventions | Yes |
| `create-pr` | Push branch and create a GitHub PR or GitLab MR with structured description from branch diff | Yes |
| `code-review` | Review current branch changes against remote base branch with severity-ordered findings and actionable fixes | Yes |
| `run-checks` | Run project quality checks sequentially, stop on failures for user decision, summarize results | Yes |
| `architecture-review` | Review codebase for clean architecture violations — probes folder structure, maps to CA layers, checks principles | No (skill only) |

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
| `rules/tailwind.md` | Tailwind 4 tokens, `@theme`, design system mapping |
| `rules/testing.md` | Testing strategy, query priority, coverage expectations |
| `rules/accessibility.md` | Semantic HTML, ARIA, keyboard nav, color contrast |
| `rules/clean-architecture.md` | Layer boundaries, dependency direction, CA principles |

### Stack-Specific Rules

| File | Stack |
|------|-------|
| `rules/stacks/nextjs-payload.md` | Next.js + Payload CMS conventions |
| `rules/stacks/react-native-expo.md` | React Native + Expo conventions |

## Adapter Coverage

Shows which tools consume which sources.

| Tool | Commands | Skills | Rules | MCP |
|------|----------|--------|-------|-----|
| **Cursor** | via `AGENTS.md` | direct (`skills/`) | via user rules | via `mcp/servers.json` |
| **Codex** | via `AGENTS.md` | direct (`skills/`) | via `AGENTS.md` | — |
| **Claude CLI** | via `CLAUDE.md` | — | via `CLAUDE.md` | — |
| **GitHub Copilot** | via `.github/prompts/*.prompt.md` | direct (`skills/` via settings) | via `.github/copilot-instructions.md` | via `.vscode/mcp.json` |
| **Roo** | via sync to `~/.roo/` | — | via sync to `~/.roo/` | — |
