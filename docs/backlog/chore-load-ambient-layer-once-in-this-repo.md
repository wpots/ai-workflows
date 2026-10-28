# Chore: Load the Ambient Layer Once in This Repo

## Status

<!-- draft | ready | in-progress | done -->

done

Filed and delivered 2026-10-28, from a side finding of the skill-listing spike
(audit rank 8).

## Ticket

[Audit 2026-10](../audits/2026-10.md) — roadmap item 8

## Priority

low

## Summary

A session in this repo loads the always-on baseline twice: once as the
installed `~/.claude/rules/ai-workflows.md` and once as the root `CLAUDE.md`
(project instructions). That is 8.5k tokens extra in every session here. Once a
branch edits `CLAUDE.md`, the two copies also disagree. A project setting skips
the installed copy, so only the working tree's `CLAUDE.md` loads.

## User Story

As a contributor to ai-workflows, I want the baseline to load once, from the
working tree, so that a session here carries no duplicate 8.5k tokens and never
holds two versions of the same rules.

## Acceptance Criteria

- `.claude/settings.json` in this repo sets `claudeMdExcludes` to skip
  `~/.claude/rules/ai-workflows.md`.
- `/context` in a session started in this repo (or a worktree of it) lists the
  root `CLAUDE.md` and no longer lists `~/.claude/rules/ai-workflows.md`.
- A session started outside this repo still loads
  `~/.claude/rules/ai-workflows.md`.
- `docs/contributing.md` says why the setting is there.
- `bash scripts/validate-ai-instructions.sh` passes.

## How to verify

`claude -p "/context"` reaches api.anthropic.com, so run it with the sandbox
bypass. It costs no model tokens.

- [ ] In a worktree of `gitlab/main` without the setting:
      `claude -p "/context" --no-session-persistence` lists Memory files at
      28.1k, with both `~/.claude/rules/ai-workflows.md` (8.5k) and the
      worktree's `CLAUDE.md` (8.5k).
- [ ] The same command on this branch lists Memory files at 19.7k, with the
      worktree's `CLAUDE.md` (8.5k) and no `ai-workflows.md`.
- [ ] The same command in a scratch directory outside the repo still lists
      `~/.claude/rules/ai-workflows.md` (8.5k).
- [ ] `bash scripts/validate-ai-instructions.sh` passes.

## Technical Notes

- `claudeMdExcludes` (https://code.claude.com/docs/en/memory, "Exclude
  specific CLAUDE.md files") takes glob patterns matched against absolute
  paths, at any settings layer. A managed `CLAUDE.md` is the only file it
  cannot skip.
- The pattern `**/.claude/rules/ai-workflows.md` matches the user copy. No file
  of that name exists under this repo's own `.claude/rules/`.
- The project copy is the one to keep: it is the version a branch edits, and it
  is what the plugin ships after merge.

## Out of Scope

- The size of the baseline itself (22,022 bytes; about 2 KB of the growth since
  the October trim is the Node pin section). That is input for the next audit.
- Synced client projects: they have no root `CLAUDE.md` with the baseline, so
  they load it once already.

## Related

- [../contributing.md](../contributing.md), Contributor Setup
- [../../.claude/settings.json](../../.claude/settings.json)
- MR: https://gitlab.com/greenberrynl/config/ai-workflows/-/merge_requests/305
