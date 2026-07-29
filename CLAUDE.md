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

For these stable workflows on skill-aware tools, prefer the skill as the
canonical path and use the command as fallback:

- `create pr`, `open pr`, `submit pr` -> `skills/create-pr` (canonical), `commands/create-pr.md` (fallback)
- `commit message`, `write commit`, `git commit` -> `skills/commit-message` (canonical), `commands/commit-message.md` (fallback)
- `tdd`, `test-driven development`, `test first`, `test eerst`, `schrijf eerst een test` -> `skills/test-driven-development` (skill only, no fallback)
- `review feedback`, `respond to review`, `reviewer comments`, `beoordeel review`, `reageer op review` -> `skills/receiving-code-review` (skill only, no fallback; hand off to `skills/address-review-comments` to apply)
- `upstream to unicore`, `port to unicore`, `upstream to template`, `unicore-template` -> `skills/upstream-to-unicore` (skill only, no fallback)
- `wcag audit`, `accessibility audit`, `wcag compliance audit`, `a11y audit` -> `skills/wcag-audit` (skill only, no fallback)
- `maintenance`, `project maintenance`, `onderhoud`, `maintenance sweep`, `monthly check`, `health check`, `api key check` -> `skills/maintenance` (skill only, no fallback; delegates the dependency lane to `skills/npm-maintenance`)
- `mr merged`, `post-merge`, `afgerond na merge`, `close out merged MR` -> `skills/mr-merged` (skill only, no fallback; also the hand-off target when `skills/watch-mrs` reports a merge)
- `start project`, `new project`, `project kickoff`, `project brief`, `project spec`, `nieuw project`, `project opzetten` -> `skills/start-project` (skill only, no fallback; writes brief/spec/architecture, then hands over to `skills/init-project`)

### Additional Commands & Skills

- `run checks`, `run-checks`, `quality checks` -> `skills/run-checks` (canonical), `commands/run-checks.md` (fallback)
- `review code`, `code review`, `review changes` -> `skills/code-review` (canonical), `commands/review-code.md` (fallback)
- `kill port`, `port 3000`, `eaddrinuse` -> `commands/safe-kill-port.md`
- `new component`, `scaffold`, `create component` -> `skills/scaffold-component` (canonical), `commands/scaffold-component.md` (fallback)
- `component spec`, `spec component`, `write spec`, `spec out a component`, `document component api` -> `skills/component-spec`
- `new device`, `setup device`, `onboarding` -> `commands/new-device-setup.md`
- `init project`, `setup project`, `apply ai-workflows` -> `skills/init-project` (canonical), `commands/init-project.md` (fallback)
- `upstream rule`, `propose rule`, `share rule change` -> `skills/upstream-rules`
- `improve skill`, `take learnings`, `verbeter je skill` -> `skills/improve-skill`
- `work backlog`, `work the backlog`, `next backlog item`, `autonomous delivery` -> `skills/work-backlog` (canonical), `commands/work-backlog.md` (fallback; also installed globally at `~/.claude/skills/work-backlog`)

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
- Always request review from the maintainer, `wieteke.pots`, on that MR:
  `glab mr create … --reviewer wieteke.pots`. On an MR that already exists:
  `glab mr update <iid> --reviewer wieteke.pots`.
- When the MR changes what the `greenberry` plugin ships (`skills/`,
  `commands/`, `.claude-plugin/`), bump the `version` in
  `.claude-plugin/plugin.json` and add the matching `CHANGELOG.md` entry in
  the same MR.
- An MR without that reviewer is not done. Confirm it with
  `glab mr view <iid>` before reporting, and report the real MR URL — never
  claim an MR or a reviewer the CLI did not confirm.
- The GitHub mirror is not a substitute: these repos are reviewed on GitLab
  (GitHub also refuses a review request from the PR author).
<!-- END SHARED:upstream-mr -->

## Safety

<!-- BEGIN SHARED:safety -->
- Prefer concrete execution over long planning.
- Do not modify code unless requested.
- Ask before destructive actions (force kill, reset, delete) unless explicitly requested.
- Always summarize what was run and what changed.
<!-- END SHARED:safety -->

# graphify

- **graphify** (`~/.claude/skills/graphify/SKILL.md`) - any input to knowledge graph. Trigger: `/graphify`
  When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

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
