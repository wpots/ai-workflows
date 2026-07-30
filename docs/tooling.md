# Integration Tooling

How agents reach external systems, split along the seam that matters:
scriptable/headless work versus interactive context. This document replaces
the old `mcp/servers.json` + `mcp/README.md` global definitions.

## The Doctrine

- **CLI-first** for anything scriptable or headless: git, GitLab (`glab`),
  tracker access in scripts (`jira`), secrets (`npx dotenvx`). CLIs work in
  every harness and in CI, and their commands match the permissions
  allowlist, so autonomous runs never stall on them.
- **MCP** for what a CLI cannot give: live browser control (`playwright`,
  `chrome-devtools`), design context (Figma), and OAuth-gated SaaS where the
  claude.ai connector already holds the session (Atlassian, Slack).
- **Secrets never land in config or transcripts**: MCP definitions reference
  env vars (`${VAR}` expansion); commands read secrets with
  `npx dotenvx get`.

## Machine Level — Once Per Developer

Installed and authenticated during `commands/new-device-setup.md`:

| Tool | Install | Auth | Used by |
| ---- | ------- | ---- | ------- |
| `glab` | `brew install glab` | `glab auth login` with a Personal Access Token (scopes `api` + `write_repository`; PATs avoid OAuth refresh races) | create-pr, watch-mrs, mr-merged, address-review-comments, the MR contribution rule |
| `jira` | `brew install jira-cli` | `jira init` with a Jira API token | scripted tracker access where the Atlassian connector is unavailable (headless/CI) |
| `dotenvx` | none — runs via `npx dotenvx` | per-project `.env` files | secret reads in commands without pasting values |
| claude.ai connectors | — | authorize Atlassian and Figma once per user in claude.ai connector settings | jira-ticket, sprint/refinement skills (Jira); component-spec and design work (Figma) |

## Project Level — Emitted by setup-ai-workflows

- `.mcp.json` at the project root: **checked in**, env-var-based, read by
  Claude Code and other MCP clients.
- `.cursor/mcp.json`: Cursor mirror of the same servers.
- Every server and the env vars it expects are recorded in the `## Tooling`
  section of that project's `CONVENTIONS.md`.

Detection heuristics used by `skills/setup-ai-workflows/SKILL.md`:

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
