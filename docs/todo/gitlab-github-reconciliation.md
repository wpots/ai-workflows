# TODO: Reconcile GitHub `origin/main` with GitLab `main`

## Context

GitLab `main` (`greenberrynl/config/ai-workflows`) is now the reconciled,
leading branch: full workflow content + `.gitlab-ci.yml` + graphify +
validate-skills fixes. GitHub `origin/main` (`wpots/ai-workflows`) is **behind**
— it lacks the reconcile merge, graphify, and the fixes.

Per `docs/repo-divergence.md`, GitLab is the default/collaboration remote and
GitHub is a secondary mirror, brought level when we choose to.

## Goal

Bring GitHub `origin/main` content-level with GitLab `main`, without losing
GitHub-lineage history and respecting the constraints below.

## Current state

- Shared ancestor: `d50e5bf`.
- GitLab `main` leads on content (reconcile + graphify + fixes).
- `.gitlab-ci.yml` is **GitLab-only** — do **not** push it to GitHub.
- `docs/repo-divergence.md` is **GitLab-only** — exclude from any GitHub sync.

## Constraints

- GitLab `main` is protected + enforces a committer-email rule (rejects
  `*.noreply.github.com`). This blocks GitHub→GitLab replay; the reverse
  (GitLab→GitHub) has no such block.
- Reconcile **by content via a branch + PR**, never force-push / re-seed.

## Approach (proposed)

1. From GitLab `main`, build a branch that **excludes** the GitLab-only files
   (`.gitlab-ci.yml`, `docs/repo-divergence.md`).
2. Push it to GitHub, open a PR against `origin/main`, reconcile content conflicts.
3. After merge, GitHub and GitLab are content-level (minus the deliberately
   GitLab-only files).
4. Going forward, follow `docs/repo-divergence.md`: GitLab by default, GitHub on
   explicit request.

## Migration

No DB migration — tooling/config only.
