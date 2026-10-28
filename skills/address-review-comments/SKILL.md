---
name: address-review-comments
description: Pick up reviewer comments on a GitHub PR or GitLab MR, propose an approach per comment, then (after approval) apply, run checks, push, rebase onto the base branch, hand the MR back to the reviewer, and clean up. Use when the user asks to address/pick up/process review feedback or reviewer comments on a PR/MR.
metadata:
  owner: wieteke.pots
---

# Address Review Comments Skill

Use this when the user asks to pick up, address, or process reviewer comments on
a pull request (GitHub) or merge request (GitLab) — e.g. "pak Sanders comment op
MR 165 op", "address the review feedback on this PR".

## Autonomy mode: propose, then stop

Default behaviour is **propose-then-stop**: fetch the comments, summarise each
one, and propose a concrete approach per comment. **Stop and wait for the user's
go-ahead before changing any code.** Only after approval run Phase B.

If the user explicitly says "do it all" / "volledig auto", you may run Phase A
and B back-to-back without the approval pause. A `watch-mrs` loop in act mode
counts as that go for comments that need no crucial decision (architecture,
scope, a direction the team picks). A comment that does need one stops for
that question only.

---

## Phase A — Fetch & propose (always)

### 1. Resolve the PR/MR and platform

- Detect platform from the remote URL (`git remote get-url <remote>`):
  `github.com` → GitHub (`gh`), `gitlab.com`/self-hosted → GitLab (`glab`).
- Identify the target by number (if the user gave one) or by the current
  branch's open PR/MR.
- A bare number names no repo, and the cwd remote is only one candidate. When
  `<n>` there is merged, closed, or not the user's MR, search the user's open
  MRs everywhere instead —
  `glab api "merge_requests?scope=all&author_username=<me>&state=opened"` —
  and take the one whose `references.full` ends in `!<n>`; a fresh
  `updated_at` with a non-zero `user_notes_count` confirms it. Then find its
  local checkout by matching `git -C <dir> remote get-url origin`.
- Get the **source** and **target** branch:
  - GitLab: `glab api projects/<urlencoded-path>/merge_requests/<n>` → read
    `source_branch` / `target_branch`.
  - GitHub: `gh pr view <n> --json headRefName,baseRefName`.

### 2. Fetch the comments

- GitLab: `glab mr view <n> --comments`
- GitHub: `gh pr view <n> --comments` (and `gh api` for review threads if needed)

Capture suggestion blocks (```suggestion), questions, and change-requests
separately.

### 3. Present + propose — then STOP

For each comment output: the reviewer, the quoted concern, and a one-line
proposed approach. For `suggestion` blocks, note whether applying verbatim still
type-checks (e.g. a dropped helper whose return value is used elsewhere needs the
value re-derived).

State the hand-back you will do after the push (step 9), so one go-ahead
covers it.

State the isolated worktree path you will use. The task's existing
authorization covers worktree setup; ask only for unresolved implementation
decisions or the code-change approval required by this phase.

Wait for approval before Phase B.

---

## Phase B — Apply, verify, push, rebase, clean up (after approval)

### 4. Use an isolated worktree

Read `rules/git-flow.md` and follow its workspace-isolation policy. Record the
main checkout's path, branch, HEAD and dirty state before any branch work.
Keep that checkout unchanged, including local edits and generated files.

Fetch the source branch and use a worktree under
`~/.worktrees/<repo>-<ticket>`, outside the project and every IDE-watched
directory. Use the source branch there when it is free; otherwise start
detached at its fetched remote ref. Never switch, stash, reset or reinstall
dependencies in the main checkout to make the task fit. Worktree setup or
check failures are resolved in the worktree, not by falling back to main.

A fresh worktree has **no dependencies installed and no local env files**. The
full setup, check and cleanup rules are in
`skills/create-pr/references/worktrees.md`; set it up the way this project
requires before running anything:

- Copy whatever local env files the project needs (DB URL, secret-decryption
  keys) from the main worktree.
- Install dependencies and run any required codegen step (type generation,
  client generation) — without codegen, type-checks can report false errors.

Read the project's own docs/scripts for the exact files and commands; do not
assume a fixed list.

### 5. Apply the changes

Edit in the chosen workspace. When a `suggestion` drops a helper, make sure every later
use of that helper's value still resolves (re-derive inline, keep types intact —
never introduce `any`/`as` to paper over it).

### 6. Verify — lean on the project's own checks

Do **not** reinvent the check pipeline. If the project has git hooks
(pre-commit / pre-push) or a `run-checks` command, let those gate it. Before
committing you may run the single affected test and the type-checker as a fast
sanity check; let the hooks/command run the full suite on commit/push.

> ⚠️ **Never pass dummy env vars on git commands.** Overriding a real value
> (e.g. a DB URL) on `git push` can make a pre-push migration/status check report
> false results. Run commits/pushes with the project's real local env loaded.
>
> ⚠️ **Respect the project's migration policy.** If the project owns migrations
> manually, never generate or apply them — make the code change only, and if a
> check legitimately reports pending migrations, **stop and tell the user**.
>
> ⚠️ **Checkout outside the session's working dirs.** You cannot `cd` there,
> and `npm --prefix <root> exec -- eslint …` keeps the caller's cwd: ESLint
> answers "File ignored because outside of base path" and typescript-eslint
> "TSConfig does not include this file". `npm --prefix <root> run <script>`
> does run in `<root>`. For a lint of only the touched files, call the ESLint
> Node API from a scratchpad script that does `process.chdir(<root>)` and
> `new ESLint({ cwd: <root> })`, resolving `eslint` from `<root>`.
>
> ⚠️ **`node_modules` installed for another branch.** When the checkout's
> dependencies belong to the branch you found it on and its lockfile differs
> from the source branch's
> (`git diff --stat <found-branch> <source_branch> -- <lockfile>`), a
> repo-wide `tsc` or lint in the pre-commit hook fails on files the diff never
> touches. Don't reinstall in the user's checkout — it then mismatches the
> branch they switch back to. Run lint and format on the touched files plus
> the affected tests, show the remaining error sits outside the diff, commit
> with `--no-verify`, and say so in the report. Leave the pre-push hook on.
>
> ⚠️ **A crashed jest worker is not a failing test.** "A jest worker process
> … was terminated by another process: signal=SIGSEGV" under "Test suite
> failed to run": rerun that suite alone, then retry the push once with the
> hook on. Never `--no-verify` past it.

**Evidence rule — "done" is a shown check, not a claim.** The closing report
lists, per comment: what changed (`file:line`) and the check that proves it —
the command run and the tail of its real output, on the exact commit pushed
(`git rev-parse --short HEAD`). A comment addressed without a runnable check
(pure wording, docs) says so explicitly instead of borrowing the suite's
green.

### 7. Commit & push

Conventional commit referencing the MR/PR. Co-author trailer as per global
rules. Push to the source branch.

### 8. Check & execute rebase (after the push)

```bash
git fetch <remote> <target_branch>
git rev-list --left-right --count <remote>/<target>...HEAD   # left=behind, right=ahead
```

If behind > 0:

1. Preview conflicts: `git merge-tree --write-tree <remote>/<target> HEAD`
   (or `git merge-base` + `git merge-tree` three-arg form).
2. If clean, `git rebase <remote>/<target>`.
3. The target may have bumped deps / generated config — re-run install + codegen,
   re-run the affected test.
4. `git push --force-with-lease <remote> <source_branch>` (let the pre-push
   checks run the full suite with real env).

If the merge is **not** clean, stop and report the conflicting files — do not
force a resolution.

#### After a stacked base MR is squash-merged

GitLab may retarget the dependent MR automatically and delete the merged MR's
source branch. Re-read both MRs before fetching; keep the merged base MR's
source SHA and `squash_commit_sha` from its API response instead of assuming
the source ref still exists.

For a squash merge, compare the resulting trees before using an ancestry-based
conflict preview:

```bash
git fetch <remote> <new_target>
git diff --quiet <base_mr_source_sha> <squash_commit_sha>
```

Proceed only when `git diff --quiet` exits `0`. With identical trees,
`git merge-tree <new_target> HEAD` can report a false conflict because the
equivalent base changes have different ancestry. Replay only the dependent
MR's commits instead:

```bash
git rebase --onto <remote>/<new_target> <base_mr_source_sha>
git rev-list --left-right --count <remote>/<new_target>...HEAD
```

The expected count is `0 <dependent_commit_count>`. Re-run checks and push with
`--force-with-lease`. If the trees differ, stop and inspect the difference;
the old base cannot safely be substituted by the squash commit.

### 9. Hand the MR back to the reviewer

When the rework touches the UI, run `skills/local-handover` on the task
worktree first and hand back once the user has checked it; the worktree stays
until then.

Once the final commit is on the remote, leave every thread open — resolving
is the reviewer's call unless the user asks for it. On GitLab:

1. Read the note ids from `…/merge_requests/<iid>/discussions` (non-system
   notes only).
2. Add a 👍 to each addressed note:
   `glab api -X POST "projects/<path>/merge_requests/<iid>/notes/<note_id>/award_emoji" -f name=thumbsup`.
   The 👍 says the comment is picked up; never reply in its thread to explain
   how. Reply in a thread only for pushback, a question, or a decision the
   reviewer has to see.
3. Post one top-level note that mentions the reviewer, names the pushed sha
   and what changed, and offers the MR for another look:
   `glab api -X POST "projects/<path>/merge_requests/<iid>/notes" -f body='…'`.
   Single-quote the body so backticks in it survive the shell.

On GitHub, do the same with a reaction on each comment and `gh pr comment`.

### 10. Clean up

Remove the clean task worktree with `git worktree remove <worktree>`.
Preserve uncommitted work and report its path instead of forcing removal.
Verify the main checkout's branch, HEAD and pre-existing changes still match
the initial snapshot. There is no main-checkout branch switch or stash to
restore.

### 11. Evaluate workflow updates

After finishing, briefly consider whether anything learned should update this
skill or the shared `rules/`. If a reusable lesson emerged, suggest upstreaming
to the ai-workflows repo.

---

## Guidelines

- One comment at a time when proposing; keep it scannable.
- Leave comment threads open for the reviewer (step 9); resolve one only when
  the user asks.
- Respect the project's migration policy absolutely: code change only, flag when
  a migration is needed, never generate one.
