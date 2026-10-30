---
name: service-cli
description: CLI-first access to GitLab (glab), Jira (jira) and Axiom (axiom) — verify install and auth, the read-only subcommand set, JSON projections with jq, the write commands, and the short list of what stays connector-only per service. Use before reaching GitLab, Jira or Axiom from any skill or task, when the CLI-first hook denies a connector tool call, or when a glab, jira or axiom command fails with an auth or not-installed error ("jira cli", "glab api", "axiom query", "via de cli", "cli first").
metadata:
  owner: wieteke.pots
---

# Service CLI Skill

One place for how agents reach GitLab, Jira and Axiom. The doctrine lives in
`docs/tooling.md`: the CLI first, a connector (MCP) tool only for what the CLI
cannot reach. Every tracker-reading skill (`close-sprint`, `sprint-planning`,
`refinement`, `sprint-demo`, `mr-merged`, `ticket-handoff`) and `jira-ticket`
link here instead of carrying their own snippets.

## Why the CLI comes first

- **It runs everywhere.** Interactive sessions, `claude -p`, routines, CI. A
  claude.ai connector exists only in a logged-in session, and only for the
  person who authorized it.
- **Permissions are per subcommand.** `Bash(jira issue list *)` can be allowed
  while `Bash(jira issue move *)` is not, so the "tracker is read-only" promise
  of the sprint skills becomes something the harness enforces. A connector
  wildcard allows every write along with every read.
- **The call is in the transcript.** A `jira issue list --jql …` line can be
  pasted into the sprint doc or an MR and re-run by a human; a connector call
  cannot.
- **Output is a projection, not a payload.** `--raw | jq '{…}'` returns the
  four fields the skill reads instead of the whole issue with its ADF
  description.
- **The same string works in every agent.** `jira issue view RFW-12` means the
  same in Claude Code and Codex; `getJiraIssue` is one connector's name
  for it, and two Atlassian connectors do not even agree on that.

## Decision rule

1. Is the operation in the service's reference below? Run the CLI command.
2. Is it in the service's connector-only remainder? Use the connector tool,
   and say in the recap that it ran through the connector.
3. Neither? Check `<cli> <group> --help` first. When the command exists, use
   it and add it to the reference in ai-workflows; otherwise use the connector.

The plugin enforces step 1 with a PreToolUse hook
(`scripts/prefer_service_cli.py`): an Atlassian or Axiom connector call that
has a CLI equivalent is denied with the command to run instead, as long as
that CLI is installed. When the CLI is missing the call goes through, and the
recap says the CLI was missing so `commands/new-device-setup.md` can be run.
`AIW_ALLOW_MCP=1` in the environment switches the hook off for one session
when the CLI itself is broken.

## Per service

| Service | CLI | Verify | Recipes | Connector-only remainder |
| --- | --- | --- | --- | --- |
| GitLab | `glab` | `glab auth status` | `references/glab.md` | none |
| Jira | `jira` (`ankitpokhrel/jira-cli`) | `jira me` | `references/jira.md` | Confluence, Teamwork Graph, Compass, Loom |
| Axiom | `axiom` | `axiom auth status` | `references/axiom.md` | monitors, dashboards, notifiers, spotlight, service map, saved queries |

## When a command fails

- `command not found` → not installed. Install per the reference (one `brew`
  line), then run the verify command. Do not fall through to the connector
  silently: say the CLI was missing.
- An auth error (`401`, `403`, "unauthorized", "token") → run the verify
  command, then the login from the reference. Tokens live in the CLI's own
  config; never paste one into a command.
- "Operation not permitted" or a blocked host inside the sandbox → re-run with
  the host allowed; the CLI is fine.
- Network down or the service erroring (`5xx`) → report it; the connector sees
  the same outage.

## Permissions

Allowlist the read-only commands first, in project or user settings:

```
Bash(glab mr *)       Bash(glab api *)         Bash(glab ci *)           Bash(glab auth status)
Bash(jira me)         Bash(jira issue list *)  Bash(jira issue view *)   Bash(jira sprint list *)
Bash(axiom query *)   Bash(axiom dataset list) Bash(axiom auth status)
```

Add the write commands (`jira issue create`, `jira issue comment add`,
`axiom ingest`) only in projects where a skill is allowed to write, and keep
them out of a wildcard: `Bash(jira *)` reopens every write the read-only skills
promise not to make. `jira issue move` is never allowlisted (§ Ticket status).

## Ticket status

Moving a ticket is handwork: the assignee drags it, and on some projects Jira's
own automation moves it on a pipeline event, such as a merge
(`rules/ticket-flow.md`). A skill that moves one as well either repeats that
move or overrides the status the person or the automation chose.

- No skill transitions a ticket, or offers to, as part of its plan, a batch
  approval for other writes, or a recap proposal. It reads the status back, and
  for each ticket that is not where the flow puts it, the recap names the move
  as the assignee's action: key, current and target status, and the ticket
  link.
- `jira issue move` (or the connector's `transitionJiraIssue`) runs only when
  the user asks for it in this session and gives a go on the exact list: key,
  current status and target status per ticket.
- The plugin enforces the go with a PreToolUse hook
  (`scripts/require_ticket_transition_approval.py`): it asks the user before
  every `jira issue move` (also `transition` and `mv`) and every connector
  `transitionJiraIssue`, even where `Bash(jira *)` is allowed. A headless run
  has nobody to answer, so the transition is denied there.

## Constraints

- Never paste a token, API key or password into a command; the CLI config and
  `npx dotenvx get` hold secrets.
- Prefer `--raw | jq` projections over `--plain` tables when more than a
  handful of rows come back; the table is for the human reading along.
- A connector call that went through because the CLI was missing is reported
  as such in the recap, so the gap gets fixed instead of hidden.
