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

1. Refuse to run from `main`, `master`, `development`, or `acceptance` (or the
   resolved base) — PRs/MRs come from feature branches only.
2. Verify the CLI is authenticated (`gh auth status` / `glab auth status`).
   If not, use the no-CLI fallbacks under Fallback Execution instead of aborting.
3. Check `git status` for uncommitted changes — warn and ask before continuing.
   When the tree mixes unrelated work with the change to ship, carve it out:
   `git stash push -u -m "<what>" -- <paths>`, then
   `git switch -c <branch> --no-track <remote>/<base>`, then `git stash pop`
   and stage by path — never `git add -A` or `git commit -a`. Use `switch`, not
   `git checkout -b <new> <remote>/<base>`: where the shell is sandboxed the
   latter cannot write `.git/config`, exits 1 after creating the branch and
   leaves you on the old one, so confirm with `git branch --show-current`
   before staging.
   If the user wants the work split across **several** MRs, settle three things
   with them first, because each changes every branch you create: stacked (each
   branch targets the previous) or independent (each targets the base — nicer to
   review, but conflicts on merge wherever two MRs touch the same file, so name
   those files); what happens to commits already on the branch that aren't part
   of this work; and which ticket key(s) the branches carry. Then snapshot the
   whole tree on a throwaway local branch first and build each MR branch off the
   base with `git checkout <snapshot> -- <paths>`, so nothing can be lost. For a
   file whose hunks span two MRs, take the whole file and hand-revert the hunks
   belonging elsewhere. Measure each branch on its own — a branch may not build
   without a fix that lives in another MR, so cherry-pick that commit onto a
   throwaway branch for the measurement and state which combination produced the
   number. Before reporting, merge every new branch into a scratch branch off
   the base and diff it against the snapshot: an empty diff proves nothing was
   lost.
4. If the repository has eval cases tagged `routing` under `evals/` and the
   diff adds a skill, changes a skill's `name`, `description` or `when_to_use`,
   or changes a routing case, follow "Before a skill MR" in `evals/README.md`
   (trigger test, command, result line). Stop on a failing case until it passes
   or the user accepts it; put the result line, or `not run — <reason>`, in the
   description. Otherwise this does nothing.
5. Check whether the diff is primarily a shared AI workflow change.
   - If `AI-WORKFLOWS.md` exists, use its `Shared Workflow Assets` section as the source of truth.
   - If it does not exist, treat synced workflow surfaces such as `commands/`,
     `rules/`, `.github/prompts/`, and thin adapter files as shared workflow files.
6. If the diff is primarily a reusable shared workflow change and the current repo is a synced target rather than the canonical `ai-workflows` repo, pause and tell the user this likely belongs in the [ai-workflows](https://gitlab.com/greenberrynl/config/ai-workflows) repo. Ask whether to:
   - create the PR from this repo anyway
   - upstream the change in `ai-workflows` instead
   - do both

## Self-review

Run `commands/review-code.md` once over `<remote>/<base>...HEAD`, before the
first push. Its Architecture Conformance Pass covers the stack rule's
Definition of Done.

- A `[correctness]` or `[security]` finding stops the flow: one at a time,
  continue only once it is fixed or the user waives it explicitly. A waived
  finding goes into the description with the user's reason.
- Any other finding never stops the flow: list it with its `file:line` in the
  description and in the recap's `Open items` row.
- No lint, type-check, test or build here; the pre-push sweep stays the only
  one.
- Skip it when `commands/work-backlog.md` reviewed the branch in its step 7
  during this session and the only commits since close out its backlog item;
  say so in the recap.

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

The template's headings stay the skeleton even when another runbook layers
description content on top (e.g. `commands/work-backlog.md`'s BLI link and
`How to verify` steps): map that content into the template's sections, never
into invented top-level headings beside them.

## Fallback PR Description (default)

Ticket link: extract `^([A-Z]+-[0-9]+)` from the branch name; if a tracker
base URL is configured in project config (project-local skill facts,
`AI-WORKFLOWS.md`, project `CLAUDE.md`), prefix the title with `<TICKET>: `
and open the body with a `## Jira` section linking the ticket. Omit when
either is missing — never guess a URL. Name no other ticket by key in the
title, description or commits: the GitLab–Jira integration can move every
named ticket to In Progress; refer to other tickets by title.

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

1. Show base branch, title, and description and get approval before pushing
   (skip only if the user already said to proceed without asking).
2. Push the branch:
   - First push: `git push -u <remote> HEAD`
   - After a rebase rewrote history: `git push --force-with-lease <remote> HEAD`
3. Create the PR/MR:
   - GitHub: `gh pr create --base <base> --title "<title>" --body "<body>" --label "ai:agent-authored"`
   - GitLab: `glab mr create --target-branch <base> --title "<title>" --description "<body>" --label "ai:agent-authored"`
   - The `ai:agent-authored` label is the only provenance signal that survives
     a squash merge. GitLab creates a missing label on the fly; GitHub needs
     `gh label create "ai:agent-authored" --color 6f42c1` once if `gh` rejects
     it. If labelling still fails, create the PR/MR without it and say so.
   - Long bodies: don't pass them inline (quoting breaks, oversized arguments
     can crash agent permission flows). GitHub: use `--body-file <file>`.
     GitLab has **no** equivalent on `mr create` — no `--description-file`, no
     `--body-file`, no `-F`, only `-d/--description` taking a string. Do not
     reason by analogy from GitHub's `--body-file`: guessing it fails with
     `Unknown flag: --description-file`. Create the MR in one API call with the
     body read from a file instead:
     `glab api "projects/<encoded-path>/merge_requests" --method POST --field "source_branch=<branch>" --field "target_branch=<base>" --field "title=<title>" --field "description=@<file>" --field "labels=ai:agent-authored" --field "remove_source_branch=true"`.
     Carry `labels` in that call — it is a plain field on the API path, and
     leaving it out ships the MR without the provenance label.
     This also sidesteps `glab mr create`'s cwd dependency: it resolves repo
     context from the current directory's git remotes and can fail despite
     `--repo` (use the API call when driving the repo from another directory).
   - **File-based body *plus* an assignee or reviewer**: those flags take a
     username on `glab mr create`, while the API POST takes numeric ids and
     silently drops `--field "assignee_ids[]=<id>"`. Create the MR with
     `glab mr create … --assignee <username> --no-editor` and a placeholder
     description, then set the real body:
     `glab api "projects/<encoded-path>/merge_requests/<iid>" --method PUT --field "description=@<file>"`.
     `--no-editor` stops `glab` opening an editor and hanging. Set an assignee
     only when the user named one.
   - **Reviewer**: only `greenberrynl/config/ai-workflows` names one — that MR
     must carry `--reviewer wieteke.pots`. The API path takes numeric ids only
     (`--field "reviewer_ids[]=<id>"`), so prefer `glab mr create --reviewer
     <username>` with a placeholder body and then PUT the real description from
     a file. Fix a dropped reviewer with
     `glab mr update <iid> --reviewer wieteke.pots` and verify with
     `glab mr view <iid>`. Every other repo — including
     `greenberrynl/the-greenhouse/unicore-template` — gets no `--reviewer` flag:
     the human assigns the reviewer. Never push straight to the base branch in
     either canonical config repo.
4. Read the PR/MR back before reporting (`glab mr view <iid>` / `gh pr view`):
   confirm the `ai:agent-authored` label, the template's headings in the
   description, and the reviewer where policy names one. Repair what is
   missing (`glab mr update` / `gh pr edit`) — report only what the read-back
   confirmed. Then read the MR pipeline once its setup stage has finished and
   report a failed job with its name and log tail: it can fail in `install` on
   something the diff never touched, such as a registry token that
   feature-branch pipelines do not receive once a lockfile change empties the
   cache. Wait for it in one bounded poll (every 30–60 s, at most about
   10 minutes); when the setup stage has not finished by then, report the
   stage it reached and offer `watch-mrs` for the rest.
5. Output the PR/MR URL on success.

### No-CLI fallbacks

- **GitLab push options** (no token needed): push with
  `-o merge_request.create -o merge_request.target=<base> -o merge_request.remove_source_branch -o merge_request.title="$TITLE" -o merge_request.description="$DESCRIPTION"`;
  GitLab prints the MR URL. Ignored when the push transfers no refs — then use:
- **GitLab prefilled URL**: `<web-base>/-/merge_requests/new?merge_request[source_branch]=<branch>&merge_request[target_branch]=<base>&merge_request[title]=<encoded>&merge_request[description]=<encoded>`
  (`<web-base>` = origin URL minus `.git`; URL-encode title/description).
- **GitHub prefilled URL**: `https://github.com/<org>/<repo>/compare/<base>...<branch>?expand=1&title=<encoded>&body=<encoded>`.
- Only claim the PR/MR exists when the platform's output confirmed it.

## Recap

Close out with a **Recap** table so no closeout step depends on memory. Fixed
row set, always in this order — never drop a row; set it to ➖ when not
applicable, so a missed step stands out. Follow the table with one short
"What & why" line.

Status icons: ✅ done · ⏳ open/blocked · ➖ n/a · ⚠️ heads-up.

| Step | Status | Detail |
| --- | --- | --- |
| PR/MR opened | ✅ | `!<num>` / `#<num>` → full link (→ `<base>`) |
| Rebased on base | ✅ | on `<remote>/<base>`, mergeable |
| Checks | ✅ | lint ✓ · type-check ✓ · test ✓ · MR pipeline ✓ (or the stage it reached) |
| Self-review | ✅ | `<n>` findings, `<k>` blocking and fixed — ⚠️ when a finding was waived — ➖ with the reason it was skipped |
| Migration | ➖ | none needed / added `<name>` |
| Board updated | ✅ | section it moved to (if the project keeps a board) |
| Worktree cleaned up | ➖ | removed + pruned, or ➖ if none was used |
| Open items | ⚠️ | remaining gates/assumptions (approval, follow-up) |

"PR/MR opened" always carries the number **and** the full link.

## Guidelines

- Keep the description concise and scannable.
- Use counts, not long file lists.
- Highlight user-facing changes and architecture decisions.
- If push or PR/MR creation fails, surface the error and stop.
