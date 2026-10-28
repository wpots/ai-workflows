# Spike: Ship ai-workflows As A Codex Plugin Too

## Status

ready

Filed 2026-10-13 while preparing the developer demo of the plugin. Time-box:
one day, confirmed by the maintainer on 2026-10-13. Desk research for question
4 done on 2026-10-15 from the Codex source; the prototype still has to confirm
it.

## Priority

medium

## Summary

Find out whether this repo can also be installed as a Codex plugin, next to the
`greenberry` Claude plugin, so Codex users get the skills, the hooks and updates
without running `scripts/sync.sh` by hand — and record the decision.

## User Story

As a developer who works in Codex, I want the Greenberry skills and guardrails
through a Codex plugin that keeps itself current, so that I work with the same
workflows and hooks as a Claude Code user without re-syncing after every
release.

## Acceptance Criteria

- A decision record answers each question below with yes, no or partly, and
  with its evidence: a doc link or the output of a command actually run, the
  date, and the Codex version.
  1. Can a Codex marketplace be added from our private GitLab repo, over SSH or
     HTTPS? If not, which source works, and who would own it.
  2. Can the repo root serve both plugins at once without the two manifests
     getting in each other's way? Which files does that add?
  3. Which of the 38 skills work in Codex unchanged, and how the 11 that name
     Claude Code-only tools behave there.
  4. Which of the six plugin hooks can run under Codex, and what each one
     needs changed.
  5. How an update reaches a Codex user: automatically, by a command, or by a
     workspace admin.
  6. How the always-on layer (the global instructions that `sync-ambient.sh`
     delivers to Claude) reaches a Codex user when a plugin cannot carry it.
- A prototype: a local Codex install adds the marketplace from a branch, lists
  at least three skills, runs one of them end to end, and fires at least one
  hook — or the record names the step that failed and why.
- A recommendation: go, go for skills only, or no-go (stay on `sync.sh`), with
  the reason. On go, follow-up items are filed in `docs/backlog/`, each sized
  per `rules/mr-sizing.md`.
- `docs/setup-machine.md` stops saying Codex has "no plugin path": it says that
  Codex has a plugin system and that we deliver to Codex through `sync.sh` until
  this decision says otherwise. (`README.md` and `docs/keep-current.md` describe
  our current delivery, not Codex, and stay correct until a go.)

## Technical Notes

### What Codex offers (read 2026-10-13, not yet tested)

- Plugins since 2026-03-27, in the Codex app, the CLI and the VS Code
  extension. A plugin bundles skills, MCP servers and lifecycle hooks
  (`hooks/hooks.json`); OpenAI's user docs also list browser extensions.
- Manifest: `plugin.json` at the plugin root (portable schema
  `https://agent-plugins.org/schemas/1.0.0/plugin.schema.json`), or the legacy
  `.codex-plugin/plugin.json`. Skills in `skills/`, MCP config in `mcp.json`.
- Marketplace: `.agents/plugins/marketplace.json` in a repo, or
  `~/.agents/plugins/marketplace.json`; added with
  `codex plugin marketplace add owner/repo`; the plugin browser is
  `codex /plugins`. Workspace admins can import and sync a GitHub marketplace
  for their team.
- Not in the docs read: non-GitHub marketplace sources, automatic updates and
  always-on instructions as a plugin component. Questions 1, 5 and 6 exist
  because of these gaps. The hook environment is answered from source below.

### What the Codex source says about hooks (read 2026-10-15, not yet run)

Read from `openai/codex` `main` at `6fbd7be`, and checked against the
`codex-cli 0.162.0-alpha.17.2` binary that ships with the VS Code extension
(`codex features list`: `hooks stable true`).

- Hooks have been stable since 0.124.0 and are on by default (`[features]
  hooks`; `codex_hooks` is a deprecated alias). The config shape and the matcher
  rules are Claude Code's: an exact match for `[A-Za-z0-9_|]` patterns, a regex
  otherwise.
- A plugin's `hooks/hooks.json` loads automatically when its manifest has no
  `hooks` key. Codex looks for manifests in this order: a root `plugin.json`
  with the agent-plugins `$schema`, then `.codex-plugin/plugin.json`, then
  `.claude-plugin/plugin.json`. It also reads `.claude-plugin/marketplace.json`.
  So the repo root may serve Codex without a second manifest (question 2; the
  prototype confirms it).
- Plugin hooks get `PLUGIN_ROOT`, `CLAUDE_PLUGIN_ROOT`, `PLUGIN_DATA` and
  `CLAUDE_PLUGIN_DATA`, and `${VAR}` in the command string is expanded. Our
  `hooks.json` resolves unchanged.
- Each plugin hook must be trusted once in `/hooks`, keyed on a hash of its
  definition, so a changed definition needs trusting again. An untrusted hook is
  probably skipped in `codex exec`.
- Tool names and input:
  - The shell is `Bash`, and `tool_input.command` is a string.
  - Edits are `apply_patch`, which `Write` and `Edit` match as aliases. The raw
    patch is in `tool_input.command`, and there is no `file_path`, `content` or
    `new_string`.
  - MCP tools are named `mcp__<server>__<tool>`.
- Supported decisions: `deny` with a reason, exit code 2, `additionalContext`
  and `{"decision": "block"}`. `permissionDecision: "ask"` is unsupported and
  fails open: the hook is logged as failed, and the tool runs anyway. `allow`
  works only together with `updatedInput`.
- `transcript_path` points at a Codex rollout, a format the docs call unstable
  for hooks.

### What our side assumes Claude

- `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` make the
  repo root the plugin. A Codex manifest would sit next to them; check that the
  `skills/` layout is read the same way by both.
- `hooks/hooks.json` runs every hook through `${CLAUDE_PLUGIN_ROOT}`, which
  Codex also sets. Here is how each script behaves under the source above:
  - `prefer_service_cli.py` works unchanged. MCP naming is the same, and Codex
    honours `deny`. This is the hook the prototype should fire.
  - `require_process_termination_approval.py` fires, but it answers `ask`, so
    the guard fails open. Do not port it; see "The approval guards per
    harness" below.
  - `require_ticket_transition_approval.py` fires on `Bash` and on the
    connector's `transitionJiraIssue`, answers `ask` too, and fails open the
    same way. The same section covers it.
  - `check_added_comments.py` fires on `apply_patch` through the alias but
    finds nothing, because it reads Claude's `Write` and `Edit` fields. To work
    in Codex it needs an `apply_patch` branch that takes the added lines from
    the patch.
  - `improve_skill_retrospective.py` does nothing. It parses a Claude
    transcript, and a Codex rollout has no `Skill` tool call to find. It stays
    Claude-only.
  - `sync-ambient.sh` runs and refreshes `~/.claude/rules/`, which Codex never
    reads. It then tells the model that its global rules are current, which is
    untrue in Codex. It must not run under Codex until question 6 is decided.
- Two ways to give Codex a different hook set from the same root:
  - A `.codex-plugin/plugin.json` whose `hooks` key points at a Codex-only
    file. Codex reads it before `.claude-plugin/plugin.json`, and Claude never
    reads it.
  - Harness detection inside each script.

  The first keeps the scripts simple, but it brings back the second manifest
  that question 2 hoped to avoid.

- Skills that name Claude Code-only tools (`AskUserQuestion`, `Monitor`,
  `ScheduleWakeup`, `EnterWorktree`, `TaskStop`, `SendMessage`): close-sprint,
  create-pr, datocms-migration, dependency-hotfix, mr-merged, release,
  service-cli, start-project, test-driven-development, watch-mrs, wcag-audit.
  `watch-mrs` is built on `Monitor` and is the likeliest to need a Codex path
  of its own.
- Today Codex gets the skills from `scripts/sync.sh` into
  `~/.codex/skills/custom`, and `AGENTS.md` from project sync. Codex reads that
  folder: the bundled `codex-cli 0.164.0-alpha.11.1` names three skill roots,
  `codex-home-skills` (`$CODEX_HOME/skills`), `user-agent-skills`
  (`~/.agents/skills`) and its system skills (strings in the binary,
  2026-10-28, not a live run). If a Codex plugin
  ships, sync must stop copying skills for Codex, or the copies shadow the
  plugin — the same step the Claude migration took.
- The only GitHub copy of this repo today is a personal mirror. If Codex needs a
  GitHub source, an organisation-owned one is part of the answer to question 1.

### The approval guards per harness

Two hooks exist only to force a person's go, and both answer `ask`, which Codex
does not support.

**The kill guard.** The Seatbelt profile in both the Claude Code 2.1.300 binary
and the Codex 0.162 binary contains `(allow signal (target same-sandbox))`. A
sandboxed `kill` aimed at VS Code therefore fails with `EPERM`, so the guard
only matters for a kill that runs outside the sandbox.

- Codex: leaving the sandbox needs an approval under the default `on-request`
  policy, so Codex's own gate already covers the case the hook was written for.
  That gate is gone under any of these:
  - `--yolo` or `danger-full-access`
  - `approval_policy = "never"`
  - automatic review of escalations
  - an `allow` prefix rule that a user clicked into `~/.codex/rules/`

  The native backstop is one `prefix_rule(pattern=["kill"], decision="prompt")`
  per termination command, delivered by `sync.sh`. It is untested whether such
  a rule also catches `xargs kill` and `bash -lc "kill …"`, which the hook does
  catch.
- Claude Code: the hook stays. In auto mode, an unsandboxed retry goes to the
  classifier rather than to a person. The sandbox is a per-user setting, and a
  user without it has no other layer. The matching `ask` rules exist only in
  project settings generated from `templates/project-claude-settings.json`.
  It is untested whether the hook's `ask` still reaches a person in auto mode.

**The ticket-transition guard.** In Codex, `jira issue move` is gated only
while the sandbox blocks its network call. That is `workspace-write` without
network access, which the Codex docs give as the default; this was not verified
here. A user who grants the sandbox network access loses the gate. How Codex
approves a connector's `transitionJiraIssue` call is untested. A
`prefix_rule(pattern=["jira", "issue", "move"], decision="prompt")`, plus one
per alias, is the same backstop as for the kill guard.

### Shape of the spike

One day, then stop and record what is known. Work on a branch; never point a
team marketplace at it. The decision goes into
`docs/skills-first-migration-plan.md` as a new amendment, the way the
2026-10-08 Cursor amendment was recorded; the evidence per question can sit in
that amendment or in a short appendix it links to.

## Out of Scope

- Building the Codex plugin itself; that becomes follow-up items on go.
- Rewriting skills to drop Claude Code-only tools.
- A Codex counterpart of `claude plugin eval`.
- Cursor (retired 2026-10-13) and Copilot (out since 2026-10-28).
- An organisation-wide Codex rollout.

## Related

- [../skills-first-migration-plan.md](../skills-first-migration-plan.md) — the
  tool support matrix this would change
- [../setup-machine.md](../setup-machine.md) — the "no plugin path" sentence
  to correct; [../how-it-works.md](../how-it-works.md) and
  [../keep-current.md](../keep-current.md) change only on a go
- [../org-managed-plugin-settings.md](../org-managed-plugin-settings.md) — the
  Claude counterpart for team-wide marketplace registration
- [chore-retire-copilot-adapters-1-stop-emitting.md](chore-retire-copilot-adapters-1-stop-emitting.md)
  — slice 1 of the Copilot retirement; it also edits `scripts/sync.sh`
- [../../evals/README.md](../../evals/README.md) — the `claude plugin eval`
  setup a Codex counterpart would mirror
- OpenAI, "Package your plugin": <https://developers.openai.com/codex/plugins/build>
- OpenAI, Codex hooks: <https://learn.chatgpt.com/docs/hooks>
- `openai/codex` source read for the hook notes:
  <https://github.com/openai/codex/tree/6fbd7be1518d259e30e6fef48f05f433d2461a20>
  (`codex-rs/hooks/src/engine/`, `codex-rs/core/src/tools/hook_names.rs`)
- OpenAI, plugins overview: <https://learn.chatgpt.com/docs/plugins>
- The New Stack, "OpenAI's Codex gets plugins":
  <https://thenewstack.io/openais-codex-gets-plugins/>
