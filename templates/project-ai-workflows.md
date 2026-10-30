# AI-WORKFLOWS.md

This project uses the shared `ai-workflows` setup. This file explains how the synced AI files are meant to work together.

## Source Of Truth

- `CONVENTIONS.md` is the project-owned source of truth for stack, structure, scripts, and local conventions.
- `rules/` contains the shared baseline coding rules synced from `ai-workflows`.
- `commands/` contains shared workflow runbooks synced from `ai-workflows`.

When `CONVENTIONS.md` conflicts with synced baseline rules, `CONVENTIONS.md` wins.

## How Each Tool Loads These Files

| Tool | What it reliably loads | What that means in practice |
| ---- | ---------------------- | --------------------------- |
| Claude Code | Global `~/.claude/CLAUDE.md` and `~/.claude/rules/*.md`, the `greenberry` plugin (auto-registered via `.claude/settings.json`), plus project files when present | Global Claude rules must stay universal. Skills/commands come from the plugin and auto-update. Project-specific context belongs in `CONVENTIONS.md`, this guide, and project adapters. |
| Codex | `AGENTS.md` plus repo files it can inspect | `AGENTS.md` is the shared adapter (Claude imports it too); deeper project context lives in `CONVENTIONS.md`, `rules/`, and `commands/`. |

## Workflow Surface Strategy

This setup uses four workflow surfaces:

| Surface | Primary role |
| ------- | ------------ |
| `rules/` | stable policy and coding standards |
| `skills/` | repeatable multi-step workflows for skill-aware tools; these are usually installed globally, not copied into the project |
| `commands/` | compatibility adapters and fallback runbooks |
| adapters | always-on routing, precedence, and local usage guidance |

## Shared Workflow Assets

Treat these as the reusable shared workflow assets in a synced project:

<!-- BEGIN SHARED:workflow-assets -->
<!-- END SHARED:workflow-assets -->

Sharing a change to one of these goes through the `upstream-rules` skill, which
carries the rule for landing it in `ai-workflows` via a GitLab MR.

## Tool Support Matrix

Use this as the intended model inside synced projects:

| Tool | Preferred workflow surface |
| ---- | -------------------------- |
| GitHub Copilot | not supported; sync generates nothing for it, and `.github/` files from earlier syncs are left as they are |
| Cursor | not supported; sync generates nothing for it, and `.cursor/` files from earlier syncs are left as they are |
| Codex | skills first, commands as fallback |
| Claude Code | skills first (via the `greenberry` plugin, e.g. `/greenberry:create-pr`), commands as fallback |

## Always-On Vs On-Demand

Use this rule of thumb:

- Always-on: the thin adapter for the tool and `CONVENTIONS.md`
- On-demand: focused files in `rules/` and workflow runbooks in `commands/`

The focused rules are intentionally conditional so every conversation does not load every concern.
Load the relevant file when the task needs it:

| Task type | Rule to consult |
| --------- | --------------- |
| TypeScript-heavy code, API/JSON/env/database boundaries | `rules/type-safety.md` |
| Styling, tokens, Tailwind | `rules/tailwind.md` |
| Browser verification, tests, test reviews | `rules/testing.md` |
| Interactive UI, a11y checks | `rules/accessibility.md` |
| User stories, specs, backlog work | `rules/backlog.md` |
| CMS-backed content block architecture and transforms | `rules/content-blocks.md` |
| Payload CMS schemas, generated types, hooks, and integrations | `rules/payload.md` <!-- payload-only --> |
| Stack-specific architecture | the matching file in `rules/stacks/` after checking `package.json` |

## Type-Safety Model

This setup treats type safety as three layers:

- universal baseline: compact always-on guidance from the adapters and, in
  Claude Code, the global rules
- deeper policy: `rules/type-safety.md` for trust boundaries, strict TypeScript
  posture, lint guardrails, and transport-to-domain separation
- review audit: the code-review workflow checks unsafe assertions, missing
  validation, and missing workflow guardrails

The default recommendation is compile-time strictness plus runtime validation at
trust boundaries. External data is not considered safe just because TypeScript
types exist nearby.

## How Developers Should Use This

You usually do not need to mention the always-on files. You should mention the focused rules when the task is specific enough that the tool may not load them by itself.

Examples:

- "Implement this form and follow `rules/accessibility.md`."
- "Write tests for this component using `rules/testing.md`."
- "Refactor this page and apply `rules/tailwind.md`."
- "Add a new CMS block and follow `rules/content-blocks.md`."
- "Update this Payload schema using `rules/payload.md`." <!-- payload-only -->
- "Review this integration against `rules/type-safety.md` and call out trust-boundary risks."
- "Review this feature against `rules/clean-architecture.md` and the relevant stack rule."

Per tool:

- Claude Code: project `CLAUDE.md` imports `AGENTS.md` and `CONVENTIONS.md`; `AGENTS.md` points to `rules/`, but mentioning the specific rule in the prompt gives the strongest signal.
- Codex: `AGENTS.md` points to the local files, and explicitly naming a focused rule is still helpful for narrow tasks.

For workflows:

- If a matching skill exists and the current tool supports skills well, prefer the skill.
- If a workflow needs a prompt-friendly fallback, use the matching command/runbook.
- Keep rules as the policy source even when a skill or command helps execute the work.

## The Path of a Ticket

How a ticket travels from refinement to an accepted change, and whose decision
each step is. "You" is the developer the ticket is assigned to. In Codex, name
the skill instead of typing the slash command.

The ready check is the gate. Before it, you decide: what a ticket asks, how it
is sliced into backlog items, and whether an item is clear enough to build,
held against the [Definition of Ready](rules/backlog.md#definition-of-ready).
Once you flip an item to `ready`, `work-backlog` may build it unattended, up to
one MR. From the review on, people decide again.

| Step | You type | Who | Outcome |
| ---- | -------- | --- | ------- |
| 1. Refinement | `/greenberry:refinement` | you prepare, the team decides with the PO | tickets grouped and sized, open questions per ticket, a ready line per story |
| 2. Sprint planning | `/greenberry:sprint-planning` | you | a planning document with the execution order, and the ready check offered over the planned items |
| 3. Backlog items | `/greenberry:backlog <KEY>` | you, the agent drafts | one item per slice in `docs/backlog/`, each ending in the ready check |
| **4. Ready check — the gate** | "is `<KEY>` ready", then confirm the flip | you | `ready`, or a `Blocked on:` line per open point with the next step |
| 5. Build | `/greenberry:work-backlog` | the agent, unattended | branch, implementation, checks, self-review, `How to verify`, one MR |
| 6. Review and merge | `/greenberry:watch-mrs !<iid>` to follow it | reviewer | merged, or comments to address; `watch-mrs` hands a merge to step 8 |
| 7. Rework | `/greenberry:receiving-code-review`, then `/greenberry:address-review-comments` | you decide, the agent applies | each comment applied or answered, the MR back with the reviewer |
| 8. Closeout | `/greenberry:mr-merged !<iid>` | you, the agent drafts | the deploy to development read back, a "How to test this" comment for the team, the ticket move named |
| 9. Test | — | the team | a comment on the ticket, with findings or none |
| 10. Test handoff | `/greenberry:ticket-handoff <KEY>` | you, the agent drafts | findings routed to a backlog item or a new ticket, or the comment for the PO |
| 11. Acceptance | — | the PO | approval or rejection in a comment; `ticket-handoff` then checks Done |

- Moving a ticket on the board is yours, by hand; the skills name the move with
  the ticket link (`rules/ticket-flow.md`).
- Every skill on the path ends its recap with one `Next step:` line, so you can
  pick up from wherever you are.
- After acceptance, `/greenberry:release` takes the change to production and
  `/greenberry:close-sprint` closes the sprint.
- A project without sprints follows the same steps without sprint planning, and
  `close-sprint` closes a calendar month instead (support mode).

## Files In This Project

- `CONVENTIONS.md`: project-specific stack, structure, scripts, and deviations from the shared baseline
- `AI-WORKFLOWS.md`: this guide
- `AGENTS.md`: the adapter every agent shares; Codex reads it directly
- `CLAUDE.md`: imports `AGENTS.md` and `CONVENTIONS.md` and adds the Claude-specific lines
- `rules/`: synced shared coding standards
- `commands/`: synced workflow runbooks

## Available Command Triggers

When user intent matches one of these triggers, read and follow the corresponding runbook in `commands/`:

<!-- BEGIN SHARED:command-mappings -->
<!-- END SHARED:command-mappings -->

All shared command and rule workflows are included in project sync by default.

## Permissions Baseline

Synced projects ship a Bash allowlist in `.claude/settings.json` that matches
the Shell Usage doctrine: git, glab (mr/ci/api/auth), jira, npm/pnpm/npx
runners, `node scripts/*`, and read-only utilities (`rg`, `jq`, `sed -n`,
`head`, `tail`, `cat`, `ls`, `echo`, `wc`) run without a prompt, while
destructive git (`push --force`, `reset --hard`, `clean`) and process
termination (`kill`, `pkill`, `killall`, `taskkill`) always ask first. The
plugin also carries a
`PreToolUse(Bash)` gate for termination commands, so a broader local allow rule
cannot silently bypass the approval prompt. This is why agents are told to
phrase commands so each segment starts with an allowlisted tool — a command
shaped outside the list costs a human approval and blocks autonomous runs.

- Extend per project by adding rules to `permissions.allow` (for example a
  project CLI, or `curl` against the local dev URL).
- Never put secrets tooling or destructive commands in `allow`; destructive
  git and process termination stay in `ask` on purpose.
- Sync preserves an existing `settings.json`; projects that predate the
  baseline merge the `permissions` block manually.

## Integration Tooling

- Machine-level CLIs (`glab`, `jira`, `dotenvx`) are installed and
  authenticated once per developer — `commands/new-device-setup.md` covers
  install + auth.
- Project-level MCP servers live in `.mcp.json` (checked in, env-var-based);
  `setup-ai-workflows` emits it and documents the servers in the `## Tooling`
  section of `CONVENTIONS.md`.
- Doctrine — CLI for scriptable/headless work; available browser control
  for one-off UI checks (`rules/testing.md`); MCP for browser fallback,
  design context, and OAuth SaaS. Full table: `docs/tooling.md` in
  ai-workflows.
- claude.ai connectors (Atlassian, Figma) are authorized per user, not per
  project.

## Customizing This Setup

- Adjust selected packages when the project should opt into a reusable
  Greenberry stack or concern baseline.
- Edit `CONVENTIONS.md` for project-local decisions.
- Edit the shared `ai-workflows` repo when a rule or runbook should be reused across projects.
- Re-run project sync after upstream updates to refresh the local adapters, rules, and commands.
