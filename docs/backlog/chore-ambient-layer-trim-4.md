# Chore: Trim the Ambient Layer Back Below Its October Size

## Status

<!-- draft | ready | in-progress | done -->

done

Filed and delivered 2026-10-28 on the maintainer's go, after the skill-listing
spike (!304) measured the baseline at 22,022 bytes and 8.5k tokens.

## Ticket

[Audit 2026-10](../audits/2026-10.md) — roadmap item 8

## Priority

low

## Summary

The October trim (!166, !167, !168) took `CLAUDE.md` to 18,866 bytes; the Node
pin rules, the sandbox git traps and the CLI-first rule brought it back to
22,022. The baseline loads into every session of every teammate. This trim
keeps every rule and cuts words. It leaves alone the skill mapping table,
which the spike showed to be the only routing text for skills the listing
shows by name only.

## User Story

As a teammate, I want the always-on baseline to cost less context in every
session, without losing a rule, so that the rules that matter get followed and
the session has more room for the work.

## Acceptance Criteria

- `/context` in a worktree of this branch lists `CLAUDE.md` at fewer tokens
  than the 8.5k of the installed 2.14.3 copy.
- No rule is dropped: every instruction in the Node pin, git in the sandbox,
  CLI-first and graphify sections is still there, in fewer words.
- Maintainer-only notes (how the file is installed, the mapping table's line
  format, why the graphify skill is not shipped) sit in block-level HTML
  comments, which Claude Code strips before loading.
- The skill mapping rows keep every trigger. The one row note that contradicts
  its skill (`upstream-to-unicore`, "v3 or v4 chosen per change") is corrected.
- The heading "Node and npm: the version the project pins" stays, because the
  install hook's deny message names it.
- The line "Use this setup as a universal Claude Code baseline across
  projects." stays, because `scripts/sync-ambient.sh` uses it to recognise
  copies from earlier syncs.
- A changelog fragment; `CHANGELOG.md` and the plugin version untouched.
- `bash scripts/validate-ai-instructions.sh` passes.

## How to verify

`claude -p "/context"` reaches api.anthropic.com, so run it with the sandbox
bypass. It costs no model tokens.

- [x] `wc -c CLAUDE.md`: 22,022 bytes on `gitlab/main` (`c29f802`), 19,429 on
      this branch, of which about 1 KB is HTML comments.
- [x] In a worktree of this branch, `claude -p "/context"
      --no-session-persistence` lists `CLAUDE.md` at **7.2k** tokens (Memory
      files 18.4k). In a scratch directory outside the repo, the installed
      2.14.3 copy, `~/.claude/rules/ai-workflows.md`, is 8.5k.
- [x] Comment stripping, measured: two scratch directories with the same 3 KB
      of text in a `CLAUDE.md`, plain and inside `<!-- -->`, list at 818 and 18
      tokens.
- [x] `rg -c "Node and npm: the version the project pins" CLAUDE.md` is 1, and
      `python3 scripts/test_pinned_install_runtime.py` passes.
- [x] `bash scripts/validate-ai-instructions.sh` passes (the pre-commit hook on
      the delivery commit); `generate-adapters.sh` leaves no drift.

## Technical Notes

- Claude Code docs (https://code.claude.com/docs/en/memory): "Block-level HTML
  comments (`<!-- maintainer notes -->`) in CLAUDE.md files are stripped before
  the content is injected into Claude's context." The same page sets a target
  of under 200 lines per `CLAUDE.md`: "Longer files consume more context and
  reduce adherence." The `<!-- BEGIN SHARED:… -->` markers were already free.
- What was cut, per section:
  - Loading Model folds into Purpose; the install facts become a comment.
  - Node pin: drops the lockfile-flag detail, the allowlist-template note and
    the approval-prompt note; the install hook's deny message names the pinned
    command when it matters.
  - Git in the sandbox: same three traps and fixes; the error strings are cut
    to the part to recognise, and the aside that `git branch -d` warns but
    still deletes is gone.
  - CLI-first: the connector-only list becomes one sentence; the hook names the
    CLI command on a denied call.
  - Graphify: the fragment says the same in fewer words. Synced projects also
    get the rule at the point of use from the graphify hooks in
    `templates/project-claude-settings.json`.
- What stays as it was, and why:
  - The skill mapping (8.8 KB, 45% of the file) is the routing text for skills
    listed by name only (!304).
  - Autonomy (2.4 KB) and Safety (1.3 KB) are hard rules that every Bash call
    and every process kill depends on.

## Out of Scope

- The skill mapping rows themselves, beyond the stale `upstream-to-unicore`
  note.
- `rules/project.md` (3.5k tokens) and `rules/clean-architecture.md` (2k), the
  other ambient files.
- Removing the graphify section from the ambient layer: that is an adoption
  decision, not a trim.

## Related

- [../../CLAUDE.md](../../CLAUDE.md)
- [../../shared/graphify.md](../../shared/graphify.md)
- [../../shared/skill-mappings.md](../../shared/skill-mappings.md)
- [chore-load-ambient-layer-once-in-this-repo.md](chore-load-ambient-layer-once-in-this-repo.md)
