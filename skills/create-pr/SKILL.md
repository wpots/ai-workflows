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

### 1. Detect Platform

Determine the hosting platform from the `origin` remote URL:

| Remote URL contains | Platform | CLI    |
|---------------------|----------|--------|
| `github.com`        | GitHub   | `gh`   |
| `gitlab.com` or self-hosted GitLab | GitLab | `glab` |

If the platform cannot be inferred, ask the user.

### 2. Pre-flight Checks

1. Verify the detected CLI is authenticated — abort with a clear message if not.
2. Run `git status` — warn the user if there are uncommitted changes and ask whether to proceed.

### 3. Base Branch Resolution

Use the first existing remote branch in this order:

1. `origin/development`
2. `origin/main`
3. `origin/master`

If none exists, ask the user which base branch to use.

### 4. PR Template

Look for a PR/MR body template in this order:

| Priority | Path | Platform |
|----------|------|----------|
| 1 | `.github/PULL_REQUEST_TEMPLATE.md` | GitHub |
| 1 | `.gitlab/merge_request_templates/Default.md` | GitLab |
| 2 | `.github/PULL_REQUEST_TEMPLATE/*.md` (first file) | GitHub |
| 2 | `.gitlab/merge_request_templates/*.md` (first file) | GitLab |
| 3 | `docs/pull_request_template.md` | Either |

If a template is found, use its structure as the body skeleton and fill in each
section from the diff analysis. Keep any headings or checkboxes the template
defines.

If no template is found, use the default structure below.

### 5. Generate PR Content

Diff the current branch against the resolved base branch and produce:

- **Title** — concise, 50-72 chars.
- **Summary** — 2-3 sentence overview.
- **Breaking Changes** — migration notes if applicable.
- **Key Modifications** — categorised (Features, Bug Fixes, Refactoring, Chore) with file/component counts.
- **Testing Notes** — required testing steps or affected areas.
- **Technical Notes** — important implementation details (optional).

When a template is present, map these sections into the template's headings
instead of using the defaults above verbatim.

### 6. Push & Create PR

1. Push the branch: `git push -u origin HEAD`.
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

### 7. Error Handling

- If push fails (e.g. no upstream, auth error), surface the error and stop.
- If PR/MR creation fails, show the error. Do not retry automatically.

## Guidelines

- Keep the description concise and scannable.
- Prefer counts and impact summaries over long file lists.
- Confirm the action with the user before pushing if the branch has never been pushed.
