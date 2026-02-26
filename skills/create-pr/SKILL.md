---
name: create-pr
description: Push the current branch and create a pull request (GitHub or GitLab) with a structured description generated from the branch diff.
---

# Create PR Skill

Use this skill when the user asks to create, open, or submit a pull request (or merge request).

## Prerequisites

- The working tree should be clean (all changes committed).
- One of these CLIs must be authenticated:
  - **GitHub**: `gh` (`gh auth status`)
  - **GitLab**: `glab` (`glab auth status`)

## Steps

### 1. Resolve Remote

Determine which remote to target:

1. If the current branch already tracks a remote branch, use that remote.
2. Otherwise, if only one remote exists, use it.
3. If multiple remotes exist and none is tracked, ask the user.

Store the resolved remote name (e.g. `origin`, `upstream`, `fork`) — use it
for all subsequent remote-prefixed operations (`<remote>/main`, `git push -u <remote> HEAD`, etc.).

### 2. Detect Platform

Determine the hosting platform from the resolved remote URL
(`git remote get-url <remote>`):

| Remote URL contains | Platform | CLI    |
|---------------------|----------|--------|
| `github.com`        | GitHub   | `gh`   |
| `gitlab.com` or self-hosted GitLab | GitLab | `glab` |

If the platform cannot be inferred, ask the user.

### 3. Pre-flight Checks

1. Verify the detected CLI is authenticated — abort with a clear message if not.
2. Run `git status` — warn the user if there are uncommitted changes and ask whether to proceed.

### 4. Base Branch Resolution

Use the first existing remote branch in this order:

1. `<remote>/development`
2. `<remote>/main`
3. `<remote>/master`

If none exists, ask the user which base branch to use.

### 5. PR Template

Look for a PR/MR body template in this order:

| Priority | Path | Platform |
|----------|------|----------|
| 1 | `.github/PULL_REQUEST_TEMPLATE.md` | GitHub |
| 1 | `.gitlab/merge_request_templates/Default.md` | GitLab |
| 2 | `.github/PULL_REQUEST_TEMPLATE/*.md` (first file) | GitHub |
| 2 | `.gitlab/merge_request_templates/*.md` (first file) | GitLab |
| 3 | `docs/pull_request_template.md` | Either |
| 4 | `templates/pull_request_template.md` in this repo (ai-workflows) | Fallback |

If a template is found, use its structure as the body skeleton and fill in each
section from the diff analysis. Keep any headings or checkboxes the template
defines.

The bundled fallback template (`templates/pull_request_template.md`) ships with
this repo and is always available as a last resort.

### 6. Generate PR Content

Diff the current branch against the resolved base branch and produce:

- **Title** — concise, 50-72 chars.
- **Summary** — 2-3 sentence overview.
- **Breaking Changes** — migration notes if applicable.
- **Key Modifications** — categorised (Features, Bug Fixes, Refactoring, Chore) with file/component counts.
- **Testing Notes** — required testing steps or affected areas.
- **Technical Notes** — important implementation details (optional).

When a template is present, map these sections into the template's headings
instead of using the defaults above verbatim.

### 7. Push & Create PR

1. Push the branch: `git push -u <remote> HEAD`.
2. Create the PR/MR:

**GitHub:**

```bash
gh pr create \
  --base <resolved-base> \
  --title "<title>" \
  --body "<generated-body>"
```

**GitLab:**

```bash
glab mr create \
  --target-branch <resolved-base> \
  --title "<title>" \
  --description "<generated-body>"
```

3. Output the PR/MR URL on success.

### 8. Error Handling

- If push fails (e.g. no upstream, auth error), surface the error and stop.
- If PR/MR creation fails, show the error. Do not retry automatically.

## Guidelines

- Keep the description concise and scannable.
- Prefer counts and impact summaries over long file lists.
- Confirm the action with the user before pushing if the branch has never been pushed.
