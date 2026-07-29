# Chore: Ship a Claude Permissions Baseline in the Project Settings Template

## Status

done

## Priority

medium

## Summary

The Shell Usage doctrine ("write commands that match the allowlist") lives in
the adapters as prose, but synced projects ship no allowlist — every developer
builds their own `permissions.allow` from scratch, and until they do,
autonomous runs stall on approval prompts for commands the doctrine already
sanctions. Ship a curated baseline in `templates/project-claude-settings.json`
so the doctrine is enforced by config on day one.

## User Story

As a developer on a freshly synced project, I want the sanctioned commands
pre-allowed and destructive git gated behind a prompt, so that agent runs are
autonomous by default without weakening safety.

## Acceptance Criteria

- [x] `templates/project-claude-settings.json` gains a `permissions` block:
      `allow` covers the doctrine set (git, glab mr/ci/api/auth, jira,
      npm run/test/ci, npx tsc/jest/eslint/playwright/next/dotenvx,
      `node scripts/*`, `node -e`, and read-only utilities rg/jq/`sed -n`/
      head/tail/cat/ls/echo/wc/`command -v`).
- [x] `ask` explicitly gates destructive git: `push --force` (both flag
      positions), `reset --hard`, `clean` — these prompt even in auto mode.
- [x] The baseline is machine-neutral: no absolute user paths, no personal
      MCP servers, no model or sandbox settings.
- [x] `templates/project-ai-workflows.md` documents the baseline and how a
      project extends it.
- [x] README project-sync sections mention the baseline; the
      never-clobber-existing-settings behavior is unchanged.
- [x] Rule syntax matches a proven working setup (`Bash(git *)` prefix form
      with `ask` overriding `allow` for the force/reset/clean patterns).

## Technical Notes

- Sync only writes `.claude/settings.json` when the project has none
  (`scripts/sync.sh`), so existing projects adopt the baseline by manual
  merge — same path as the graphify hooks.
- `glab *` is deliberately NOT allowed wholesale; only the mr/ci/api/auth
  subcommand families the workflows use. Same reasoning keeps `curl`,
  `docker`, and `python3` out of the baseline — projects add those
  deliberately.
- `echo`/`cat` prefix rules technically match redirections too; the
  no-file-edits-via-Bash doctrine plus Edit/Write tooling covers that seam,
  matching the existing global setup.

## Out of Scope

- A deny list (the migrate:fresh guard already exists as a hook; deny rules
  for secrets tooling can follow if a real incident motivates them).
- Retrofitting existing projects automatically.
- MCP tool allowlists (per-user, not per-project).

## Related

- [../../templates/project-claude-settings.json](../../templates/project-claude-settings.json)
- [../../templates/project-ai-workflows.md](../../templates/project-ai-workflows.md)
- [../../scripts/sync.sh](../../scripts/sync.sh)
