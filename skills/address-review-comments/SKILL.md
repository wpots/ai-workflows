---
name: address-review-comments
description: Pick up reviewer comments on a GitHub PR or GitLab MR in an isolated worktree, propose an approach per comment, then (after approval) apply, run checks, push, rebase onto the base branch, and clean up. Use when the user asks to address/pick up/process review feedback or reviewer comments on a PR/MR.
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
and B back-to-back without the approval pause.

---

## Phase A — Fetch & propose (always)

### 1. Resolve the PR/MR and platform

- Detect platform from the remote URL (`git remote get-url <remote>`):
  `github.com` → GitHub (`gh`), `gitlab.com`/self-hosted → GitLab (`glab`).
- Identify the target by number (if the user gave one) or by the current
  branch's open PR/MR.
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

Wait for approval before Phase B.

---

## Phase B — Apply, verify, push, rebase, clean up (after approval)

### 4. Set up an isolated worktree

```bash
git fetch <remote> <source_branch>
git worktree add <path-outside-repo>/<repo>-<ticket> <source_branch>
```

A fresh worktree has **no dependencies installed and no local env files**. Set
it up the way this project requires before running anything:

- Copy whatever local env files the project needs (DB URL, secret-decryption
  keys) from the main worktree.
- Install dependencies and run any required codegen step (type generation,
  client generation) — without codegen, type-checks can report false errors.

Read the project's own docs/scripts for the exact files and commands; do not
assume a fixed list.

### 5. Apply the changes

Edit in the worktree. When a `suggestion` drops a helper, make sure every later
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

### 9. Clean up

```bash
git worktree remove <worktree> --force
```

### 10. Evaluate workflow updates

After finishing, briefly consider whether anything learned should update this
skill or the shared `rules/`. If a reusable lesson emerged, suggest upstreaming
to the ai-workflows repo.

---

## Guidelines

- One comment at a time when proposing; keep it scannable.
- Resolving the comment thread on the platform is optional — offer it, don't
  assume it.
- Respect the project's migration policy absolutely: code change only, flag when
  a migration is needed, never generate one.
