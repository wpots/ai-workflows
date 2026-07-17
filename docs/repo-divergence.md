# Repository Divergence & Upstream Policy

> **This file lives only on GitLab** (`greenberrynl/config/ai-workflows`), the
> collaboration remote. It is intentionally **not** mirrored to the GitHub
> personal remote — exclude it from any GitHub sync. It is the single source of
> truth for *where* shared changes go and *what* belongs in which remote, so a
> divergence question is decided once here instead of re-litigated every time.

## Remotes

| Remote | Repo | Role |
|---|---|---|
| `gitlab` | `greenberrynl/config/ai-workflows` | **Collaboration remote & default upstream.** Team-facing; `main` is protected. |
| `origin` (GitHub) | `wpots/ai-workflows` | Personal remote / secondary mirror. |

## Default upstream rule

- Shared-workflow changes upstream to **GitLab by default** — open the MR on GitLab.
- Push to **GitHub only when explicitly requested.** Do **not** dual-push by reflex.
- This **replaces** the older "both remotes must receive every change" convention.

## What belongs where

| Scope | Files | Notes |
|---|---|---|
| GitLab-only | `.gitlab-ci.yml`, `docs/repo-divergence.md` (this file) | CI + collab-specific config; never mirrored to GitHub. |
| GitHub-only | — | none currently |
| Shared | everything else — `rules/`, `skills/`, `commands/`, `shared/`, `templates/`, adapters, `docs/` (except this file) | goes to GitLab by default; to GitHub only on explicit request. |

## History & reconciliation

- The two `main` branches **do share a common ancestor** (`d50e5bf`). Earlier
  notes claiming "no common ancestor / cannot be unified" are **outdated** —
  GitLab `main` was reconciled up to GitHub's content via that ancestor.
- Hard constraints on the **GitHub → GitLab** direction: GitLab `main` is a
  **protected branch** and enforces a **committer-email rule** that rejects
  `*.noreply.github.com` identities. GitHub history cannot be replayed wholesale
  onto GitLab — reconcile **by content via a branch + MR**, never by force-push
  or re-seed. The reverse direction (GitLab → GitHub) has no such block.
- Open reconciliation work is tracked in
  `docs/todo/gitlab-github-reconciliation.md`.

## When you hit a divergence question

Consult this file first. If it doesn't cover the case, decide, then **record the
decision here** so the next person doesn't have to decide it again.
