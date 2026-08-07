# Feature Reference

Quick inventory of everything in this repo.

## Project Model

Synced projects follow one model (see [docs/how-it-works.md](docs/how-it-works.md)
for the full loading table):

- `CONVENTIONS.md` is the project-owned single source of project context.
- `AI-WORKFLOWS.md` is the developer guide explaining how the synced files
  work together, including the `Shared Workflow Assets` section.
- Thin adapters (`CLAUDE.md`, `AGENTS.md`, `.cursor/rules/conventions.mdc`)
  route each tool to those sources; the Copilot adapter inlines
  `CONVENTIONS.md` because Copilot cannot follow references.
- `.github/prompts/*.prompt.md` files are generated from `commands/` for
  Copilot prompt dispatch.
- The global Claude sync intentionally ships only the slim universal rule set
  (`communication.md`, `project.md`, `clean-architecture.md`); everything else
  loads per project or via skills.

## Commands

Operational runbooks in `commands/`. Triggered by natural language intent.
Commands are compatibility adapters and fallback workflows when a tool cannot
rely on skills directly.

| Command | File | What it does | Trigger phrases |
|---------|------|--------------|-----------------|
| Commit Message | `commands/commit-message.md` | Generate a conventional commit message from staged diff | `commit message`, `write commit`, `git commit` |
| Create PR | `commands/create-pr.md` | Push branch and create a GitHub PR or GitLab MR with structured description | `create pr`, `open pr`, `submit pr` |
| Backlog | `commands/backlog.md` | Draft or update a backlog item in `docs/backlog/` following the backlog rules | `backlog item`, `user story`, `feature spec`, `bug item`, `bli` |
| Scaffold Component | `commands/scaffold-component.md` | Create a new React component with correct file structure and conventions | `new component`, `scaffold`, `create component` |
| Code Review | `commands/review-code.md` | Review code changes against remote base branch | `review code`, `code review`, `review changes` |
| Set Up AI Workflows | `commands/setup-ai-workflows.md` | Apply ai-workflows to a project and generate thin adapters plus developer guide | `apply ai-workflows`, `setup ai-workflows`, `generate conventions`, `refresh project config` |
| Run Checks | `commands/run-checks.md` | Run lint, type-check, stylelint, test, build in sequence | `run checks`, `run-checks`, `quality checks` |
| Refinement | `commands/refinement.md` | Prepare or record a backlog refinement grounded in tracker tickets and the codebase | `refinement`, `refine tickets` |
| Sprint Planning | `commands/sprint-planning.md` | Plan the upcoming sprint from tracker tickets, spillover, dependencies, and capacity | `sprint planning`, `plan sprint`, `start sprint` |
| Sprint Demo | `commands/sprint-demo.md` | Prepare a stakeholder-ready sprint demo runsheet and slide deck | `sprint demo`, `demo voorbereiden`, `prepare demo` |
| Close Sprint | `commands/close-sprint.md` | Close out a sprint with a changelog, gaps/spillover doc, and sprint folder | `close sprint`, `sluit sprint af` |
| Compact Sprint | `commands/compact-sprint.md` | Compact an old sprint: flag durable BLI decisions, rewrite the changelog to the compact template, remove the sprint folder behind a git tag | `compact sprint`, `sprint compacten` |
| Sustainable Review | `commands/sustainable-review.md` | Audit a change or area for Sustainable IT and produce backlog-ready findings | `sustainable review`, `performance audit`, `green refactor` |
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
| `start-project` | Single kickoff entry, six lanes: repository (GitLab template method, PoC waiver), config, resources, intent (brief/spec/architecture), journeys, first sliced plan | No (skill only) |
| `setup-ai-workflows` | Set up or refresh a project's AI-workflow config: CONVENTIONS.md, thin adapters, type-safety deviation detection | Yes |
| `upstream-rules` | Propose rule changes back to the ai-workflows repo | No (skill only) |
| `improve-skill` | Fold durable session learnings back into workflow sources; decide whether a recurring pattern deserves a new skill, an update, or a lighter surface | No (skill only) |
| `backlog` | Draft or update a backlog item in `docs/backlog/` following the backlog rules and codebase context | Yes |
| `work-backlog` | Deliver the next eligible backlog item with a WIP limit of one | Yes |
| `refinement` | Prepare and record a backlog refinement grounded in tracker tickets and the codebase | Yes |
| `sprint-planning` | Plan the upcoming sprint from tracker tickets, spillover, dependencies, and capacity | Yes |
| `sprint-demo` | Prepare a stakeholder-ready sprint demo runsheet and Marp slide deck | Yes |
| `close-sprint` | Close out a sprint with a changelog, gaps/spillover doc, and sprint folder | Yes |
| `compact-sprint` | Compact an old sprint: flag durable decisions as todo follow-ups, rewrite the changelog to the compact template, remove the sprint folder behind a git-tag archive | Yes |
| `jira-ticket` | Create a Jira bug, story, or task from a type-specific template, grounded in the codebase | No (skill only) |
| `address-review-comments` | Pick up reviewer comments on a PR/MR, propose an approach per comment, apply, and push | No (skill only) |
| `receiving-code-review` | Evaluate incoming review feedback with technical rigor before implementing any of it | No (skill only) |
| `watch-mrs` | Watch open GitLab MRs for reviewer comments and merge-readiness, optionally auto-merging | No (skill only) |
| `test-driven-development` | Drive a feature or bugfix test-first through a strict RED-GREEN-REFACTOR cycle | No (skill only) |
| `migration-check` | Statically verify a freshly generated Payload/Postgres migration for snapshot-drift bugs | No (skill only) |
| `datocms-migration` | Drive a DatoCMS schema change via a sandbox fork, autogenerate the migration, and review it before it ships | No (skill only) |
| `sustainable-review` | Audit a change or area for Sustainable IT and produce backlog-ready findings | Yes |
| `wcag-audit` | WCAG 2 compliance audit combining static code review with an axe-core/Playwright scan of the live site | No (skill only) |
| `npm-maintenance` | Inspect and update Node.js dependencies, npm audit remediation, and major-version migrations | No (skill only) |
| `maintenance` | Periodic project maintenance sweep — deps, runtime EOL, credential/API-key currency (incl. Prepr tokens), quality baseline, CI, data, doc drift | No (skill only) |
| `upstream-to-unicore` | Upstream a reusable change from a synced project into the unicore-template repo via a GitLab MR | No (skill only) |
| `mr-merged` | Post-merge closeout: board to done, "How to test this" comment for the PO (posted after approval), proposed ticket transition, branch/worktree cleanup | No (skill only) |
| `user-journeys` | Spec each user journey into `docs/journeys/` — walked path, branches, states, permissions, keyboard route, and the slice candidates the backlog is cut from | No (skill only) |

## Integration Tooling

CLI-first for scriptable/headless work; MCP for browser control, design
context, and OAuth SaaS. The doctrine, the machine-level CLI table (`glab`,
`jira`, `dotenvx`), and the per-project `.mcp.json` convention live in
`docs/tooling.md`; the `setup-ai-workflows` skill emits the per-project config and
`commands/new-device-setup.md` installs the machine baseline.

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
| `rules/mr-sizing.md` | MR size budget, sliceability test, split triggers, one ticket to many items |
| `rules/git-flow.md` | Branch and MR flow, the squash + fast-forward merge baseline, MR title as commit message, `ai:agent-authored` provenance label |
| `rules/content-blocks.md` | CMS-backed block architecture, transforms, registry, stories, and tests |
| `rules/payload.md` | Payload schemas, generated types, hooks, and integration boundaries |
| `rules/sustainability.md` | Sustainable IT: caching/rendering, LCP/assets, bundle and client JS, CI cost, dependencies |
| `rules/sonarqube.md` | Opt-in SonarQube/SonarLint rule parity: avoid flagged patterns, apply preferred fixes |
| `rules/documentation.md` | Comments, JSDoc, and docs describing changed behaviour update in the same MR |
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
