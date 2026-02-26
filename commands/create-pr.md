# Create Pull Request

Push the current branch and open a pull request (GitHub) or merge request (GitLab) with a structured description.

## Platform Detection

Detect the platform from the `origin` remote URL:

- **GitHub** (`github.com`) — use `gh` CLI.
- **GitLab** (`gitlab.com` or self-hosted) — use `glab` CLI.

If ambiguous, ask the user.

## Pre-flight

1. Verify the CLI is authenticated (`gh auth status` / `glab auth status`). Abort if not.
2. Check `git status` for uncommitted changes — warn and ask before continuing.

## Base Branch Resolution

Resolve in this order and use the first branch that exists:

1. `origin/development`
2. `origin/main`
3. `origin/master`

If none exist, stop and ask the user which base branch to use.

## PR Template

Look for a body template in this order:

1. `.github/PULL_REQUEST_TEMPLATE.md` (GitHub) or `.gitlab/merge_request_templates/Default.md` (GitLab)
2. First file in `.github/PULL_REQUEST_TEMPLATE/` or `.gitlab/merge_request_templates/`
3. `docs/pull_request_template.md`

If found, use its structure and fill in sections from the diff. If not, use the default structure below.

## PR Description (default)

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

## Execution

1. Push the branch: `git push -u origin HEAD`
2. Create the PR/MR:
   - GitHub: `gh pr create --base <base> --title "<title>" --body "<body>"`
   - GitLab: `glab mr create --target-branch <base> --title "<title>" --description "<body>"`
3. Output the PR/MR URL on success.

## Guidelines

- Keep the description concise and scannable.
- Use counts, not long file lists.
- Highlight user-facing changes and architecture decisions.
- If push or PR/MR creation fails, surface the error and stop.
