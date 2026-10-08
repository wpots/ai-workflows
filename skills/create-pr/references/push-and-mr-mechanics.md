# Push & MR Mechanics — Reference

Deep-dive pitfalls for `create-pr` step 7. Read this file when any of these
apply: the branch lives in a git worktree, the generated description is longer
than a paragraph, or `glab` is driven from outside the repo directory.

## Worktree caveat

If the branch is checked out in a git worktree (`git worktree list` shows it
under e.g. `.worktrees/<name>`), the commit/push hooks and the test runner
usually do **not** work there unmodified, so verify manually before pushing:

- A fresh worktree has **no `node_modules`** of its own, so hooks and
  `npm test` that resolve `./node_modules/…` fail. Provide them first —
  symlink the main checkout (`ln -s <main-checkout>/node_modules node_modules`).
  A symlink is enough for Jest, `tsc`, ESLint and typegen, and costs no disk.
  Only when a bundler that rejects symlinked `node_modules` must run (Turbopack:
  `next build`/`next dev`) swap it for a copy-on-write clone,
  `cp -Rc <main-checkout>/node_modules node_modules` — cheaper and safer than
  `npm ci`, which re-downloads everything and leaves truncated packages if it is
  OOM-killed.
  The symlink/clone default is specifically an **npm** workaround: npm has no
  shared store, so every real install copies the whole tree again (measured on
  one repo: five worktrees with a real install ≈ 7.3 GB of pure duplication at
  ~1.5 GB each). With a **content-addressed store** (pnpm) the calculus flips —
  a warm install in the worktree hardlinks from that store, costing seconds and
  almost no new disk while still producing a lockfile-accurate tree per branch,
  so install normally and skip both tricks. Never force a manager the project
  does not pin in `packageManager`; it refuses to run (`This project is
  configured to use npm`), and that is corepack working as intended, not an
  obstacle to route around.
- Test runners often **ignore `.worktrees/`** (e.g. jest
  `testPathIgnorePatterns` / `modulePathIgnorePatterns`), so a normal run finds
  **0 tests**. Override those patterns when running natively from the worktree,
  e.g. `npm test -- --testPathIgnorePatterns=/node_modules/ --modulePathIgnorePatterns=/__none__/ --coverage=false`.
  Note the pattern matches the **absolute** path, so a worktree at
  `~/.worktrees/…` is ignored too, not just one inside the repo.
- Never point the runner at the worktree **from the main checkout**. A
  `--rootDir <worktree>` (or equivalent) shortcut looks like it avoids both
  problems above, but path aliases resolved from the config (jest
  `moduleNameMapper: "<rootDir>/src/$1"`) keep pointing at the *original* tree.
  Tests then load half their modules from each checkout and fail on mocks that
  no longer match by path. Run with the worktree as the working directory
  instead (`npm --prefix <worktree> test -- …`).
- **Gitignored artifacts** the main checkout has and the worktree lacks each
  fail with an error that points somewhere else entirely. Copy them up front
  instead of diagnosing the symptom:

  | Missing | Symptom |
  | --- | --- |
  | `.env.local` (+ `.env.keys` when the loader must decrypt) | env validation aborts the test runner before a single test — e.g. `Invalid environment variables: PAYLOAD_DB_URL` |
  | `next-env.d.ts`, `.next/types/**`, `.next/dev/types/**` | dozens of phantom `Cannot find name 'PageProps' / 'LayoutProps'` errors from `tsc` |
  | generated import maps / codegen output (e.g. Payload's `importMap.js`) | `Cannot find module … or its corresponding type declarations` |
  | `node_modules` itself, so the binaries a hook shells out to are absent | a hook step reports a **domain** failure instead of a missing tool — e.g. `❌ Pending migrations detected` when the truth is `dotenvx: not found` |

  Delete any copied env file when you are done — a copied secret must not
  outlive the worktree — and run `git status` afterwards: some env files are
  committed (encrypted at rest), so removing a copy stages a **deletion** you
  would otherwise push.
- When a check needs a **before/after** comparison (build output, bundle size, a
  running server), pin both sides: the baseline build overwrites the build
  directory, so a verification run straight after it serves the baseline, not
  your change. Confirm `git log --oneline -1` in the worktree before trusting
  what you observe, and rebuild after switching back.
- Remove the worktree as soon as the branch is pushed
  (`git worktree remove --force <path>`). A bare checkout is ~90 MB; one with
  `node_modules` plus a build output is 1.4-3 GB, and stale ones accumulate
  unnoticed. To audit what is safe to drop in a **squash-merging** repo, do not
  trust `git branch --merged` or ancestry — check `git cherry <base> <branch>`
  (patch-id) plus the MR state, and keep anything with uncommitted changes.

Do **not** assume the hook only runs lint/type-check/test — read the actual
hook file(s) (e.g. `.husky/pre-push`, `.husky/pre-commit`) and run **every**
command listed there, verbatim, in the worktree. Some projects wire in extra
steps (migration checks, `drizzle-kit check`, storybook build, etc.) that are
easy to miss if you go from memory instead of the file. Run the full
repo-wide command each hook step invokes (e.g. `npm run lint:check`), not a
git-diff-scoped subset — a partial run can pass while the real command still
fails. Do this immediately before pushing, on the exact commit being pushed
(a later commit added after "looks green" is unverified). If any command
fails, stop and fix it — `--no-verify` skips only the hook process that
cannot execute in a worktree, never the checks it would have run.

**Read the hook's own output before believing its verdict.** A hook step that
wraps a project binary usually turns any non-zero exit into its own
domain-level conclusion, so a missing tool and a real finding print the same
headline. Seen in practice: a pre-push migration check ran
`payload migrate:status` through a dotenvx loader, the loader exited
`dotenvx: not found` because the worktree had no `node_modules`, and the script
rendered that as `❌ Pending migrations detected. Before pushing, run: npm run
migrate:create`. There were no pending migrations — the commit was a single
file rename with zero content lines changed. Scroll up to the actual command
output; the summary line is the script's interpretation, not evidence.

When you do bypass a hook, put the justification in the message you send the
user: which commands you ran by hand, and why this diff cannot affect the ones
you could not run. "It is only docs" is an assertion; `git show --numstat`
showing a rename with `0 0` is evidence.

## Long descriptions go via a file, not inline

A multi-paragraph body passed inline (`--body`/`--description`) is fragile:
shell quoting breaks easily, and very large single arguments can crash agent
permission flows mid-command. Write the generated body to a temp file first,
then:

- **GitHub**: `gh pr create … --body-file <file>`.
- **GitLab**: `glab mr create` has **no** body-file flag — no
  `--description-file`, no `--body-file`, no `-F`; only `-d/--description`,
  which takes a string. Do not reason by analogy from GitHub's `--body-file`:
  guessing the flag fails with `Unknown flag: --description-file` and costs a
  round trip. Create the MR in one API call with the body read from the file:

  ```bash
  glab api "projects/<url-encoded-project-path>/merge_requests" \
    --method POST \
    --field "source_branch=<branch>" --field "target_branch=<base>" \
    --field "title=<title>" --field "description=@<file>" \
    --field "labels=ai:agent-authored" --field "remove_source_branch=true"
  ```

  (`--field key=@file` reads the value from the file.) `labels` and
  `remove_source_branch` are plain fields here, unlike the reviewer below —
  carry them in this call, or the file-based route quietly ships an MR without
  the one provenance signal that survives a squash merge. Verify the response
  echoes a non-trivial description before reporting the URL.

### When the MR also needs an assignee or a reviewer

`--assignee` and `--reviewer` take a **username** on `glab mr create`; the API
POST above takes numeric ids, and `--field "assignee_ids[]=<id>"` sends the
bracket as a literal JSON key so the field is silently dropped. Split it in
two instead — no id lookup needed:

```bash
# 1. create with the username-only fields and a throwaway description
glab mr create --target-branch <base> --title "<title>" \
  --description "placeholder" --assignee <username> \
  --label "ai:agent-authored" --remove-source-branch --no-editor

# 2. PUT the real body from the file
glab api "projects/<url-encoded-project-path>/merge_requests/<iid>" \
  --method PUT --field "description=@<file>"
```

Pass `--no-editor`: without it `glab mr create` may open an interactive editor
and hang a non-interactive session. Then confirm with `glab mr view <iid>` that
both the description **and** the assignee/reviewer stuck.

## Driving the repo from another directory

When running e.g. from a worktree via `git -C`: `glab mr create` resolves its
repo context from the current directory's git remotes and fails even with
`--repo` when the cwd points at a different host's repo. The `glab api` call
above has no cwd dependency — prefer it. Related pitfall: when git uses glab
as its HTTPS credential helper, an expired glab OAuth token breaks
`git push`/`fetch` too (`could not read Username`) — `glab auth login` fixes
both.

## Carving one MR out of a dirty tree

The single-MR case of step 3's "create a fresh branch from the base and stage
only the files that belong to this PR": the change is ready, the tree also holds
unrelated edits, and the current branch is the wrong base.

1. Park your own files, not the tree:
   `git stash push -u -m "<what>" -- <paths>`, so unrelated WIP stays where it
   is. (A branch switch carries uncommitted changes along anyway — the stash is
   insurance against a switch that refuses, not a requirement.)
2. `git switch -c <branch> --no-track <remote>/<base>`, then `git stash pop`.
3. **Verify you moved**: `git branch --show-current`, before staging anything.
4. Stage by path (`git add <paths>`) — never `git add -A` or `git commit -a`.
   The unrelated edits are still in the tree and otherwise ride along into the
   MR.

**Why `--no-track`: `git checkout -b <new> <remote>/<base>` can create the
branch and leave you on the old one.** Where the shell is sandboxed, git cannot
write `.git/config`, so the tracking setup fails:

```text
error: could not lock config file .git/config: Operation not permitted
error: unable to write upstream branch configuration
```

The command exits 1, the new branch exists at the right commit, and `HEAD` never
moved — so the next commit lands on the branch you were trying to leave.
`--no-track` writes no config and switches cleanly; `git push -u <remote> HEAD`
sets the upstream later regardless. And never pipe a branch-creating command
through `head`/`tail` in an `&&` chain: the pipe swallows the error line and the
exit status both, so the chain marches on as if it had worked.

## Splitting one working tree into several MRs

When a session produced more change than belongs in one MR, the user may ask
for it split. Two things make this go wrong: losing work while shuffling
branches, and files whose hunks belong to different MRs.

**Ask first, because it changes every branch you create:**

- **Stacked** (each branch targets the previous) or **independent** (each
  targets the base)? Independent is nicer to review but conflicts on merge
  whenever two MRs touch the same file — say so, with the file names.
- What happens to commits already on the branch that aren't part of this work?
  Fold into a related MR, give them their own, or leave them.
- Which ticket key(s) the branches should carry, if the project uses them.

**Then:**

1. **Snapshot before touching anything.** `git checkout -b wip-snapshot` and
   commit the whole tree. Nothing can be lost, and it becomes the ref every
   branch pulls from. Keep it until the MRs land; never push it.
2. Per MR: `git switch -c <name> --no-track <remote>/<base>` (see the trap
   above), then `git checkout wip-snapshot -- <paths>` for the files that
   belong to it.
3. **A file whose hunks span two MRs**: take the whole file from the snapshot,
   then hand-revert the hunks belonging elsewhere. Prove the separation with a
   grep for the other MR's markers, e.g.
   `git diff <remote>/<base> -- <file> | grep -c "<other MR's symbol>"` → `0`.
4. **Verify per branch, not once at the end.** A branch may not build alone
   because it depends on a fix that lives in another MR. Cherry-pick that
   commit onto a throwaway `measure-*` branch, take the measurement there,
   delete the branch — and state in the MR which combination produced the
   number. Never quote a figure measured on a different combination; if a
   commit message already claims one, amend it.
5. **Integrity check before reporting.** Branch off the base, merge every new
   branch into it, and diff against the snapshot:

   ```bash
   git checkout -b verify-union <remote>/<base>
   for b in <branches>; do git merge --no-edit -q "$b"; done
   git diff verify-union wip-snapshot --stat   # empty == nothing lost
   ```

   Cosmetic-only residue (a moved declaration) is fine; report it rather than
   silently accepting a non-empty diff. Delete `verify-union` afterwards.
