# CLAUDE.md

## Purpose

Use this setup as a universal Claude Code baseline across projects.

## Loading Model

Claude Code loads this global file and every file in `~/.claude/rules/` into each conversation.
Keep the global rules universal, not stack-specific.

Workflow surface strategy for Claude in this repo:

- skills are first-class and the canonical surface for repeatable workflows;
  they ship via the `greenberry` plugin from the ai-workflows marketplace and
  auto-update (invoke as `/greenberry:<skill>`, natural-language triggers keep
  working through each skill's description)
- commands and runbooks remain the fallback path when no skill exists
- rules stay the policy source of truth

The ai-workflows sync intentionally keeps the global Claude rules slim:

- `communication.md`
- `project.md`
- `clean-architecture.md`

## Project Overrides

When you are inside a synced project, also read:

- `AI-WORKFLOWS.md`
- `CONVENTIONS.md`
- project-local `CLAUDE.md`
- project-local `rules/` and `commands/`

Project-local conventions win over this global baseline.

## Command Mapping

When user intent matches one of these prompts, skills, or command requests, read and follow the corresponding prompt, skill, or runbook:

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
- `apply ai-workflows`, `setup ai-workflows`, `generate conventions`, `refresh project config` -> `commands/setup-ai-workflows.md`
- `work backlog`, `work the backlog`, `next backlog item`, `autonomous delivery` -> `commands/work-backlog.md`
<!-- END SHARED:command-mappings -->

### Skill Mapping

On skill-aware tools the skill is the canonical path; the command is the
fallback. Invoke a skill as `/greenberry:<skill>` or let its description route
you there.

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
- `datocms migration`, `cms migration`, `fork cms environment`, `change the cms schema` -> `skills/datocms-migration` (skill only; the DatoCMS counterpart to `skills/migration-check`, which covers Payload/Postgres)
- `commit message`, `write commit`, `git commit` -> `skills/commit-message` (canonical), `commands/commit-message.md` (fallback)
- `component spec`, `spec component`, `write spec`, `document component api` -> `skills/component-spec` (skill only)
- `create pr`, `open pr`, `submit pr` -> `skills/create-pr` (canonical), `commands/create-pr.md` (fallback)
- `improve skill`, `take learnings`, `verbeter je skill` -> `skills/improve-skill` (skill only)
- `jira ticket`, `maak een jira ticket`, `file a bug`, `meld een bug`, `create a story`, `create a task` -> `skills/jira-ticket` (skill only; writes to the tracker, so it confirms before creating)
- `maintenance`, `project maintenance`, `onderhoud`, `maintenance sweep`, `monthly check`, `health check`, `api key check` -> `skills/maintenance` (skill only; delegates the dependency lane to `skills/npm-maintenance`)
- `migration check`, `check migration`, `verify migration`, `migration already exists` -> `skills/migration-check` (skill only)
- `mr merged`, `post-merge`, `afgerond na merge`, `close out merged MR` -> `skills/mr-merged` (skill only; also the hand-off target when `skills/watch-mrs` reports a merge)
- `npm maintenance`, `update dependencies`, `npm audit`, `fix vulnerabilities`, `npm outdated` -> `skills/npm-maintenance` (skill only)
- `review feedback`, `respond to review`, `reviewer comments`, `beoordeel review`, `reageer op review` -> `skills/receiving-code-review` (skill only; hand off to `skills/address-review-comments` to apply)
- `refinement`, `prepare refinement`, `refine tickets`, `refinement vastleggen` -> `skills/refinement` (canonical), `commands/refinement.md` (fallback)
- `run checks`, `run-checks`, `quality checks` -> `skills/run-checks` (canonical), `commands/run-checks.md` (fallback)
- `new component`, `scaffold`, `create component` -> `skills/scaffold-component` (canonical), `commands/scaffold-component.md` (fallback)
- `apply ai-workflows`, `setup ai-workflows`, `generate conventions`, `refresh project config` -> `skills/setup-ai-workflows` (canonical), `commands/setup-ai-workflows.md` (fallback); the config lane only — a whole new project starts with `skills/start-project`
- `skill opportunity`, `learn from sessions`, `spot workflow patterns`, `should this be a skill` -> `skills/skill-opportunity` (skill only)
- `sprint demo`, `demo voorbereiden`, `demo script`, `prepare demo` -> `skills/sprint-demo` (canonical), `commands/sprint-demo.md` (fallback)
- `sprint planning`, `plan sprint`, `sprint start`, `start sprint`, `plan komende sprint` -> `skills/sprint-planning` (canonical), `commands/sprint-planning.md` (fallback)
- `start project`, `new project`, `init project`, `setup project`, `initialize project`, `project kickoff`, `project brief`, `project spec`, `nieuw project`, `project opzetten` -> `skills/start-project` (skill only; the single kickoff entry — it runs `skills/setup-ai-workflows`, writes brief/spec/architecture, and hands the journeys to `skills/user-journeys`)
- `sustainable review`, `sustainability review`, `performance audit`, `green refactor`, `ci review`, `dependency review` -> `skills/sustainable-review` (canonical), `commands/sustainable-review.md` (fallback)
- `tdd`, `test-driven development`, `test first`, `test eerst`, `schrijf eerst een test` -> `skills/test-driven-development` (skill only)
- `upstream rule`, `propose rule`, `share rule change` -> `skills/upstream-rules` (skill only)
- `upstream to unicore`, `port to unicore`, `upstream to template`, `unicore-template` -> `skills/upstream-to-unicore` (skill only)
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
- Pass **both** `-R <canonical-repo>` and `-H <canonical-repo>` to
  `glab mr create`, and `-R` to every follow-up `glab mr update`/`view`. `-R`
  sets only the target; the head (source) project and the MR lookup still
  default to the **current directory's** git remote. Run these from the
  originating project — normal, and unavoidable for an agent that may not `cd`
  — and MR creation fails with
  `422 [Source project is not a fork of the target project]`. Do not fall back
  to `glab api …/merge_requests`: `--field "reviewer_ids[]=<id>"` sends the
  bracket as a literal JSON key and silently opens the MR with no reviewer.
- When the MR changes what the `greenberry` plugin ships or how it behaves —
  `skills/`, `commands/`, `.claude-plugin/`, `hooks/`, a script a hook runs, or
  the ambient layer (`CLAUDE.md`, `rules/communication.md`,
  `rules/project.md`, `rules/clean-architecture.md`) — bump the `version` in
  `.claude-plugin/plugin.json` and add the matching `CHANGELOG.md` entry in
  the same MR. The install path is version-keyed, so an unbumped release is
  invisible in `/plugin` and indistinguishable from the previous one.
- An `ai-workflows` MR without that reviewer is not done. Confirm it with
  `glab mr view <iid> -R greenberrynl/config/ai-workflows` before reporting, and
  report the real MR URL — never claim an MR or a reviewer the CLI did not
  confirm.
- The GitHub mirror is not a substitute: these repos are reviewed on GitLab
  (GitHub also refuses a review request from the PR author).
<!-- END SHARED:upstream-mr -->

## Safety

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

## Graphify

The graphify skill itself is a personal global skill
(`~/.claude/skills/graphify/SKILL.md`), not shipped by this repo. When the user
types `/graphify`, follow that skill before doing anything else.

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

## Shell Usage

- Use the Read, Grep, and Glob tools for reading and searching files, not
  `cat`/`grep`/`find` via Bash.
- Bash is meant for: git, glab, jira, npm/npx, and project scripts.

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
  npx, node, rg, jq, head/tail/cat/ls/echo). Unsure whether a prefix will
  match: split the command so the known prefix comes first.
- Exception — secrets: NEVER paste a secret literally into a command (it
  stays in transcripts). Use `$(npx dotenvx get …)` or a variable for that,
  and run the command sandboxed (host must be on the sandbox network
  allowlist) so it goes through without a prompt.
- Pass these rules on to subagents in their prompt too; they inherit the
  permission system but don't always read this file.

### Worktrees: cheap by default, heavy only on purpose

A checkout costs ~90 MB; the same worktree with `node_modules` and a build
output costs 1.4-3 GB. Left behind, a handful of them silently eats double-digit
gigabytes. So scale the setup to what the task actually needs, and tear it down
when the branch is pushed.

- One root: `~/.worktrees/<repo>-<slug>`. NEVER inside the repo (test runners
  ignore `.worktrees/`, so suites report 0 tests) and never in a directory
  registered as an additional working directory (the IDE crashes on it).
- Default to a **symlinked** `node_modules` — `ln -s <main-checkout>/node_modules
  <worktree>/node_modules`. Jest, `tsc`, ESLint and typegen all work through it,
  at zero disk cost.
- Only when a bundler that rejects symlinks is needed (Turbopack: `next
  build`/`next dev`), replace the symlink with a copy-on-write clone —
  `cp -Rc <main>/node_modules <worktree>/node_modules`. Prefer that over
  `npm ci`/`npm install`, which re-downloads the tree and can get OOM-killed
  halfway, leaving truncated packages.
- Those two rules are **npm-shaped**: npm has no shared store, so every real
  install duplicates the whole tree (one repo, five worktrees, ~1.5 GB each ≈
  7.3 GB of copies). When the project uses a content-addressed store (pnpm),
  just install in the worktree — it hardlinks from that store, so it takes
  seconds, adds almost no disk, and gives a lockfile-accurate tree per branch
  with no symlink or clone to undo. Check `packageManager` in `package.json`
  first and use what it pins; forcing another manager only earns
  `This project is configured to use npm`, which is corepack doing its job.
- Gitignored artifacts the main checkout has and a fresh worktree does not are
  what make setup fail in confusing ways — copy them rather than debugging the
  symptom (see the worktree section in
  `skills/create-pr/references/push-and-mr-mechanics.md` for the list and the
  error each missing one produces).
- Delete the worktree immediately after pushing (`git worktree remove --force`);
  that reclaims `node_modules` and the build output in one step. Any env file
  copied in goes with it — never leave a copied secret behind.
- Before concluding anything from a build or a running server in a worktree,
  check `git log --oneline -1` there. A baseline build overwrites the build
  output, so a "verify the fix" run right after it can silently serve the
  baseline instead.
