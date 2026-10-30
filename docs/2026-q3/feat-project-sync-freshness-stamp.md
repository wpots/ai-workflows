# Feature: Tell a project when its synced assets are stale

## Status

<!-- draft | ready | in-progress | done -->

done

## Ticket

<!-- no tracker ticket: this repo's own backlog -->

## Slice

1/2 — the stamp and the Claude-side nudge

## Priority

high

## Summary

`scripts/sync.sh --project` leaves no trace of *what* it synced, so nothing —
not a developer, not a hook, not CI — can tell whether a project's `rules/`,
`commands/`, and generated adapters are current. Land a digest stamp, and use it
to nudge at session start.

## User Story

As a developer working in a synced project, I want to be told when the shared
assets in it are behind the plugin, so that I stop reading last month's rules
without knowing it.

## Acceptance Criteria

- [x] `scripts/sync.sh --project <path>` writes a stamp file into the project
      containing a digest of the asset set it just wrote (same `cksum`-of-source
      approach as `scripts/sync-ambient.sh`, not a version number — an unbumped
      release must still change the digest).
- [x] The stamp is **tracked in git** so drift is visible in review and CI can
      read it (slice 2/2).
- [x] A `SessionStart` hook shipped via `templates/project-claude-settings.json`
      compares the project's stamp against the same digest computed from
      `$CLAUDE_PLUGIN_ROOT`, and on a mismatch emits one note naming the command
      that fixes it.
- [x] The note fires **once per distinct mismatch**, not once per session (a
      stamp in `$CLAUDE_PLUGIN_DATA`, as the ambient hook does for its warning).
- [x] The hook **never writes into the project working tree** — a generated-file
      rewrite mid-branch is diff noise the developer did not ask for.
- [x] The fix path works **without a local clone of this repo**: the plugin cache
      holds the whole repo, so `"$CLAUDE_PLUGIN_ROOT"/scripts/sync.sh --project .`
      is a complete instruction.
- [x] A project with no stamp (never synced, or synced before this lands) is
      reported as "unknown", not as stale.
- [x] Smoke tests in `scripts/smoke-test-project-sync.sh`: stamp written, stamp
      unchanged on a re-sync with identical content, mismatch detected, missing
      stamp tolerated, malformed stamp tolerated.

## How to verify

- `bash scripts/validate-ai-instructions.sh` — runs
  `scripts/smoke-test-project-sync.sh`, which now covers all eight freshness
  scenarios: stamp written and equal to `--digest` output, stamp unchanged on
  an identical re-sync, matching stamp keeps the hook silent, mismatch
  detected with the fix command named in valid hook JSON, note fires once per
  distinct mismatch, missing stamp reported as unknown (not stale), malformed
  stamp tolerated, and no writes into the project tree.
- Manual spot check: `bash scripts/sync.sh --project <scratch-dir>` writes
  `<scratch-dir>/.claude/ai-workflows-stamp`; corrupt it, then
  `CLAUDE_PROJECT_DIR=<scratch-dir> CLAUDE_PLUGIN_ROOT=$PWD CLAUDE_PLUGIN_DATA=$(mktemp -d) bash scripts/project-sync-freshness.sh --hook`
  emits one SessionStart note naming
  `bash '<repo>/scripts/sync.sh' --project .` — and stays silent when run
  again with the same data dir.

## Technical Notes

- Model to copy: `scripts/sync-ambient.sh` — `source_digest()`, the stamp in
  `$CLAUDE_PLUGIN_DATA`, and the "act once per distinct source state" gate. The
  reasoning for digest-over-version is in the comment block there and applies
  unchanged.
- Stamp location: prefer `.claude/ai-workflows-stamp` (a place sync already
  owns). Decide with the reviewer whether it is tracked — slice 2/2 depends on
  it being tracked.
- The digest must cover exactly what project sync writes: `rules/`, `commands/`,
  `.github/prompts/`, the generated adapters, and the graphify/settings guards.
  `CONVENTIONS.md` is project-owned and must stay out of it.
- Keep the check offline. No `git ls-remote`, no marketplace call: session start
  is not the place for network latency.

## Out of Scope

- Auto-applying the sync (explicitly rejected above).
- Non-Claude tools: Cursor and Codex have no hook, so they are covered by the CI
  check in slice 2/2.
- The plugin-freshness checks themselves (`autoUpdate`, cache age) — delivered.

## Related

- Depends on: nothing
- Followed by: `docs/backlog/feat-project-sync-drift-check-ci.md`
- Precedent: `scripts/sync-ambient.sh` (digest gate + advisory note)
- MR: https://gitlab.com/greenberrynl/config/ai-workflows/-/merge_requests/93
