# Integration Tooling

How agents reach external systems, split along the seam that matters:
scriptable/headless work versus interactive context. This document replaces
the old `mcp/servers.json` + `mcp/README.md` global definitions.

## The Doctrine

- **CLI-first** for anything scriptable or headless: git, GitLab (`glab`),
  Jira (`jira`), Axiom (`axiom`), secrets (`npx dotenvx`). CLIs work in every
  harness and in CI, their commands match the permissions allowlist per
  subcommand (so read-only skills can be held to read-only), and the call
  stays in the transcript for a human to re-run. The recipes per service live
  in `skills/service-cli`.
- **Native browser control** for one-off UI verification when the harness
  exposes it. Browser checks follow
  [`rules/testing.md`](../rules/testing.md#browser-verification-choose-by-purpose):
  choose by purpose and available capability, before adding setup. The
  CLI-first service policy does not require a standalone Playwright script
  for a task that can be verified in the available browser.
- **MCP / connector** for browser control where native control cannot cover
  the task
  (`playwright`, `chrome-devtools`), design context (Figma), and the remainder
  of a service its CLI does not cover — Confluence and the Teamwork Graph on
  the Atlassian connector, monitors and dashboards on the Axiom connector.
  "The connector already holds the session" is not a reason by itself: it
  holds it for one person in one harness.
- **Enforced, not only preferred**: the plugin's PreToolUse hook
  (`scripts/prefer_service_cli.py`) denies an Atlassian or Axiom connector
  call that has a CLI equivalent while that CLI is installed, naming the
  command to run instead. `AIW_ALLOW_MCP=1` switches it off for a session.
- **Secrets never land in config or transcripts**: MCP definitions reference
  env vars (`${VAR}` expansion); commands read secrets with
  `npx dotenvx get`.

For Codex desktop browser capabilities and session choice, see the official
[built-in browser](https://learn.chatgpt.com/docs/browser) and
[computer-use guidance](https://learn.chatgpt.com/use-cases/use-your-computer-with-codex).

## Machine Level — Once Per Developer

Installed and authenticated during `commands/new-device-setup.md`:

| Tool | Install | Auth | Used by |
| ---- | ------- | ---- | ------- |
| `glab` | `brew install glab` | `glab auth login` with a Personal Access Token (scopes `api` + `write_repository`; PATs avoid OAuth refresh races) | create-pr, watch-mrs, mr-merged, address-review-comments, the MR contribution rule |
| `jira` | `brew install ankitpokhrel/jira-cli/jira-cli` | `jira init` with a Jira API token | the tracker path of jira-ticket, close-sprint, sprint-planning, refinement, sprint-demo, mr-merged |
| `axiom` | `brew install --cask axiomhq/tap/axiom` | `axiom auth login` with a personal API token (`AXIOM_TOKEN` + `AXIOM_ORG_ID` headless) | log and metric lookups during maintenance and incident triage |
| `dotenvx` | none — runs via `npx dotenvx` | per-project `.env` files | secret reads in commands without pasting values |
| claude.ai connectors | — | authorize Atlassian, Figma and Axiom once per user in claude.ai connector settings | the connector-only remainder per service (Confluence, Teamwork Graph; Axiom monitors and dashboards — see `skills/service-cli`); component-spec and design work (Figma) |

## Project Level — Emitted by setup-ai-workflows

- `.mcp.json` at the project root: **checked in**, env-var-based, read by
  Claude Code and other MCP clients.
- `.cursor/mcp.json`: Cursor mirror of the same servers.
- Every server and the env vars it expects are recorded in the `## Tooling`
  section of that project's `CONVENTIONS.md`.

Detection heuristics used by `skills/setup-ai-workflows/SKILL.md`:

These signals configure available integrations; they do not decide which
verification method an agent should use for an individual task.

| Signal | Server |
| ------ | ------ |
| `@playwright/test` in devDependencies | `playwright` |
| UI/e2e work that needs a live, inspectable browser | `chrome-devtools` |
| Other SaaS/tool needs detected in the stack | added case by case, env-var-based |

Example — safe to commit because secrets stay in env vars:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"]
    },
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest"]
    }
  }
}
```

## What We Deliberately Don't Ship

- **No global filesystem MCP server** — Claude Code, Codex, and Cursor have
  native file tools; a filesystem server only added a machine-specific path.
- **No global GitHub MCP server** — `gh`/`glab` CLIs cover the same API,
  allowlist-friendly and headless-capable.
- **No synced `~/.cursor/mcp/ai-workflows` folder** — replaced by the
  per-project `.mcp.json` convention (2026-07), so project needs travel with
  the project instead of living in one developer's local config.
