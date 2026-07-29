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

<!-- BEGIN SHARED:command-mappings -->
- `create pr`, `open pr`, `submit pr` -> `commands/create-pr.md`
- `commit message`, `write commit`, `git commit` -> `commands/commit-message.md`
- `backlog item`, `user story`, `feature spec`, `bug item`, `bli` -> `commands/backlog.md`
- `close sprint`, `sluit sprint af`, `sprint afsluiten` -> `commands/close-sprint.md`
- `refinement`, `prepare refinement`, `refine tickets`, `refinement vastleggen` -> `commands/refinement.md`
- `sprint demo`, `demo voorbereiden`, `demo script`, `prepare demo` -> `commands/sprint-demo.md`
- `sprint planning`, `plan sprint`, `sprint start`, `start sprint`, `plan komende sprint` -> `commands/sprint-planning.md`
- `sustainable review`, `sustainability review`, `performance review`, `performance audit`, `green refactor`, `ci review`, `dependency review` -> `commands/sustainable-review.md`
- `run checks`, `run-checks`, `quality checks` -> `commands/run-checks.md`
- `review code`, `code review`, `review changes` -> `commands/review-code.md`
- `kill port`, `port 3000`, `eaddrinuse` -> `commands/safe-kill-port.md`
- `new component`, `scaffold`, `create component` -> `commands/scaffold-component.md`
- `new device`, `setup device`, `onboarding` -> `commands/new-device-setup.md`
- `init project`, `setup project`, `apply ai-workflows`, `initialize project` -> `commands/init-project.md`
- `work backlog`, `work the backlog`, `next backlog item`, `autonomous delivery` -> `commands/work-backlog.md`
<!-- END SHARED:command-mappings -->

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

<!-- BEGIN SHARED:skill-mappings -->
Skills are the canonical surface. A command is listed only where one exists as
fallback for tools that cannot use skills. Alphabetical, so a missing entry is
easy to spot.

Line format: triggers `->` the routing targets, then an optional note after a
`;`. Only paths before the `;` count as routes — a skill named in a note is a
cross-reference, so it still needs its own line.

- `address review comments`, `pick up review comments`, `apply review feedback`, `pak review comments op` -> `skills/address-review-comments` (skill only; evaluate the feedback with `skills/receiving-code-review` first)
- `review architecture`, `check clean arch`, `architecture audit`, `layer violation` -> `skills/architecture-review` (skill only)
- `backlog item`, `user story`, `feature spec`, `bug item`, `bli` -> `skills/backlog` (canonical), `commands/backlog.md` (fallback); for a tracker ticket use `skills/jira-ticket`
- `close sprint`, `sluit sprint af`, `sprint afsluiten` -> `skills/close-sprint` (canonical), `commands/close-sprint.md` (fallback)
- `review code`, `code review`, `review changes` -> `skills/code-review` (canonical), `commands/review-code.md` (fallback)
- `commit message`, `write commit`, `git commit` -> `skills/commit-message` (canonical), `commands/commit-message.md` (fallback)
- `component spec`, `spec component`, `write spec`, `document component api` -> `skills/component-spec` (skill only)
- `create pr`, `open pr`, `submit pr` -> `skills/create-pr` (canonical), `commands/create-pr.md` (fallback)
- `improve skill`, `take learnings`, `verbeter je skill` -> `skills/improve-skill` (skill only)
- `init project`, `setup project`, `apply ai-workflows`, `initialize project` -> `skills/init-project` (canonical), `commands/init-project.md` (fallback)
- `jira ticket`, `maak een jira ticket`, `file a bug`, `meld een bug`, `create a story`, `create a task` -> `skills/jira-ticket` (skill only; writes to the tracker, so it confirms before creating)
- `maintenance`, `project maintenance`, `onderhoud`, `maintenance sweep`, `monthly check`, `health check`, `api key check` -> `skills/maintenance` (skill only; delegates the dependency lane to `skills/npm-maintenance`)
- `migration check`, `check migration`, `verify migration`, `migration already exists` -> `skills/migration-check` (skill only)
- `mr merged`, `post-merge`, `afgerond na merge`, `close out merged MR` -> `skills/mr-merged` (skill only; also the hand-off target when `skills/watch-mrs` reports a merge)
- `npm maintenance`, `update dependencies`, `npm audit`, `fix vulnerabilities`, `npm outdated` -> `skills/npm-maintenance` (skill only)
- `review feedback`, `respond to review`, `reviewer comments`, `beoordeel review`, `reageer op review` -> `skills/receiving-code-review` (skill only; hand off to `skills/address-review-comments` to apply)
- `refinement`, `prepare refinement`, `refine tickets`, `refinement vastleggen` -> `skills/refinement` (canonical), `commands/refinement.md` (fallback)
- `run checks`, `run-checks`, `quality checks` -> `skills/run-checks` (canonical), `commands/run-checks.md` (fallback)
- `new component`, `scaffold`, `create component` -> `skills/scaffold-component` (canonical), `commands/scaffold-component.md` (fallback)
- `skill opportunity`, `learn from sessions`, `spot workflow patterns`, `should this be a skill` -> `skills/skill-opportunity` (skill only)
- `sprint board`, `waar ben ik mee bezig`, `update board`, `werkbord` -> `skills/sprint-board` (skill only; every workflow that changes an item's status updates it)
- `sprint demo`, `demo voorbereiden`, `demo script`, `prepare demo` -> `skills/sprint-demo` (canonical), `commands/sprint-demo.md` (fallback)
- `sprint planning`, `plan sprint`, `sprint start`, `start sprint`, `plan komende sprint` -> `skills/sprint-planning` (canonical), `commands/sprint-planning.md` (fallback)
- `start project`, `new project`, `project kickoff`, `project brief`, `project spec`, `nieuw project`, `project opzetten` -> `skills/start-project` (skill only; writes the brief/spec/architecture, then hands over to `skills/init-project`)
- `sustainable review`, `sustainability review`, `performance audit`, `green refactor`, `ci review`, `dependency review` -> `skills/sustainable-review` (canonical), `commands/sustainable-review.md` (fallback)
- `tdd`, `test-driven development`, `test first`, `test eerst`, `schrijf eerst een test` -> `skills/test-driven-development` (skill only)
- `upstream rule`, `propose rule`, `share rule change` -> `skills/upstream-rules` (skill only)
- `upstream to unicore`, `port to unicore`, `upstream to template`, `unicore-template` -> `skills/upstream-to-unicore` (skill only)
- `user journeys`, `spec the journeys`, `user flows`, `customer journey`, `journeys uitwerken` -> `skills/user-journeys` (skill only; writes `docs/journeys/`, then hands the slice candidates to `skills/backlog`)
- `watch mr`, `monitor mr`, `notify on approval`, `auto-merge when ready` -> `skills/watch-mrs` (skill only)
- `wcag audit`, `accessibility audit`, `wcag compliance audit`, `a11y audit` -> `skills/wcag-audit` (skill only)
- `work backlog`, `work the backlog`, `next backlog item`, `autonomous delivery` -> `skills/work-backlog` (canonical), `commands/work-backlog.md` (fallback)
<!-- END SHARED:skill-mappings -->

### Graphify

<!-- BEGIN SHARED:graphify -->
This project may ship a **graphify** knowledge graph under `graphify-out/`
(god nodes, community structure, and cross-file relationships). The graph data
is gitignored, so each developer builds their own with `graphify update .`.

When `graphify-out/graph.json` exists, prefer the graph over raw file browsing
for codebase and architecture questions:

- `graphify query "<question>"` — scoped subgraph for any codebase or architecture question
- `graphify path "<A>" "<B>"` — dependency path between two symbols
- `graphify explain "<concept>"` — all nodes related to a concept

These return a scoped subgraph, usually much smaller than raw grep output or `GRAPH_REPORT.md`.

- If `graphify-out/wiki/index.md` exists, navigate it instead of reading raw files.
- Read `graphify-out/GRAPH_REPORT.md` only for broad architecture review when query/path/explain do not surface enough context.
- Use direct Read/Grep/Glob once graphify has oriented you and you need to modify or debug specific lines, or when `graphify-out/graph.json` does not exist yet.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
<!-- END SHARED:graphify -->

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
