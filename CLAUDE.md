# CLAUDE.md

<!--
The `greenberry` plugin installs this file as `~/.claude/rules/ai-workflows.md`,
next to `communication.md`, `project.md` and `clean-architecture.md`, and Claude
Code loads every file in `~/.claude/rules/` into each conversation.
`~/.claude/CLAUDE.md` belongs to the user; the plugin never writes it. Keep the
global rules universal, not stack-specific.

Claude Code strips block-level HTML comments like this one before it loads the
file, so notes for maintainers cost no context.
-->

## Purpose

Use this setup as a universal Claude Code baseline across projects.

Skills are the canonical surface for repeatable workflows: invoke one as
`/greenberry:<skill>`, or let its description route you there. Commands and
runbooks are the fallback when no skill exists; rules stay the policy source of
truth.

## Project Overrides

When you are inside a synced project, also read:

- `AI-WORKFLOWS.md`
- `CONVENTIONS.md`
- project-local `CLAUDE.md`
- project-local `rules/` and `commands/`

Project-local conventions win over this global baseline.

Before browser verification, read `rules/testing.md` from the project (or
the plugin source when the project has no copy). It defines the choice
between an interactive browser check and reusable automated tests.

## Command Mapping

When user intent matches one of these triggers, read and follow the corresponding
runbook — the commands that have no skill. Every other runbook is the fallback
named in its skill's row below.

- `kill port`, `port 3000`, `eaddrinuse` -> `commands/safe-kill-port.md`
- `new device`, `setup device`, `onboarding` -> `commands/new-device-setup.md`

### Skill Mapping

<!-- BEGIN SHARED:skill-mappings -->
Skills are the canonical surface. A command is listed only where one exists as
fallback for tools that cannot use skills.

<!--
Alphabetical, so a missing entry is easy to spot.

Line format: triggers `->` the routing targets, then an optional note after a
`;`. Only paths before the `;` count as routes — a skill named in a note is a
cross-reference, so it still needs its own line.
-->

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
- `upstream to unicore`, `port to unicore`, `upstream to template`, `unicore-template`, `template harvest`, `wat moet terug naar de template` -> `skills/upstream-to-unicore` (skill only; `skills/mr-merged` and `skills/close-sprint` propose its harvest when template-owned files change)
- `user journeys`, `spec the journeys`, `user flows`, `customer journey`, `journeys uitwerken` -> `skills/user-journeys` (skill only; writes `docs/journeys/`, then hands the slice candidates to `skills/backlog`)
- `watch mr`, `monitor mr`, `notify on approval`, `auto-merge when ready` -> `skills/watch-mrs` (skill only)
- `wcag audit`, `accessibility audit`, `wcag compliance audit`, `a11y audit` -> `skills/wcag-audit` (skill only)
- `work backlog`, `work the backlog`, `next backlog item`, `autonomous delivery` -> `skills/work-backlog` (canonical), `commands/work-backlog.md` (fallback)
<!-- END SHARED:skill-mappings -->

Do not assume command files auto-run. Select and execute them when intent matches.

After any skill or command run that required user intervention (corrections,
re-steering, failed steps that needed a workaround), run
`skills/improve-skill` before closing out: fold the durable
learnings back into that skill's source in ai-workflows.

## Shared Workflow Assets Land via MR

Never commit or push to the base branch of `ai-workflows` or `unicore-template`:
every change lands via a GitLab MR. The full rule is
`skills/upstream-rules/references/upstream-mr.md`, which the upstream skills
load; inside `ai-workflows` it also loads from `.claude/rules/upstream-mr.md`.

## Safety

<!-- BEGIN SHARED:safety -->
- Prefer concrete execution over long planning.
- Do not modify code unless requested.
- Keep the user's main checkout unchanged for MR/PR review, review rework,
  rebases, conflict resolution and merge-readiness work. Use an isolated
  worktree outside the workspace; load `rules/git-flow.md` first.
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

## Graphify

<!--
The graphify skill itself is a personal global skill
(`~/.claude/skills/graphify/SKILL.md`), not shipped by this repo; Claude Code
runs it on `/graphify` like any other skill.
-->

<!-- BEGIN SHARED:graphify -->
This project may ship a **graphify** knowledge graph under `graphify-out/`,
gitignored, so each developer builds their own with `graphify update .`. When
`graphify-out/graph.json` exists, answer codebase and architecture questions
from the graph before browsing raw files: `graphify query "<question>"`,
`graphify path "<A>" "<B>"` and `graphify explain "<concept>"` return a scoped
subgraph, much smaller than raw grep output.

- If `graphify-out/wiki/index.md` exists, navigate it instead of raw files.
- Read `graphify-out/GRAPH_REPORT.md` only for a broad architecture review.
- Switch to Read/Grep/Glob once graphify has oriented you and you need to
  modify or debug specific lines.
- After modifying code, run `graphify update .` (AST-only, no API cost).
<!-- END SHARED:graphify -->

## Shell Usage

- Use the Read, Grep, and Glob tools for reading and searching files, not
  `cat`/`grep`/`find` via Bash.
- Bash is meant for: git, glab, jira, axiom, npm/pnpm/npx, and project scripts.

### Service access: CLI first, connector for the remainder

Reach GitLab, Jira and Axiom through `glab`, `jira` and `axiom` before any MCP
connector tool; `skills/service-cli` has the recipes. A CLI call runs headless,
is allowlisted per subcommand, and stays in the transcript for a human to
re-run. A connector is the fallback only for what the CLI cannot reach: Jira's
Confluence, Teamwork Graph, Compass and Loom, and Axiom's monitors, dashboards,
notifiers, spotlight and service map. `glab` covers all of GitLab.

The plugin's PreToolUse hook denies a connector call that has a CLI equivalent
and names the command to run, as long as that CLI is installed. When the CLI is
missing the call goes through — say so in the recap. `AIW_ALLOW_MCP=1` switches
the hook off for a session when the CLI itself is broken.

### Autonomy: write commands that match the allowlist

This is a hard rule, not a style preference. Permission matching works per
segment on prefix rules (`Bash(git *)`, `Bash(npm run *)`, …). Any segment
that doesn't match costs a human approval and blocks autonomous runs.

- NO shell variables or assignments (`wt="/path"; cd "$wt"`) — an assignment
  never matches an allow rule. Use absolute paths literally in every command.
- NO for-loops or command substitution (`$(...)`) — same reason. Run multiple
  simple commands separately instead; independent calls may run in parallel
  in one block.
- NO heredocs or multi-line scripts in Bash; put a script in a file
  (scratchpad) and run it with `node scripts/*` or `python3 -c`.
- NO file edits via Bash (`sed -i`, `printf > file`, `>>`, `mv` over source)
  — use the Edit/Write tools instead. They're allowlisted (including inside
  `~/.worktrees`), work with checkpointing/rewind, and trigger the right
  hooks. Only `sed -n` (reading) is allowed.
- NO `cd` to paths outside the working directories (such as `~/.worktrees/…`)
  — that check sits above the allowlist and ALWAYS prompts, even though `cd`
  itself is allowed. Use `git -C <absolute-path> …`, `npm --prefix <path> …`,
  or tools that take an absolute path argument instead.
- Working in a worktree for longer (builds, typegen, tests that need a cwd):
  use the EnterWorktree tool so the worktree becomes a registered working
  directory — nothing prompts after that. Manually `cd`-ing per command keeps
  asking for approval every time.
- Start every segment with a tool that's on the allowlist (git, glab, npm,
  pnpm, npx, node, rg, jq, head/tail/cat/ls/echo). Unsure whether a prefix will
  match: split the command so the known prefix comes first.
- Use the package manager the lockfile names (`pnpm-lock.yaml` → pnpm), and
  spell its commands out in full: `pnpm run <script>`, `pnpm exec <bin>`. The
  shorthand `pnpm <script>` matches no allow rule.
- Exception — secrets: NEVER paste a secret literally into a command (it
  stays in transcripts). Use `$(npx dotenvx get …)` or a variable for that,
  and run the command sandboxed (host must be on the sandbox network
  allowlist) so it goes through without a prompt.
- Pass these rules on to subagents in their prompt too; they inherit the
  permission system but don't always read this file.

### Node and npm: the version the project pins

A non-interactive shell skips the version manager's switch on `cd`, so `node`
and `npm` resolve to its default, rarely the project's pin; a lockfile another
npm writes can fail CI's `npm ci`.

- Read the pin before the first `node`/`npm`/`npx` call: `.nvmrc`,
  `.node-version`, Volta in `package.json`, then `engines.node`. npm is the one
  that Node bundles, unless `packageManager` or `engines.npm` names another.
- With fnm, run `fnm exec --using=.nvmrc <npm|pnpm|node> <args>` from the
  project root (`--using=<pin>` for another directory). With nvm, run the pinned
  binaries by absolute path,
  `~/.nvm/versions/node/v<pin>/bin/node ~/.nvm/versions/node/v<pin>/lib/node_modules/npm/bin/npm-cli.js <args>`,
  never `npm` from `PATH` or `<node>/bin/npm`. Confirm with `--version` once.
- Pinned version not installed: stop and ask for `fnm install <pin>` (or
  `nvm install <pin>`); never fall back to whatever is on `PATH`.
- When the pinned npm cannot do the job, move the pin (`.nvmrc`,
  `packageManager`, the CI image) in the same MR, so local, CI and the lockfile
  agree.
- Name the Node and npm versions that ran in the recap.

The plugin's PreToolUse hook denies an `npm` or `pnpm` install off the pin and
names the pinned command (`scripts/require_pinned_install_runtime.py`).

### Git inside the sandbox

Three git operations fail in the sandbox with errors that blame the server,
your permissions or the repo:

- **`.git/config` is read-only** (`could not lock config file`):
  `git checkout -b <new> <remote>/<base>` creates the branch **without
  switching to it**, so the next commit lands on the branch you were leaving.
  Branch with `git switch -c <branch> --no-track <start-point>`, check
  `git branch --show-current` before staging, and push with
  `git push <remote> <branch>`, not `-u`.
- **SSH** (`git fetch`, `git push`): `~/.ssh` is unreadable, and git's
  `correct access rights` error reads like a revoked token. Run these with the
  bypass; they need the network anyway.
- **A checkout over a protected path** such as `.vscode/` dies halfway
  (`unable to unlink old …`) and leaves the incoming commits as local edits.
  When `git diff --stat <target>` lists only that path and your own work is
  stashed, `git reset --hard <target>` with the bypass finishes the move;
  otherwise stop and ask. Moving a branch across many commits, start with the
  bypass.

Never pipe a command whose failure matters through `head`/`tail` in an `&&`
chain: the chain continues on the pager's exit status, and the error line
scrolls out of the excerpt.

### Worktrees

Root `~/.worktrees/<repo>-<slug>`, never inside the repo; symlink `node_modules`
from the main checkout by default; `git worktree remove --force` right after the
push. Setup, checks, a shared checkout and cleanup:
`skills/create-pr/references/worktrees.md` — read it before creating one.
