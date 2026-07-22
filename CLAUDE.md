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
<!-- END SHARED:command-mappings -->

For these stable workflows on skill-aware tools, prefer the skill as the
canonical path and use the command as fallback:

- `create pr`, `open pr`, `submit pr` -> `skills/create-pr` (canonical), `commands/create-pr.md` (fallback)
- `commit message`, `write commit`, `git commit` -> `skills/commit-message` (canonical), `commands/commit-message.md` (fallback)
- `tdd`, `test-driven development`, `test first`, `test eerst`, `schrijf eerst een test` -> `skills/test-driven-development` (skill only, no fallback)
- `review feedback`, `respond to review`, `reviewer comments`, `beoordeel review`, `reageer op review` -> `skills/receiving-code-review` (skill only, no fallback; hand off to `skills/address-review-comments` to apply)

### Experimental Commands & Skills

> Prefixed with `experimental.` — excluded from project sync by default.
> Use `--include-experimental` flag with sync.sh to include them.

- `run checks`, `run-checks`, `quality checks` -> `skills/experimental.run-checks` (canonical), `commands/experimental.run-checks.md` (fallback)
- `review code`, `code review`, `review changes` -> `skills/experimental.code-review` (canonical), `commands/experimental.review-code.md` (fallback)
- `kill port`, `port 3000`, `eaddrinuse` -> `commands/experimental.safe-kill-port.md`
- `new component`, `scaffold`, `create component` -> `skills/experimental.scaffold-component` (canonical), `commands/experimental.scaffold-component.md` (fallback)
- `component spec`, `spec component`, `write spec`, `spec out a component`, `document component api` -> `skills/experimental.component-spec`
- `new device`, `setup device`, `onboarding` -> `commands/experimental.new-device-setup.md`
- `init project`, `setup project`, `apply ai-workflows` -> `skills/experimental.init-project` (canonical), `commands/experimental.init-project.md` (fallback)
- `upstream rule`, `propose rule`, `share rule change` -> `skills/experimental.upstream-rules`
- `improve skill`, `take learnings`, `verbeter je skill` -> `skills/experimental.improve-skill`
- `work backlog`, `work the backlog`, `next backlog item`, `autonomous delivery` -> `skills/experimental.work-backlog` (canonical), `commands/experimental.work-backlog.md` (fallback; also installed globally at `~/.claude/skills/work-backlog`)

Do not assume command files auto-run. Select and execute them when intent matches.

After any skill or command run that required user intervention (corrections,
re-steering, failed steps that needed a workaround), run
`skills/experimental.improve-skill` before closing out: fold the durable
learnings back into that skill's source in ai-workflows.

## Safety

<!-- BEGIN SHARED:safety -->
- Prefer concrete execution over long planning.
- Do not modify code unless requested.
- Ask before destructive actions (force kill, reset, delete) unless explicitly requested.
- Always summarize what was run and what changed.
<!-- END SHARED:safety -->
