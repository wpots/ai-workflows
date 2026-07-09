---
name: create-pr
description: Push the current branch and create a pull request (GitHub or GitLab) with a structured description generated from the branch diff.
---

# Create PR Skill

Use this skill when the user asks to create, open, or submit a pull request (or merge request).

This skill is the canonical workflow source for create-pr on skill-aware tools.
The matching command runbook is a compatibility and fallback surface.

## Prerequisites

- The working tree should be clean (all changes committed).
- Preferably one of these CLIs is authenticated:
  - **GitHub**: `gh` (`gh auth status`)
  - **GitLab**: `glab` (`glab auth status`)
  - Without a CLI the skill still works via the fallbacks in step 8
    (GitLab push options / prefilled URLs).
- If the branch lives in a **git worktree**, the commit/push hooks and the test
  runner may not work there unmodified — see the Worktree caveat in step 7.

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

1. **Refuse to run from a long-lived branch.** If the current branch is
   `main`, `master`, `development`, or `acceptance` (or equals the resolved
   base from step 4), stop and tell the user to switch to a feature branch —
   a PR/MR must come from a feature branch.
2. Verify the detected CLI is authenticated. On GitLab this is not fatal —
   fall back to the push-options path in step 7. On GitHub without `gh`,
   fall back to the prefilled compare URL in step 7.
3. Run `git status` — warn the user if there are uncommitted changes and ask whether to proceed.
4. Check whether the diff is primarily a shared AI workflow change.
   - If `AI-WORKFLOWS.md` exists, use its `Shared Workflow Assets` section as the source of truth.
   - If it does not exist, treat synced workflow surfaces such as `commands/`,
     `rules/`, `.github/prompts/`, and thin adapter files as shared workflow files.
5. If the diff is primarily a reusable shared workflow change and the current repo is a synced target rather than the canonical `ai-workflows` repo, pause and tell the user this likely belongs in `~/Web/ai-workflows/`. Ask whether to:
   - create the PR from this repo anyway
   - upstream the change in `ai-workflows` instead
   - do both

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

**Ticket link.** Extract a tracker ticket from the branch name with the regex
`^([A-Z]+-[0-9]+)` (e.g. `EZODKO-317-diverge-model` → `EZODKO-317`). Resolve
the tracker base URL from project config — a project-local skill's "Project
facts" block, `AI-WORKFLOWS.md`, or the project `CLAUDE.md` (e.g.
`https://<org>.atlassian.net/browse/`). When both are found, prefix the title
with `<TICKET>: ` and open the description with a linked ticket section:

```markdown
## Jira

[<TICKET>](<tracker-base>/<TICKET>)
```

If the branch has no ticket or no tracker base URL is configured, omit the
section — do not guess a URL.

Diff the current branch against the resolved base branch and produce:

- **Title** — concise, 50-72 chars.
- **Summary** — 2-3 sentence overview.
- **Breaking Changes** — migration notes if applicable.
- **Key Modifications** — categorised (Features, Bug Fixes, Refactoring, Chore) with file/component counts.
- **Testing Notes** — required testing steps or affected areas.
- **Technical Notes** — important implementation details (optional).

When a template is present, map these sections into the template's headings
instead of using the defaults above verbatim.

### 7. Rebase onto Base, then Push & Create PR

A PR/MR must **always be mergeable**. Before pushing — on both first creation
and every later update — rebase the branch onto the latest base so the branch
is a clean fast-forward with no merge conflicts:

```bash
git fetch <remote> <resolved-base>
git rebase <remote>/<resolved-base>
```

If the rebase produces conflicts, resolve them (or stop and ask the user), then
re-run the project checks before continuing. A rebase rewrites history, so the
push must use `--force-with-lease`.

> **Worktree caveat.** If the branch is checked out in a git worktree
> (`git worktree list` shows it under e.g. `.worktrees/<name>`), the
> commit/push hooks and the test runner usually do **not** work there
> unmodified, so verify manually before pushing:
>
> - A fresh worktree has **no `node_modules`** of its own, so hooks and
>   `npm test` that resolve `./node_modules/…` fail. Provide them first —
>   symlink the main checkout (`ln -s ../../node_modules node_modules`) or run
>   `npm ci` in the worktree.
> - Test runners often **ignore `.worktrees/`** (e.g. jest
>   `testPathIgnorePatterns` / `modulePathIgnorePatterns`), so a normal run finds
>   **0 tests**. Override those patterns when running natively from the worktree,
>   e.g. `npm test -- --testPathIgnorePatterns=/node_modules/ --modulePathIgnorePatterns=/__none__/ --coverage=false`.
>
> Run `lint` + `type-check` + `test` **manually** to confirm green, then push
> with `--no-verify`. Skip only the hook that cannot execute — never the checks
> themselves.

1. **Show the base branch, title, and description to the user and get
   approval before pushing** — pushing is outward-facing. Skip the ask only
   when the user already said to proceed without asking.
2. Push the branch (add `--no-verify` when pushing from a worktree, per the
   caveat above):
   - First push (no upstream yet): `git push -u <remote> HEAD`.
   - After any rebase: `git push --force-with-lease`.
3. Create the PR/MR:

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

4. Output the PR/MR URL on success.

### 8. Fallbacks When the CLI Is Unavailable

Degrade in this order instead of aborting:

**GitLab — push options** (no CLI or token needed). GitLab creates the MR as
part of the push itself. Build the title/description as shell variables so
newlines survive:

```bash
git push -u <remote> HEAD \
  -o merge_request.create \
  -o merge_request.target=<resolved-base> \
  -o merge_request.remove_source_branch \
  -o merge_request.title="$TITLE" \
  -o merge_request.description="$DESCRIPTION"
```

GitLab prints the MR URL in the push output — surface it. If an MR already
exists for the branch, `merge_request.create` is a no-op and GitLab says so;
report that instead of erroring.

**GitLab — prefilled URL** (branch already fully pushed). GitLab ignores push
options when the push transfers no refs, so build a prefilled new-MR URL
instead and give it to the user to open (URL-encode title and description —
spaces → `%20`, newlines → `%0A`):

```text
<web-base>/-/merge_requests/new?merge_request[source_branch]=<branch>&merge_request[target_branch]=<resolved-base>&merge_request[title]=<encoded>&merge_request[description]=<encoded>
```

`<web-base>` is the `origin` URL with a trailing `.git` stripped.

**GitHub — prefilled compare URL** (no `gh`). Push normally, then hand the
user a prefilled URL:

```text
https://github.com/<org>/<repo>/compare/<resolved-base>...<branch>?expand=1&title=<encoded>&body=<encoded>
```

In every fallback case, report what the user still has to do — do not claim
the PR/MR is created unless the platform's output confirmed it.

### 9. Error Handling

- If push fails (e.g. no upstream, auth error), surface the error and stop.
- If PR/MR creation fails, show the error. Do not retry automatically.

## Guidelines

- Write the PR/MR title and description in the repository's working language —
  follow the template's language and the repo's existing PRs/MRs, not the
  language you happen to be chatting in.
- Keep the description concise and scannable.
- Prefer counts and impact summaries over long file lists.
- Always show the base branch, title, and description for approval before
  pushing, unless the user already said to proceed without asking.
- Always keep the PR/MR mergeable: rebase onto the latest base before every
  push (create or update), never let the branch drift behind base.
