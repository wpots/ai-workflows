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

## Long descriptions go via a file, not inline

A multi-paragraph body passed inline (`--body`/`--description`) is fragile:
shell quoting breaks easily, and very large single arguments can crash agent
permission flows mid-command. Write the generated body to a temp file first,
then:

- **GitHub**: `gh pr create … --body-file <file>`.
- **GitLab**: `glab mr create` has no body-file flag — create the MR in one
  API call with the body read from the file:

  ```bash
  glab api "projects/<url-encoded-project-path>/merge_requests" \
    --method POST \
    --field "source_branch=<branch>" --field "target_branch=<base>" \
    --field "title=<title>" --field "description=@<file>"
  ```

  (`--field key=@file` reads the value from the file.) Verify the response
  echoes a non-trivial description before reporting the URL.

## Driving the repo from another directory

When running e.g. from a worktree via `git -C`: `glab mr create` resolves its
repo context from the current directory's git remotes and fails even with
`--repo` when the cwd points at a different host's repo. The `glab api` call
above has no cwd dependency — prefer it. Related pitfall: when git uses glab
as its HTTPS credential helper, an expired glab OAuth token breaks
`git push`/`fetch` too (`could not read Username`) — `glab auth login` fixes
both.
