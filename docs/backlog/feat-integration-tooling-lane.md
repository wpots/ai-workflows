# Feat: Integration Tooling Lane (CLIs, Project MCP, Doctrine)

## Status

done

## Priority

medium

## Summary

The stack hard-depends on CLIs (`glab` for MR flows, `jira` for scripted
tracker access, `dotenvx` for secrets) that no setup doc installed or
verified, and project-level MCP needs (playwright, chrome-devtools) lived
only in one developer's personal `~/.claude.json` — a second developer got
nothing. Meanwhile `mcp/servers.json` hardcoded a personal filesystem path
and duplicated what `gh`/`glab` already cover. Replace the global MCP layer
with an integration tooling lane: machine CLIs in device setup, per-project
env-var-based `.mcp.json` emitted by init-project, and one doctrine doc.

## User Story

As a developer joining a Greenberry project, I want the required CLIs and
project MCP servers installed, authenticated, and documented by the standard
setup flows, so that skills that depend on them work on my machine without
archaeology through a colleague's local config.

## Acceptance Criteria

- [x] `commands/new-device-setup.md` installs and authenticates the machine
      baseline: `glab` (PAT, scopes api + write_repository), `jira`
      (`jira init` + API token), `dotenvx` via npx, plus the claude.ai
      connector authorization note.
- [x] `skills/init-project` (and the fallback command) emit a checked-in,
      env-var-based `.mcp.json` + `.cursor/mcp.json` from detection
      heuristics, never overwrite existing files, and record servers + env
      vars in a `## Tooling` section of CONVENTIONS.md.
- [x] `docs/tooling.md` holds the doctrine (CLI for scriptable/headless, MCP
      for browser/design/OAuth SaaS) and the machine CLI table, and replaces
      `mcp/README.md` + `mcp/servers.json` (both deleted).
- [x] `sync.sh` no longer syncs a global Cursor MCP folder; README,
      FEATURES.md, pipeline-map, and the AI-WORKFLOWS template reflect the
      new model.
- [x] No new skill: the steps live in existing surfaces (new-device-setup,
      init-project, docs).
- [x] Plugin bumped to 1.5.0 with a changelog entry (init-project behavior
      change ships via the plugin).

## Technical Notes

- Assumption flagged for review: `jira` = `jira-cli` (`brew install
  jira-cli`, `jira init`). If the team standard is a different Jira CLI,
  correct it in `docs/tooling.md` + `commands/new-device-setup.md` — single
  source, one edit.
- The FEATURES.md validator's MCP-table check keys off `mcp/servers.json`
  being tracked; with the file deleted the check skips itself — no validator
  change needed.
- `.mcp.json` is safe to commit because secrets stay `${ENV_VAR}`
  references; the init-project constraints forbid literal values.

## Out of Scope

- Auto-installing CLIs (device setup instructs; it does not run brew
  unattended).
- Migrating existing projects' personal MCP configs (each project adopts on
  its next init-project/refresh).
- A machine-level MCP baseline (deliberately none — see docs/tooling.md).

## Related

- [../tooling.md](../tooling.md)
- [../../commands/new-device-setup.md](../../commands/new-device-setup.md)
- [../../skills/init-project/SKILL.md](../../skills/init-project/SKILL.md)
- [../../scripts/sync.sh](../../scripts/sync.sh)
