# Create Pull Request

This runbook is the compatibility and fallback surface for the canonical
`create-pr` skill.

Preferred path:

1. If the current tool supports skills reliably, use
   `skills/create-pr/SKILL.md` as the primary workflow.
2. Use this runbook for prompt-first tools such as Copilot, or when the skill
   path is unavailable.

Push the current branch and open a pull request (GitHub) or merge request
(GitLab) with a structured description.

## Remote Resolution

Determine which remote to target:

1. If the current branch tracks a remote, use that remote.
2. If only one remote exists, use it.
3. If multiple untracked remotes exist, ask the user.

Use the resolved remote name (`<remote>`) for all subsequent operations.

## Platform Detection

Detect the platform from `git remote get-url <remote>`:

- **GitHub** (`github.com`) — use `gh` CLI.
- **GitLab** (`gitlab.com` or self-hosted) — use `glab` CLI.

If ambiguous, ask the user.

## Pre-flight

1. Verify the CLI is authenticated (`gh auth status` / `glab auth status`). Abort if not.
2. Check `git status` for uncommitted changes — warn and ask before continuing.
3. Check whether the diff is primarily a shared AI workflow change.
   - If `AI-WORKFLOWS.md` exists, use its `Shared Workflow Assets` section as the source of truth.
   - If it does not exist, treat synced workflow surfaces such as `commands/`,
     `rules/`, `.github/prompts/`, and thin adapter files as shared workflow files.
4. If the diff is primarily a reusable shared workflow change and the current repo is a synced target rather than the canonical `ai-workflows` repo, pause and tell the user this likely belongs in the [ai-workflows](https://github.com/wpots/ai-workflows) repo. Ask whether to:
   - create the PR from this repo anyway
   - upstream the change in `ai-workflows` instead
   - do both

## Base Branch Resolution

Resolve in this order and use the first branch that exists:

1. `<remote>/development`
2. `<remote>/main`
3. `<remote>/master`

If none exist, stop and ask the user which base branch to use.

## PR Template

Look for a body template in this order:

1. `.github/PULL_REQUEST_TEMPLATE.md` (GitHub) or `.gitlab/merge_request_templates/Default.md` (GitLab)
2. First file in `.github/PULL_REQUEST_TEMPLATE/` or `.gitlab/merge_request_templates/`
3. `docs/pull_request_template.md`
4. `templates/pull_request_template.md` from this repo (bundled fallback)

If found, use its structure and fill in sections from the diff. If not, use the default structure below.

## Fallback PR Description (default)

Analyse the diff against the base branch and generate:

- **Title**: Concise, descriptive (50-72 chars)
- **Summary**: High-level overview (2-3 sentences)
- **Breaking Changes**: Include migration notes if applicable
- **Key Modifications**:
  - Categorise by type (Features, Bug Fixes, Refactoring, Chore)
  - Focus on significant changes
  - Include file/component counts per category
- **Testing Notes**: Required testing steps or affected areas
- **Technical Notes**: Important implementation details (optional)

## Rebase onto Base (keep the PR/MR mergeable)

A PR/MR must always be mergeable, so rebase onto the latest base before
pushing — the base branch will usually have moved since the feature branch
was created.

1. `git fetch <remote> <base>`
2. `git rev-list --left-right --count <remote>/<base>...HEAD` — if the left
   side is `0`, the branch is up to date; skip to push.
3. `git rebase <remote>/<base>`. On conflicts, stop and report them; do not
   force a resolution.
4. Re-run project checks after the rebase (or rely on the pre-push hook).

Applies on every run, including updates to an existing PR/MR.

> **Sustainable IT.** This pre-push run is the single full checks sweep for the
> branch — don't duplicate it mid-task. While building, use targeted scopes and
> avoid re-running checks that already passed on unchanged files (see the
> `run-checks` runbook's "Sustainable verification").

## Fallback Execution

1. Push the branch:
   - First push: `git push -u <remote> HEAD`
   - After a rebase rewrote history: `git push --force-with-lease <remote> HEAD`
2. Create the PR/MR:
   - GitHub: `gh pr create --base <base> --title "<title>" --body "<body>"`
   - GitLab: `glab mr create --target-branch <base> --title "<title>" --description "<body>"`
3. Output the PR/MR URL on success.

## Guidelines

- Keep the description concise and scannable.
- Use counts, not long file lists.
- Highlight user-facing changes and architecture decisions.
- If push or PR/MR creation fails, surface the error and stop.
