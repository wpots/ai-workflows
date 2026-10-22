# First Run (Lane 1b) — Reference

The prerequisites and the steps of lane 1b of `skills/start-project`. Read it
before running the lane.

## Prerequisites

Each ok / missing / unknown:

- Node from `.nvmrc`, and the package manager `packageManager` pins
- Docker answers `docker info`. The agent sandbox blocks the socket: run it
  with the bypass, or report it unknown — never as a project failure
- `gitleaks` on `PATH`
- the 1Password CLI signed in (`op whoami`) when `.env.keys.tpl` exists
- the local database port is free: `lsof -nP -iTCP:<port> -sTCP:LISTEN`.
  Another project's Postgres on the same port answers `password authentication
  failed`, which reads like a wrong password
- the browser the installed Playwright expects, when the project runs story
  tests (`test-storybook`)

## The path

In this order, with the scripts `package.json` defines. Read it first, and skip
a step whose script the project does not have:

1. install from the lockfile (`pnpm install --frozen-lockfile`, `npm ci`)
2. `.env.keys` exists, or `env:keys` writes it
3. `test`, in a shell without CMS variables, as CI and a new developer run it
4. `db:up` — **ask first**, it starts a container. Then hand the migrations
   to the developer: name the command (`pnpm run migrate`) and wait for their
   result. Never run `migrate`, `migrate:status` or any other migrate script
   yourself (`rules/payload.md` § Migrations); a step that needs a migrated
   database is **not run** until the developer reports it ran
5. `lint:check`, `type-check`, `build`
6. the hooks: run the commands of `.husky/pre-commit` and `.husky/pre-push` as
   the files list them. When a test shells out to git, check that it drops the
   `GIT_*` variables (`skills/create-pr/references/worktrees.md`); one that
   does not turns the repository bare on a push from a linked worktree

## Report

One table — step · **pass / fail / not run** · the error line, or why it did not
run. Not run is a real answer; a pass you did not see is not.
