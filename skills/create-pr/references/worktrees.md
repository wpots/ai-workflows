# Worktrees — Reference

The full worktree rules for every skill that creates or works in a git worktree
(`create-pr`, `address-review-comments`, `dependency-hotfix`, `wcag-audit`) and
for ad-hoc worktrees outside a skill. The always-on `CLAUDE.md` keeps only the
three non-negotiables — the root, the symlinked `node_modules`, removal after the
push — and points here. Read this file before creating a worktree, and again
before pushing from one.

## When isolation is required

`rules/git-flow.md` requires an isolated worktree for MR/PR reviews, review
rework, rebases, conflict resolution and merge-readiness work. The main
checkout remains unchanged even when clean. Record and verify its initial
branch, HEAD and dirty state; do not switch or stash it to prepare the task.

## Cheap by default, heavy only on purpose

A checkout costs ~90 MB; the same worktree with `node_modules` and a build
output costs 1.4-3 GB. Left behind, a handful of them silently eats double-digit
gigabytes. So scale the setup to what the task actually needs, and tear it down
when the branch is pushed.

## Placement and a shared checkout

- One root: `~/.worktrees/<repo>-<slug>`. NEVER inside the repo (test runners
  ignore `.worktrees/`, so suites report 0 tests) and never in a directory
  registered as an additional working directory (the IDE crashes on it).
- Assume the checkout is shared with other sessions: `git status` (untracked
  files) and `git worktree list` before creating a file or branch, `git fetch`
  before every push, and when a branch was force-pushed under you, rebase your
  own commits onto the new tip and push fast-forward — never force back.
- `FETCH_HEAD`, the stash list and `.git/config` belong to the repository, not
  to a worktree, so every session writes them. Base a worktree on
  `<remote>/<base>`, never on `FETCH_HEAD`: a parallel
  `git fetch <remote> <feature-branch>` replaces it, and a worktree created from
  it sits on that feature commit while it looks like main. Create the branch
  with `git worktree add --no-track -b <branch> <path> <remote>/<base>`;
  without `--no-track` git writes upstream tracking to `.git/config`, which a
  sandbox refuses after the branch exists but before the worktree does. Drop a
  stash only after `git stash list -1` shows it is yours — another session's
  can be on top.
- Inside an EnterWorktree session git refuses `git -C <other checkout>` — the
  main checkout included — and any compound command it cannot prove is not
  git. Repo-level operations (`worktree add`/`remove`, work on another branch)
  happen after `ExitWorktree`; a branch's commits already live in the shared
  repo, so exit-then-push needs no worktree.

## Dependencies and gitignored artifacts

- A fresh worktree has **no `node_modules`** of its own, so hooks and
  `npm test` that resolve `./node_modules/…` fail. Default to a **symlink** of
  the main checkout's tree — `ln -s <main-checkout>/node_modules
  <worktree>/node_modules`. Jest, `tsc`, ESLint and typegen all work through it,
  at zero disk cost.
- Only when a bundler that rejects symlinks is needed (Turbopack: `next
  build`/`next dev`), replace the symlink with a copy-on-write clone —
  `cp -Rc <main-checkout>/node_modules <worktree>/node_modules`. Prefer that over
  `npm ci`/`npm install`, which re-downloads the tree and can get OOM-killed
  halfway, leaving truncated packages.
- Those two rules are **npm-shaped**: npm has no shared store, so every real
  install duplicates the whole tree (measured on one repo: five worktrees with a
  real install ≈ 7.3 GB of pure duplication at ~1.5 GB each). With a
  **content-addressed store** (pnpm) the calculus flips — a warm install in the
  worktree hardlinks from that store, costing seconds and almost no new disk
  while still producing a lockfile-accurate tree per branch, so install normally
  and skip both tricks. Check `packageManager` in `package.json` first and use
  what it pins; forcing another manager only earns `This project is configured
  to use npm`, which is corepack doing its job, not an obstacle to route around.
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
- **A missing hooks directory prints nothing at all.** Husky (and hook managers
  like it) generates its wrapper directory, `.husky/_`, in the install's
  `prepare` step, and the shared config points `core.hooksPath` at it with a
  relative path that git resolves per worktree. When that step did not run or
  failed (inside the sandbox it dies on `could not lock config file
  .git/config: Operation not permitted`), the worktree has no such directory,
  and git commits and pushes without running a single hook and without a
  warning. Check `git -C <worktree> config core.hooksPath` and that the
  directory exists in the worktree. Copying it from the main checkout
  (`cp -R <main-checkout>/.husky/_ <worktree>/.husky/_`) makes the hooks run,
  but read the hook files first (see "Before you let a worktree's hooks run"
  below).

## Running tests, builds and hooks

- Test runners often **ignore `.worktrees/`** (e.g. Jest
  `testPathIgnorePatterns` / `modulePathIgnorePatterns`), so a normal run finds
  **0 tests**. Read the project's configured lists and override only the option
  whose pattern excludes the worktree root, removing only that exclusion.
  Jest's CLI ignore options replace the configured lists (checked 2026-10;
  recheck if that override behaviour changes), so preserve every other
  exclusion, especially `/e2e/`: dropping it makes Jest load Playwright specs
  and fail with “Playwright Test needs to be invoked via 'npx playwright test'”.
  For a list containing `/node_modules/`, `/\.claude/`, `/.worktrees/` and
  `/e2e/`, use
  `npm test -- --testPathIgnorePatterns='/node_modules/|/\.claude/|/e2e/'`.
  Keep the project's coverage settings for a full-suite check.
  Patterns match the **absolute** path, so an unanchored `/.worktrees/`
  excludes a worktree at `~/.worktrees/…` too. A `<rootDir>/.worktrees/`
  pattern only excludes a nested directory; leave it intact when it does not
  match the worktree root.
- Never point the runner at the worktree **from the main checkout**. A
  `--rootDir <worktree>` (or equivalent) shortcut looks like it avoids both
  problems above, but path aliases resolved from the config (jest
  `moduleNameMapper: "<rootDir>/src/$1"`) keep pointing at the *original* tree.
  Tests then load half their modules from each checkout and fail on mocks that
  no longer match by path. Run with the worktree as the working directory
  instead (`npm --prefix <worktree> test -- …`).
- When a check needs a **before/after** comparison (build output, bundle size, a
  running server), pin both sides: the baseline build overwrites the build
  directory, so a verification run straight after it serves the baseline, not
  your change. Confirm `git log --oneline -1` in the worktree before trusting
  what you observe, and rebuild after switching back.
- A test that runs git in a temp directory must drop the `GIT_*` variables
  first. A hook runs with `GIT_DIR`, `GIT_WORK_TREE` and `GIT_INDEX_FILE`
  exported, every child process inherits them, and the fixture's `git init` and
  `git add` then act on the real repository. Seen in practice: one pre-commit
  run set `core.bare=true` in the shared `.git/config` — after which every
  checkout of the repo fails with `fatal: this operation must be run in a work
  tree` — and replaced the worktree's index with the fixture's files. In a
  linked worktree git also gives the **pre-push** an absolute `GIT_DIR`. From a
  main checkout it gives none, which is why the damage tends to show up only
  from a worktree. Where to drop the variables depends on the runner:
  - Plain Node or `node --test`: at the top of the test file
    (`for (const key of Object.keys(process.env)) if (key.startsWith("GIT_"))
    Reflect.deleteProperty(process.env, key);`), or
    `unset GIT_DIR GIT_WORK_TREE GIT_INDEX_FILE` in shell. Not
    `delete process.env[key]`: `@greenberry/linting-config` rejects it
    (`@typescript-eslint/no-dynamic-delete`).
  - **Jest: not in the test file.** Jest gives each test file its own copy of
    `process.env`, while `child_process` hands a child the real environment,
    so the child still sees `GIT_DIR`. Delete them in a `globalSetup`, which
    runs once in the parent process before the workers start, or pass an
    explicit `env` without them to every git call. Verified in
    the-greenhouse/unicore-template !85, where the per-file delete left
    `core.bare` flipping. Build that `env` as a copy, `{ ...process.env }`,
    and `Reflect.deleteProperty` the `GIT_*` keys from it: in a Next project
    `Object.fromEntries(Object.entries(process.env).filter(…))` fails the
    type check, because Next declares `NODE_ENV` required on `ProcessEnv`
    and the filtered object no longer has it.

  **After any hook run in which a test that calls git failed** (typically
  `Received: <the real HEAD sha>`), run `git config core.bare` and
  `git -C <worktree> status` before anything else: a staged file you never
  touched (`MM .env.production`) is a fixture's. To recover:
  `git --git-dir=<repo>/.git config core.bare false` (with the sandbox bypass:
  the sandbox protects `.git/config`), then `git reset` in the affected
  worktree (index only, files untouched), or
  `git restore --staged --worktree --source=HEAD <path>` for a tracked file
  the fixture also overwrote, and check `git log` for fixture commits.

The commit/push hooks usually do **not** run in a worktree unmodified, so verify
by hand before pushing. Do **not** assume the hook only runs
lint/type-check/test — read the actual hook file(s) (e.g. `.husky/pre-push`,
`.husky/pre-commit`) and run **every** command listed there, verbatim, in the
worktree. Some projects wire in extra steps (migration checks, `drizzle-kit
check`, storybook build, etc.) that are easy to miss if you go from memory
instead of the file. Run the full repo-wide command each hook step invokes (e.g.
`npm run lint:check`), not a git-diff-scoped subset — a partial run can pass
while the real command still fails. Do this immediately before pushing, on the
exact commit being pushed (a later commit added after "looks green" is
unverified). If any command fails, stop and fix it — `--no-verify` skips only
the hook process that cannot execute in a worktree, never the checks it would
have run.

**Before you let a worktree's hooks run** (after copying the hooks directory
in, and on every push with the sandbox bypass, where nothing protects
`.git/config`), read the hook files and check whether a step runs tests that
shell out to git (e.g. `rg -l 'git init|"git"' -g '*.test.*'`) and whether
each hit, or the runner's `globalSetup`, drops the `GIT_*` variables (see
above). If one does not, do not let the hook run it: run that hook's commands
by hand from the worktree, outside any hook, and skip the hook with
`--no-verify` under the justification rule below. The test gets its fix in its
own MR.

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

## Cleanup

Remove the worktree as soon as the branch is pushed
(`git worktree remove --force <path>`); that reclaims `node_modules` and the
build output in one step, and any env file copied in goes with it — never leave
a copied secret behind. One exception: when `skills/local-handover` serves
Storybook or the dev server from the worktree, it stays until the user is done
checking; then that skill stops the servers, drops its database copy and the
worktree goes. To audit what is safe to drop in a **squash-merging**
repo, do not trust `git branch --merged` or ancestry — check
`git cherry <base> <branch>` (patch-id) plus the MR state, and keep anything
with uncommitted changes.
