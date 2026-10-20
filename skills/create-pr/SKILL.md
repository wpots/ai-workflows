---
name: create-pr
description: Push the current branch and create a pull request (GitHub or GitLab) with a structured description generated from the branch diff. Use when the user asks to open, create, or submit a PR/MR.
metadata:
  owner: wieteke.pots
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
3. **Resolve the branch + working-tree state before anything else.** Run
   `git status` and `git log --oneline <base>..HEAD` and answer two questions
   explicitly: (a) does the branch carry commits unrelated to this PR, and
   (b) does the working tree mix unrelated uncommitted/untracked work with the
   changes to ship? If either is true, do **not** commit or push from this
   state — resolve first: create a fresh branch from the base and stage only
   the files that belong to this PR, leave unrelated WIP untouched where it
   is, and ask the user when ownership of a change is unclear. Only proceed
   when every commit and staged file on the branch belongs to the PR. The
   mechanics of that carve-out — stashing by path, creating the branch so it
   actually switches, staging by path — are in "Carving one MR out of a dirty
   tree" in `references/push-and-mr-mechanics.md`.
   When the user wants the work split across **several** MRs, follow
   "Splitting one working tree into several MRs" in
   `references/push-and-mr-mechanics.md` — it covers what to settle with the
   user first (stacked vs independent, pre-existing commits, ticket keys) and
   how to prove afterwards that nothing was lost.
4. **Migration check.** If the branch diff adds or edits files under the Payload
   `migrations/` directory, run the `migration-check` skill first (read-only; it
   never runs `migrate`). If it reports a phantom/duplicate statement or a
   regressed baseline snapshot, stop and surface it — a migration that fails
   `migrate` must not land in the PR/MR. Continue only once it passes or the user
   accepts the finding.
5. **Routing evals.** If the repository has eval cases tagged `routing` under
   `evals/` and the branch diff adds a skill, changes a skill's `name`,
   `description` or `when_to_use`, or changes a routing case, follow "Before a
   skill MR" in `evals/README.md`: it holds the exact trigger test, the command
   and the result line. It runs the routing suite without asking, once, before
   the first push. If a case fails, stop and surface the case, the skill and the
   grader; continue only once it passes or the user accepts the failure, and
   never loosen or delete the case to get a pass. Put the result line the README
   prescribes (including `not run — <reason>`) in the verification section of
   the MR description (see Generate PR Content). Everywhere else, and for a
   branch that changes only skill bodies, references or other cases, this step
   does nothing.
6. Check whether the diff is primarily a shared AI workflow change.
   - If `AI-WORKFLOWS.md` exists, use its `Shared Workflow Assets` section as the source of truth.
   - If it does not exist, treat synced workflow surfaces such as `commands/`,
     `rules/`, `.github/prompts/`, and thin adapter files as shared workflow files.
7. If the diff is primarily a reusable shared workflow change and the current repo is a synced target rather than the canonical `ai-workflows` repo, pause and tell the user this likely belongs in the ai-workflows repo. Ask whether to:
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

The resolved template's headings stay the skeleton even when another skill
layers description requirements on top (work-backlog's BLI link,
acceptance-criteria checklist, `How to verify` steps, slice status): map that
content into the template's sections, never into invented top-level headings
beside them. Sections the content genuinely doesn't need are removed, not left
empty — but a required section is never replaced by a free-form one.

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

[<TICKET>](https://<tracker-base>/<TICKET>)
```

If the branch has no ticket or no tracker base URL is configured, omit the
section — do not guess a URL.

Diff the current branch against the resolved base branch and produce:

- **Title** — a conventional-commit subject (`type(scope): imperative`),
  50-72 chars. With squash-on-merge it **becomes the commit message** on the
  base branch, so it carries that weight (`rules/git-flow.md`).
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

> **Sustainable IT.** This pre-push run is the **single full checks sweep** for
> the branch — don't duplicate it mid-task. While building, use targeted scopes
> and avoid re-running checks that already passed on unchanged files (see the
> `run-checks` skill's "Sustainable verification").

> **A hook failure outside your diff is still yours to resolve, not to bypass.**
> A repo-wide `lint`/`type-check` in the pre-push hook can fail on files the
> branch never touched — most often a gitignored local artefact directory
> (browser-automation output, caches, scratch scripts) that the linter's own
> ignore list is missing, so it only fails on machines where that directory
> exists and never in CI. Mirror the directory into the linter's ignore list and
> commit that as its own commit with its own reason. Do not reach for
> `--no-verify`: the same hook usually also runs migration and schema checks,
> and skipping those is not what you were trying to skip.

> **Worktree caveat.** If the branch is checked out in a git worktree
> (`git worktree list` shows it under e.g. `.worktrees/<name>`), hooks and
> test runners usually do **not** work there unmodified. Before step 2, read
> `references/worktrees.md` in this skill's directory and follow it — it
> covers node_modules provisioning, a hooks directory the install never
> generated (git then skips every hook, silently), ignored test paths, hooks
> whose git-calling tests rewrite the shared `.git/config`, running every hook
> command verbatim on the exact commit, and removing the worktree after the
> push.

1. **Show the base branch, title, and description to the user and get
   approval before pushing** — pushing is outward-facing. Skip the ask only
   when the user already said to proceed without asking.
2. Push the branch (add `--no-verify` when pushing from a worktree, per the
   caveat above):
   - First push (no upstream yet): `git push -u <remote> HEAD`.
   - After any rebase: `git push --force-with-lease`.
3. Create the PR/MR **in the same turn you announce it.** Never end a turn on
   "creating the MR now" — the create call, the returned URL, and the
   verification all belong to that turn. A turn that announces the action
   without making the call costs the user a "retry" and leaves a pushed branch
   with no MR.

**GitHub:**

```bash
gh pr create \
  --base <resolved-base> \
  --title "<title>" \
  --body "<generated-body>" \
  --label "ai:agent-authored"
```

**GitLab:**

```bash
# -d/--description takes a STRING. glab has no --description-file, --body-file
# or -F on `mr create` — inventing one fails with `Unknown flag`. A body longer
# than a paragraph goes through the file-based flow below, not a guessed flag.
glab mr create \
  --target-branch <resolved-base> \
  --title "<title>" \
  --description "<generated-body>" \
  --label "ai:agent-authored"
```

> **Provenance label — always, on every MR this skill opens.** A squash merge
> discards the branch commits and with them the `Co-Authored-By: Claude`
> trailers, so the commit history cannot answer "how much of this was agent
> written". The `ai:agent-authored` label can: it lives on the MR, survives
> squash and rebase, and is what `scripts/delivery-metrics.mjs` counts
> (`rules/git-flow.md`). GitLab creates a missing label on the fly; GitHub does
> not — if `gh` rejects it, run `gh label create "ai:agent-authored" --color
> 6f42c1` once, then retry. If labelling still fails, create the PR/MR without
> it and say so in the recap rather than dropping the MR.

> **Reviewer — exactly one repo names one.** When the resolved remote points at
> `greenberrynl/config/ai-workflows`, the MR must be created with
> `--reviewer wieteke.pots`. An MR there without that reviewer is not done: if
> the flag was dropped, run `glab mr update <iid> --reviewer wieteke.pots`, and
> verify with `glab mr view <iid>` before reporting.
>
> **Every other repo gets no `--reviewer` flag at all** — `unicore-template`,
> client projects, everything. Do not infer a reviewer from CODEOWNERS, repo
> members, or git history, and never assign the MR author; the human picks the
> reviewer on the MR. Pass `--reviewer <username>` elsewhere only when the user
> named that person in this session. Say in the recap that the MR still needs a
> reviewer assigned.
>
> In both canonical config repos (`ai-workflows`, `unicore-template`) never
> bypass the MR with a direct push to the base branch — not even for a one-line
> doc change.
>
> `--reviewer` and `--assignee` only accept a **username** on
> `glab mr create`; the `glab api` POST path takes numeric ids
> (`--field "reviewer_ids[]=<id>"`, `assignee_ids[]`) and silently drops the
> bracketed field. So when the body also has to come from a file, create the MR
> with `glab mr create` plus those flags and a one-line placeholder
> description, then PUT the real body from the file (see below) — that gets
> both without looking up an id.

> **Assignee.** This skill sets one only when the user names a person
> (`--assignee <username>`); it never assigns anyone on its own. Unlike the
> reviewer rule above, no repo mandates an assignee.

> **Long descriptions and cwd pitfalls.** A multi-paragraph body passed
> inline is fragile, and `glab mr create` misresolves its repo context when
> driven from another directory. When the description exceeds a paragraph or
> you are not running from the repo root, use the file-based `glab api` /
> `--body-file` flow in `references/push-and-mr-mechanics.md` (this skill's
> directory) instead of inline flags.

4. **Read the PR/MR back before reporting.** Run `glab mr view <iid>`
   (GitLab) or `gh pr view` (GitHub) and confirm what the platform actually
   stored — the create call having been issued is not evidence (MRs have
   shipped with the label dropped and the template's headings replaced by
   free-form ones despite both being mandated):
   - the `ai:agent-authored` label is on it — repair with
     `glab mr update <iid> --label "ai:agent-authored"` /
     `gh pr edit <num> --add-label "ai:agent-authored"` when it is not;
   - the description carries the resolved template's headings — repair via the
     file-based description update in `references/push-and-mr-mechanics.md`
     when it does not;
   - the reviewer, when the repo's policy names one (see above);
   - the MR pipeline, once its setup stage has finished (GitLab:
     `head_pipeline.status` from `glab api projects/<path>/merge_requests/<iid>`,
     jobs from `…/pipelines/<id>/jobs`, a log from `…/jobs/<id>/trace`). A
     failed job is reported with its name and the last lines of its log, not as
     "pipeline running". Local checks do not cover it: an MR pipeline can fail
     in `install` on something the diff never touched — a registry token that
     feature-branch pipelines do not receive surfaces only when the lockfile
     changes and the cache starts cold. Wait for the setup stage in one
     bounded poll: every 30–60 s, for at most about 10 minutes (in Claude Code
     a Monitor until-loop, since a foreground `sleep` is blocked). When it has
     not finished by then, report the stage it reached and offer
     `skills/watch-mrs`, which follows the rest of the pipeline and names a
     failing job.
   Report only what the read-back confirmed.
5. Output the PR/MR URL on success.

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
  -o merge_request.description="$DESCRIPTION" \
  -o merge_request.label="ai:agent-authored"
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

### 9. Notify (merge-request channel)

Only when the project defines a merge-request channel policy (e.g. a
`docs/MONITORING.md`, the project `CLAUDE.md`, or a memory noting a Slack
channel for new MRs) **and** a Slack tool is available in the session:

- Post **once, immediately after the PR/MR is created**: the one-line subject
  + the PR/MR link, nothing else — no review-status suffixes.
- One PR/MR = at most one channel post, at creation time. Never post again
  for rework, comments, pipelines, or the merge.
- This step exists because native platform→Slack integrations often cannot
  distinguish "opened" from "merged"; when such an integration is disabled in
  favour of workflow-side posting, skipping this step means new MRs go
  unannounced.

No policy or no Slack tool → skip silently.

### 10. Error Handling

- If push fails (e.g. no upstream, auth error), surface the error and stop.
- If PR/MR creation fails, show the error. Do not retry automatically.

### 11. Recap

Close out with a **Recap** table so no closeout step depends on memory. Use a
fixed row set, always in this order — never drop a row; set it to ➖ when not
applicable, so a missed step stands out. Follow the table with one short
"What & why" line stating the substantive change.

Status icons: ✅ done · ⏳ open/blocked · ➖ n/a · ⚠️ heads-up.

| Step | Status | Detail |
| --- | --- | --- |
| PR/MR opened | ✅ | `!<num>` / `#<num>` → full link (→ `<base>`) |
| Reviewer requested | ✅ | `<username>`, verified — or ➖ when the repo has no reviewer policy |
| Provenance label | ✅ | `ai:agent-authored`, confirmed on read-back — or ⚠️ with the reason when labelling failed |
| Template followed | ✅ | `<resolved template path>`, headings confirmed on read-back |
| Rebased on base | ✅ | on `<remote>/<base>`, mergeable |
| Checks | ✅ | lint ✓ · type-check ✓ · test ✓ · MR pipeline ✓ (or the stage it reached) |
| Migration | ➖ | none needed / added `<name>` |
| Board updated | ✅ | section it moved to (if the project keeps a board) |
| Worktree cleaned up | ➖ | removed + pruned, or ➖ if none was used |
| Open items | ⚠️ | remaining gates/assumptions (approval, follow-up) |

"PR/MR opened" always carries the number **and** the full link. "Open items"
summarises anything still pending (approval, a follow-up, an unverified
assumption). Rows that don't apply to this task (e.g. no worktree, no
migration, no board) stay in the table on ➖.

## Guidelines

- Write the PR/MR title, description, comments, and thread replies in the
  language the repository uses for its MRs — never the language you happen to
  be chatting in. Resolve that language in this order: (1) an explicit
  instruction in the MR/PR template or a project rule (e.g. a template line
  "Write this description in English") — this always wins; (2) otherwise the
  template's own language. **Never infer it from other existing MRs** — they
  may be inconsistent, and one MR in the chat language must not drag the rest
  along.
- Keep the description concise and scannable.
- Prefer counts and impact summaries over long file lists.
- Always show the base branch, title, and description for approval before
  pushing, unless the user already said to proceed without asking.
- Always keep the PR/MR mergeable: rebase onto the latest base before every
  push (create or update), never let the branch drift behind base.
- The MR title is the squashed commit message and `ai:agent-authored` is the
  only durable provenance signal — both are `rules/git-flow.md` requirements,
  not preferences.
- In the canonical config repos (`ai-workflows`, `unicore-template`) every
  change lands via a GitLab MR — no direct pushes to the base branch.
  `ai-workflows` is the only repo where the MR also requires a named reviewer
  (`wieteke.pots`); nowhere else does this skill assign one.
