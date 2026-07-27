# CLAUDE.md

## Purpose

Use this setup as a universal Claude Code baseline across projects.

## Loading Model

Claude Code loads this global file and every file in `~/.claude/rules/` into each conversation.
Keep the global rules universal, not stack-specific.

Workflow surface strategy for Claude in this repo:

- skills are available and may be used when they fit well
- commands and runbooks remain the compatibility path
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

## Shell-gebruik

- Gebruik voor het lezen en doorzoeken van bestanden de Read-, Grep- en Glob-tools,
  niet `cat`/`grep`/`find` via Bash.
- Bash is bedoeld voor: git, glab, jira, npm/npx en projectscripts.

### Autonomie: schrijf commando's die de allowlist matchen

Dit is een harde regel, geen stijlvoorkeur. Permission-matching werkt per
segment op prefix-regels (`Bash(git *)`, `Bash(npm run *)`, …). Elk segment dat
niet matcht kost een menselijke goedkeuring en blokkeert autonome runs.

- GEEN shell-variabelen of assignments (`wt="/pad"; cd "$wt"`) — een assignment
  matcht nooit een allow-regel. Gebruik absolute paden letterlijk in elk
  commando.
- GEEN for-loops of command substitution (`$(...)`) — zelfde reden. Voer liever
  meerdere simpele commando's afzonderlijk uit; onafhankelijke calls mogen
  parallel in één blok.
- GEEN heredocs of multi-line scripts in Bash; zet een script in een bestand
  (scratchpad) en run het met `node scripts/*` of `python3 -c`.
- GEEN bestandsbewerkingen via Bash (`sed -i`, `printf > file`, `>>`, `mv` over
  source) — gebruik de Edit/Write-tools. Die zijn allowlisted (ook in
  `~/.worktrees`), werken met checkpointing/rewind, en triggeren de juiste
  hooks. Alleen `sed -n` (lezen) is toegestaan.
- GEEN `cd` naar paden buiten de working directories (zoals `~/.worktrees/…`) —
  die check zit boven de allowlist en vraagt ALTIJD om goedkeuring, ook al is
  `cd` toegestaan. Gebruik in plaats daarvan `git -C <absoluut-pad> …`,
  `npm --prefix <pad> …`, of tools met een absoluut pad als argument.
- Ga je langer in een worktree werken (builds, typegen, tests die cwd nodig
  hebben): gebruik de EnterWorktree-tool zodat de worktree een geregistreerde
  working directory wordt — daarna prompt niets meer. Handmatig `cd`'en per
  commando blijft elke keer om goedkeuring vragen.
- Begin elk segment met een tool die op de allowlist staat (git, glab, npm,
  npx, node, rg, jq, head/tail/cat/ls/echo). Twijfel je of een prefix gematcht
  wordt: splits het commando op zodat de bekende prefix vooraan staat.
- Uitzondering — secrets: plak NOOIT een secret letterlijk in een commando
  (blijft achter in transcripts). Gebruik daar wél `$(npx dotenvx get …)` of
  een variabele, en draai het commando gesandboxt (host moet in de
  sandbox-netwerkallowlist staan) zodat het zonder prompt doorloopt.
- Geef deze regels ook door aan subagents in hun prompt; die erven het
  permission-systeem maar lezen dit bestand niet altijd.
