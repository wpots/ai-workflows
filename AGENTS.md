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
| adapters (`AGENTS.md`, `CLAUDE.md`, Copilot instructions) | always-on routing, precedence, and local usage guidance |

## Tool Support Matrix

| Tool | Always-on entry point | Preferred workflow surface |
| ---- | --------------------- | -------------------------- |
| GitHub Copilot | `.github/copilot-instructions.md` | commands/runbooks |
| Cursor | not supported; sync generates nothing for it | — |
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
- `close sprint`, `sluit sprint af`, `sprint afsluiten`, `close support month`, `support maand afsluiten` -> `commands/close-sprint.md`
- `compact sprint`, `compact old sprints`, `sprint compacten`, `oude sprints opruimen`, `compact support months` -> `commands/compact-sprint.md`
- `refinement`, `prepare refinement`, `refine tickets`, `refinement vastleggen` -> `commands/refinement.md`
- `sprint demo`, `demo voorbereiden`, `demo script`, `prepare demo` -> `commands/sprint-demo.md`
- `release notes`, `releasenotes`, `release notes voor de klant`, `wat is er live` -> `commands/release-notes.md`
- `sprint planning`, `plan sprint`, `sprint start`, `start sprint`, `plan komende sprint` -> `commands/sprint-planning.md`
- `sustainable review`, `sustainability review`, `performance review`, `performance audit`, `green refactor`, `ci review`, `dependency review` -> `commands/sustainable-review.md`
- `run checks`, `run-checks`, `quality checks` -> `commands/run-checks.md`
- `review code`, `code review`, `review changes` -> `commands/review-code.md`
- `kill port`, `port 3000`, `eaddrinuse` -> `commands/safe-kill-port.md`
- `new component`, `scaffold`, `create component` -> `commands/scaffold-component.md`
- `new device`, `setup device`, `onboarding` -> `commands/new-device-setup.md`
- `apply ai-workflows`, `setup ai-workflows`, `generate conventions`, `refresh project config` -> `commands/setup-ai-workflows.md`
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
- `close sprint`, `sluit sprint af`, `sprint afsluiten`, `close support month`, `support maand afsluiten` -> `skills/close-sprint` (canonical), `commands/close-sprint.md` (fallback); projects without sprints close a calendar month (support mode, `docs/support-<yyyy>-<mm>/`)
- `review code`, `code review`, `review changes` -> `skills/code-review` (canonical), `commands/review-code.md` (fallback)
- `compact sprint`, `compact old sprints`, `sprint compacten`, `oude sprints opruimen`, `prune sprint docs`, `compact support months` -> `skills/compact-sprint` (canonical), `commands/compact-sprint.md` (fallback); runs after `skills/close-sprint`, only on a sprint whose close is pushed (the last-closed one after the next planning; in support mode never the current or previous month)
- `datocms migration`, `cms migration`, `fork cms environment`, `change the cms schema` -> `skills/datocms-migration` (skill only; the DatoCMS counterpart to `skills/migration-check`, which covers Payload/Postgres)
- `dependency hotfix`, `critical hotfix`, `security hotfix`, `pak de critical op`, `scanner critical`, `critical uit de dependency scanner` -> `skills/dependency-hotfix` (skill only; criticals on production only — highs and lower go to `skills/npm-maintenance` on development)
- `commit message`, `write commit`, `git commit` -> `skills/commit-message` (canonical), `commands/commit-message.md` (fallback)
- `component spec`, `spec component`, `write spec`, `document component api` -> `skills/component-spec` (skill only)
- `create pr`, `open pr`, `submit pr` -> `skills/create-pr` (canonical), `commands/create-pr.md` (fallback)
- `greenberry maintenance`, `portfolio maintenance`, `portfolio-maintenance-report`, `greenberry onderhoud`, `herhaal onderhoudsinventaris`, `CI-adoptie en scannerdekking` -> `skills/greenberry-maintenance` (skill only; read-only portfolio inventory across GitLab, Notion and dependency reporting; project fixes stay in their own workflows)
- `improve skill`, `take learnings`, `verbeter je skill`, `skill opportunity`, `learn from sessions`, `spot workflow patterns`, `should this be a skill` -> `skills/improve-skill` (skill only; also decides whether a recurring pattern deserves a new skill, an update, or a lighter surface)
- `jira ticket`, `maak een jira ticket`, `file a bug`, `meld een bug`, `create a story`, `create a task` -> `skills/jira-ticket` (skill only; writes to the tracker, so it confirms before creating)
- `maintenance`, `project maintenance`, `onderhoud`, `maintenance sweep`, `monthly check`, `health check`, `api key check` -> `skills/maintenance` (skill only; delegates the dependency lane to `skills/npm-maintenance`)
- `migration check`, `check migration`, `verify migration`, `migration already exists` -> `skills/migration-check` (skill only)
- `mr merged`, `post-merge`, `afgerond na merge`, `close out merged MR` -> `skills/mr-merged` (skill only; also the hand-off target when `skills/watch-mrs` reports a merge)
- `npm maintenance`, `update dependencies`, `npm audit`, `fix vulnerabilities`, `npm outdated` -> `skills/npm-maintenance` (skill only)
- `payload jobs`, `jobs queue`, `scheduled jobs`, `nightly job`, `cronjob`, `autoRun`, `job runner`, `jobs draaien dubbel`, `job draait niet`, `INSTANCE_NUMBER` -> `skills/payload-jobs` (skill only; the deep audit behind lane F of `skills/maintenance`; policy lives in `rules/payload.md` § Jobs Queue)
- `review feedback`, `respond to review`, `reviewer comments`, `beoordeel review`, `reageer op review` -> `skills/receiving-code-review` (skill only; hand off to `skills/address-review-comments` to apply)
- `refinement`, `prepare refinement`, `refine tickets`, `refinement vastleggen` -> `skills/refinement` (canonical), `commands/refinement.md` (fallback)
- `release`, `start release`, `release starten`, `naar productie`, `release afronden`, `promote to production`, `versie op de tickets`, `tickets van de release naar done` -> `skills/release` (skill only; runs around the project's own release runbook — start and live mail drafts, Slack, tracker version and status read-back (a transition only on the user's go), housekeeping; hands the notes to `skills/release-notes`)
- `release notes`, `releasenotes`, `release notes voor de klant`, `klantupdate`, `wat is er live` -> `skills/release-notes` (canonical), `commands/release-notes.md` (fallback); the customer-facing half of a release — `skills/close-sprint` writes the internal changelog, and both it and `skills/sprint-demo` hand off here after their review pause
- `run checks`, `run-checks`, `quality checks` -> `skills/run-checks` (canonical), `commands/run-checks.md` (fallback)
- `new component`, `scaffold`, `create component` -> `skills/scaffold-component` (canonical), `commands/scaffold-component.md` (fallback)
- `service cli`, `jira cli`, `glab`, `axiom query`, `via de cli`, `cli first` -> `skills/service-cli` (skill only; the recipes behind the CLI-first rule in `docs/tooling.md` — the tracker-reading skills and `skills/jira-ticket` route Jira through it, and the plugin's PreToolUse hook sends a denied connector call here)
- `apply ai-workflows`, `setup ai-workflows`, `generate conventions`, `refresh project config` -> `skills/setup-ai-workflows` (canonical), `commands/setup-ai-workflows.md` (fallback); the config lane only — a whole new project starts with `skills/start-project`
- `sprint demo`, `demo voorbereiden`, `demo script`, `prepare demo` -> `skills/sprint-demo` (canonical), `commands/sprint-demo.md` (fallback)
- `sprint planning`, `plan sprint`, `sprint start`, `start sprint`, `plan komende sprint` -> `skills/sprint-planning` (canonical), `commands/sprint-planning.md` (fallback)
- `start project`, `new project`, `init project`, `setup project`, `initialize project`, `project kickoff`, `project brief`, `project spec`, `nieuw project`, `project opzetten` -> `skills/start-project` (skill only; the single kickoff entry — it runs `skills/setup-ai-workflows`, writes brief/spec/architecture, and hands the journeys to `skills/user-journeys`)
- `sustainable review`, `sustainability review`, `performance review`, `performance audit`, `green refactor`, `ci review`, `dependency review` -> `skills/sustainable-review` (canonical), `commands/sustainable-review.md` (fallback)
- `tdd`, `test-driven development`, `test first`, `test eerst`, `schrijf eerst een test` -> `skills/test-driven-development` (skill only)
- `upstream rule`, `propose rule`, `share rule change` -> `skills/upstream-rules` (skill only)
- `upstream to unicore`, `port to unicore`, `upstream to template`, `unicore-template`, `template harvest`, `wat moet terug naar de template` -> `skills/upstream-to-unicore` (skill only; the target line, v3 `development` or v4 presets, is chosen per change, and `skills/mr-merged` and `skills/close-sprint` propose its harvest when template-owned files change)
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

### Integration Tooling

The CLI-vs-MCP doctrine lives in `docs/tooling.md`; the per-service recipes
in `skills/service-cli`.

- Before browser verification, read `rules/testing.md` for the choice
  between an interactive browser check and reusable automated tests.
- CLI first: GitLab through `glab`, Jira through `jira`, Axiom through
  `axiom`. A connector tool only for what the CLI cannot reach (Confluence
  and the Teamwork Graph; Axiom monitors and dashboards).
- Machine-level CLIs (`glab`, `jira`, `axiom`, `dotenvx`) install once per
  developer via `commands/new-device-setup.md`.
- Project-level MCP servers are per project: a checked-in, env-var-based
  `.mcp.json`, emitted by `setup-ai-workflows`.
- Prefer environment variables for secrets — never literal values in config.

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
- `ai-workflows` is the **only** repo whose reviewer is named in the rules:
  request review from the maintainer, `wieteke.pots`, on an `ai-workflows` MR —
  `glab mr create … --reviewer wieteke.pots`, or on an MR that already exists
  `glab mr update <iid> -R greenberrynl/config/ai-workflows --reviewer wieteke.pots`.
  Everywhere else — `unicore-template`, client projects, anything — open the MR
  with **no `--reviewer` flag** and let the human assign one. Never infer a
  reviewer from CODEOWNERS, repo members, or git history, and never assign the
  MR author; only pass `--reviewer` when the user named that person.
- Before the MR opens, a branch that adds a skill, changes a skill's `name`,
  `description` or `when_to_use`, or changes a routing case runs the routing
  evals first: "Before a skill MR" in `evals/README.md` of the `ai-workflows`
  checkout has the trigger test, the command and the result line for the MR
  description. Other repos have no routing cases, so this does nothing there.
- Pass **both** `-R <canonical-repo>` and `-H <canonical-repo>` to
  `glab mr create`, and `-R` to every follow-up `glab mr update`/`view`. `-R`
  sets only the target; the head (source) project and the MR lookup still
  default to the **current directory's** git remote. Run these from the
  originating project — normal, and unavoidable for an agent that may not `cd`
  — and MR creation fails with
  `422 [Source project is not a fork of the target project]`.
- `glab mr create` cannot carry a real MR body: there is no
  `--description-file`, `-d` takes a string, and `-d -` opens an editor. For any
  body with backticks or tables, POST to `…/merge_requests` with
  `--input <file>` and `-H "Content-Type: application/json"`, then attach the
  reviewer in a second call with `glab mr update`. Never pass the reviewer as
  `--field "reviewer_ids[]=<id>"` — the bracket goes over as a literal JSON key
  and the MR opens with no reviewer.
- GitLab **accepts** a review request from the MR author, so `wieteke.pots`
  reviewing their own `ai-workflows` MR is expected, not a conflict with the
  never-assign-the-author line above — that line governs repos where a reviewer
  would be a guess.
- When the MR changes what the `greenberry` plugin ships or how it behaves —
  `skills/`, `commands/`, `.claude-plugin/`, `hooks/`, a script a hook runs, or
  the ambient layer (`CLAUDE.md`, `rules/communication.md`,
  `rules/project.md`, `rules/clean-architecture.md`) — describe it in a
  changelog fragment `changelog.d/<added|changed|fixed|…>.<slug>.md` (its
  `- ` bullets, as they will read under the `### <Section>` heading) and **do
  not touch `CHANGELOG.md` or the `version` in `.claude-plugin/plugin.json`**.
  The release is cut after merge by the `release_train` CI job (or by hand
  with `node scripts/assign-plugin-version.mjs --write`), which assembles the
  fragments into the `## [x.y.z]` section and assigns the number. Two MRs
  editing `## [Unreleased]` conflicted on the same lines whenever both were
  open; two fragment files never do. Claiming a version inside a content MR is
  worse still: every MR would edit the same manifest line, so whoever merges
  second carries a number already on `main` — and a version that goes
  backwards is invisible in `/plugin`, since the install path is version-keyed.
- An `ai-workflows` MR without that reviewer is not done. Confirm it with
  `glab mr view <iid> -R greenberrynl/config/ai-workflows` before reporting, and
  report the real MR URL — never claim an MR or a reviewer the CLI did not
  confirm.
- The GitHub mirror is not a substitute: these repos are reviewed on GitLab
  (GitHub also refuses a review request from the PR author).
<!-- END SHARED:upstream-mr -->

## Output and Safety

<!-- BEGIN SHARED:safety -->
- Prefer concrete execution over long planning.
- Do not modify code unless requested.
- Ask before destructive actions (force kill, reset, delete) unless explicitly requested.
- **Never terminate Visual Studio Code without explicit approval for the exact
  target.** This includes `Code`, `Code Helper` (renderer, plugin/extension
  host, GPU, and pty host), and equivalent VS Code processes. The gate applies
  to every signal and termination mechanism, including `TERM`, `KILL`,
  `kill`, `pkill`, `killall`, `taskkill`, and application quit/force-quit
  commands. A broad request such as "free the port", "stop dev servers", or
  "clean up processes" is not approval to terminate VS Code.
- Before terminating a process, resolve patterns to exact PIDs and inspect each
  PID's command. Do not use a pattern-based kill when its full match set has not
  been inspected. If a target is VS Code or its identity is ambiguous, show the
  PID and command and wait for approval before sending any signal.
- Always summarize what was run and what changed.
<!-- END SHARED:safety -->

## Sync Source of Truth

This repo is synced to local IDE agent folders using `scripts/sync.sh`.

- Edit here first, then sync.
- Do not hand-edit mirrored target folders unless you intentionally want local drift.
