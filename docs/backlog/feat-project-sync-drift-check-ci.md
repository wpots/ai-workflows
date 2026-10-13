# Feature: Catch stale synced assets without a hook (CI / pre-commit)

## Status

<!-- draft | ready | in-progress | done -->

draft

Readiness pass 2026-10-13 — waits for `spike-codex-plugin-channel.md`. The
item was written for Cursor and Codex users, who get no `SessionStart` nudge.
Cursor is out (2026-10-08). If the spike says go, Codex gets a plugin with its
own hooks and this item is likely obsolete: delete it. On a no-go, fix criterion
3 before marking it `ready`: the stamp is a `cksum` over files a project does
not have (the adapter templates, `scripts/sync.sh`,
`scripts/project-sync-freshness.sh`; see `source_digest()`), so the stamp plus
the project's own files can never show drift. Every run needs the source. A
client pipeline that fetches the private ai-workflows repo also needs its
project on the CI/CD job token allowlist of ai-workflows, a GitLab setting the
maintainer changes.

## Ticket

<!-- no tracker ticket: this repo's own backlog -->

## Slice

2/2 — the tool-independent half

## Priority

medium

## Summary

The session-start nudge only reaches Claude Code. Cursor and Codex users get
shared assets through `scripts/sync.sh` alone, with no hook to remind them — so
the same staleness has to be catchable from the repo itself.

## User Story

As a team using more than one AI tool, we want stale shared assets to surface in
a project's own checks, so that being current does not depend on which editor
someone opened.

## Acceptance Criteria

- [ ] A check reads the project's sync stamp (slice 1/2) and reports how the
      synced assets compare to a reference: current, stale, or unknown.
- [ ] It runs in **two places** and shares one implementation: a project
      pre-commit hook (opt-in, installed the way `scripts/install-hooks.sh` does
      it here) and a CI job snippet the templates can ship.
- [ ] The reference is resolvable **without a clone**: the pinned digest in the
      stamp plus the assets present in the project are enough to detect that the
      two disagree; where a fresh reference is needed, the job clones this repo
      at `main` itself.
- [ ] Warn, do not fail, by default — a stale rule file must not block a hotfix.
      Failing is opt-in per project.
- [ ] Documented in `docs/keep-current.md` with what each surface catches, and in
      `docs/troubleshooting.md` as symptom → fix.

## How to verify

<!-- filled in by whoever delivers this -->

## Technical Notes

- Depends entirely on the stamp from slice 1/2; do not start before that lands.
- Prefer one script in this repo that both the hook and the CI job call, synced
  into projects like any other shared asset — two implementations of the same
  check drift within a sprint.
- Keep the CI job cheap: no npm install, no full clone when the stamp alone
  answers the question.

## Out of Scope

- Auto-syncing in CI (a pipeline that rewrites the branch is worse than a stale
  rule file).
- Anything Claude-specific — that half is slice 1/2.

## Related

Depends on: spike-codex-plugin-channel.md

- [spike-codex-plugin-channel.md](spike-codex-plugin-channel.md) — decides
  whether Codex gets hooks, which may make this item obsolete
- The freshness stamp (slice 1/2) — delivered in 2.0.0 and merged
  via https://gitlab.com/greenberrynl/config/ai-workflows/-/merge_requests/93,
  so this slice is unblocked
- Precedent: `scripts/install-hooks.sh` and the repo's own
  `validate-ai-instructions.sh` running in both pre-commit and CI
