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

## Execution plan (for the next session)

Kick off with: **"run the github reconciliation"** and point here.

### Prerequisites

- A **stable session** — the permission-prompt stream must work for
  sandbox-disabled bash (GitHub ops need it).
- `gh auth status` green for `wpots/ai-workflows` with push rights; SSH to
  `git@github.com` working.
- Run GitHub ops with the **sandbox disabled** — `github.com` is not in the
  default network allowlist.

### Decisions (proposed defaults — adjust if needed)

- **End-state:** GitHub `main` = GitLab `main` content **minus** the GitLab-only
  files (`.gitlab-ci.yml`, `docs/repo-divergence.md`).
- **Mechanism:** reconcile **by content** via a branch off `origin/main` + a PR
  on GitHub. No force-push, no re-seed (respects the constraints above).

### Steps

1. `git fetch origin && git fetch gitlab`
2. Compute the delta (sanity-check scope):
   `git diff --stat origin/main gitlab/main -- . ':(exclude).gitlab-ci.yml' ':(exclude)docs/repo-divergence.md'`
3. Branch off GitHub: `git checkout -b chore/sync-github-content origin/main`
4. Bring in GitLab's content for the changed paths, e.g.
   `git checkout gitlab/main -- <changed paths>` — **never** `.gitlab-ci.yml`
   or `docs/repo-divergence.md`.
5. Resolve any content conflicts; preserve genuine GitHub-only bits if any surface.
6. Validate: `node scripts/validate-skills.mjs` (GitHub has no CI, but keep it clean).
7. `git push -u origin chore/sync-github-content`
8. `gh pr create --repo wpots/ai-workflows --base main --title "…" --body "…"`
9. Report the PR URL; merge after review.

### Notes

- The two `main` branches share ancestor `d50e5bf`, so a merge/content-apply
  works; **GitLab → GitHub has no push block** (unlike the reverse).
- The expected content gap is what landed on GitLab after the split: graphify,
  `scripts/validate-skills.mjs` + the skills fixes, the recovered
  `commands/backlog.md` + `skills/backlog/`, and the reconcile content — but
  compute the real delta in step 2, don't assume.

## Migration

No DB migration — tooling/config only.
