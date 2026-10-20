---
name: upstream-to-unicore
description: Upstream reusable work from a Greenberry project into the unicore-template via a GitLab MR on its current line — v4, the CMS-preset line on `development` (v3 is frozen as the tag `v3.0.0`) — adapting project-specific bits and reading the template's conventions from the target line itself. Also runs as a harvest, listing the template-owned changes a project made since the template commit it started from, so upstreaming does not wait for someone to remember. Use when the user asks to upstream, port or share something to unicore, the unicore-template or the project template, asks what should go back to the template ("template harvest", "wat moet terug naar de template"), or when mr-merged or close-sprint hands over changes to template-owned files.
metadata:
  owner: wieteke.pots
---

# Upstream to Unicore Skill

Brings reusable project work back into **unicore-template**. This is distinct
from `upstream-rules`, which upstreams **workflow assets** (rules, skills,
prompts) to `ai-workflows`; this skill carries **template code and config**.

The finish line is a **merged** template MR, not an opened one. In 2026, four
upstream MRs sat open for months on a branch nobody merged. So every run starts
with the open queue (Step 0) and ends with a hand-off that keeps the MR moving
(Step 7).

## Template, lines and lineage

| | |
|---|---|
| Repo | `greenberrynl/the-greenhouse/unicore-template` (GitLab) |
| URL | https://gitlab.com/greenberrynl/the-greenhouse/unicore-template |
| Local clone | `~/Web/unicore-template` — `git fetch --prune origin` first (without `--prune`, a deleted branch stays readable as `origin/<branch>`); writes to its `.git` and every network call need the sandbox bypass |

The template has two release lines. Take the target from this table — never
from memory:

| Line | Where | Status |
| --- | --- | --- |
| v4 | `development` | the current line, with CMS presets and `.unicore.json` |
| v3 | tag `v3.0.0` (`df6c02f`) | frozen: no presets or `.unicore.json`, CMS variants on branches |

- The target is `development`. v3 takes no new work: a fix that v3 projects
  need is made in those projects. Only when the user asks for a shared v3 fix
  does it go to a `v3` branch cut from the tag; that branch is new, so it joins
  this table and the README table first.
- Confirm the branch before you branch off it:
  `git ls-remote --heads origin <branch>`. When it is missing, the line moved:
  read the "Versions and lineage" table in the template README on `development`,
  ask the user, and update this table through `skills/upstream-rules` — the
  README table and this table change together.
- The template is CMS-agnostic. CMS-specific code goes to `src/vendor/<cms>/`
  on v4, with its dependencies, scripts and environment variables declared in
  `config/cms-presets.json`. There are no CMS variant branches to target;
  `development-payloadcms` and `development-prepr` are porting sources, never
  targets.

**Lineage.** A v4 project carries `.unicore.json`, written by the template's
setup: `template.version`, `template.commit` and the `preset`. The paths the
template owns are the `owned` globs in `template.json` at that commit. A v3
project has no record, and its history was replaced when it was created (the
template's `readme-checks` hook demands it), so no merge-base can find its
starting point; Step 1 estimates it.

**The copy in Project templates.** A project is made in two steps. First,
GitLab's Create from template on `greenberrynl/project-templates/unicore-template`
gives the new project its settings: merge method, protected branches, and force
push on `main` so the history can be replaced. The code itself is a clone of
**this** repository: README step 1 clones it under its old path
`greenberrynl/unicore/typescript-template`, which redirects here. The setup runs
on that clone and the result is force-pushed over the copy's content. So
`.unicore.json` always names a commit in this repository, and the copy's code is
never used. Never maintain code in that copy, and never open an MR or an issue
there. Create from template copies every MR and issue into each new project, and
the copied MRs use up the first MR numbers: one project's first MR became `!50`
that way.

## Step 0 — The open queue

List the open template MRs before adding one:

```bash
glab mr list -R greenberrynl/the-greenhouse/unicore-template --output json \
  | jq -r '.[] | "!\(.iid) \(.created_at[0:10]) \(.source_branch) -> \(.target_branch) draft:\(.draft) \(.title)"'
```

Report them, and flag any MR whose target branch is missing from the line table
and any MR open for more than 30 days. When three or more non-draft MRs are
open, offer to help land or close those first (rebase, answer review, retarget)
before opening another: a queue nobody drains is how the template fell behind.
The user decides; this step never closes or retargets anything on its own.

## Step 1 — Find the project's base

Run against the source project's checkout (`<project>`).

- **v4 project** (`.unicore.json` exists): the base is `template.commit`. Read
  the owned globs of that commit:
  `glab api "projects/greenberrynl%2Fthe-greenhouse%2Funicore-template/repository/files/template.json/raw?ref=<commit>"`.
  When `commit` is `null` or the template does not have it, use the tag
  `v<template.version>` instead and say so.
- **v3 project** (no `.unicore.json`, but `scripts/husky/readme-checks.js`
  exists — that hook only ships with the template): estimate the base. A v3
  project started from the tag's line or from a CMS variant branch, whose
  commits are not on the tag, so look at all three: `refs/tags/v3.0.0`,
  `development-payloadcms` and `development-prepr`. For each, fetch it into the
  project
  (`git -C <project> fetch --no-tags https://gitlab.com/greenberrynl/the-greenhouse/unicore-template.git <ref>`)
  and take the 30 most recent first-parent commits before the project's first
  commit
  (`git -C <project> rev-list --first-parent --before=<first-commit-date> -n 30 FETCH_HEAD`).
  Across all of them, pick the one with the smallest
  `git -C <project> diff --shortstat <commit> HEAD -- <owned globs>`, and name
  the ref it came from. For v3, the owned globs are the v4 `template.json` list
  without `agents/**` and `src/vendor/**`. Report the base as **estimated**,
  and offer the project a one-file MR that writes `.unicore.json` with that
  commit, `"version": null` and `"estimated": true`, so the next run starts
  exact.
- **Neither marker**: the project was not created from the template. Stop.

## Step 2 — Pick what goes up

Two ways in, one output: a list of files with a verdict per file.

- **Named change** — a commit, branch, diff or set of files the user names.
  Show it (`git show <ref>` / `git diff`) and confirm the scope.
- **Harvest** — fetch the base into the project as in Step 1, then
  `git -C <project> diff --stat <base> HEAD -- <owned globs>`. When
  `skills/mr-merged` or `skills/close-sprint` handed over, narrow it to that
  MR's files or that sprint's range.

For each file decide one of:

- **upstream** — generic as it stands;
- **adapt** — generic once project-specific bits go (Step 3);
- **drop** — project-specific;
- **already upstream** — the target line made the same change since the base
  (`git -C ~/Web/unicore-template diff <base> origin/<line-branch> -- <path>`).

When a change exists only because the project has something the template
lacks — a `next.config.ts` flag, a route layout such as the Payload API path, a
dependency — ask whether that is the team's direction before you drop it. If it
is, the missing piece is an upstream of its own, and the changes that depend on
it go into that MR or after it.

When the template moved and the project did not, that is a **downstream**
update for the project. List those separately; never mix them into a template
MR. Present one table, let the user pick, and group the picks by theme into MRs
that each stay reviewable (`rules/mr-sizing.md`) — neither one MR per file nor
one MR for everything.

## Step 3 — Adapt to the target line

Read the target line's own conventions before writing, not this skill's memory
of them:

- `package.json` on `origin/<line-branch>`: `packageManager` and the scripts.
  The env wrapper and the package manager differ between the lines and change
  over time.
- `agents/instructions/` (v4), `README.md` and `CHANGELOG.md`.
- The current version of every target file on `origin/<line-branch>`. Diff
  your adapted change against it.

Drop or rewrite anything project-specific:

- client naming and domain terms → generic template naming
- tracker references (`RFW-123`) → removed
- project-only wrappers and paths → the line's own equivalent
- project docs (per-route baselines, audit snapshots) → dropped, or one short
  generic usage note
- project env vars, routes, collections and copy → dropped or generalised
- CMS-specific code → `src/vendor/<cms>/` plus `config/cms-presets.json` (v4)

Summarise what lands, what was adapted, what was dropped, and why.

## Step 4 — Branch and apply

Read [../upstream-rules/references/upstream-mr.md](../upstream-rules/references/upstream-mr.md)
first: it is the full rule for landing a change in `unicore-template` (branch,
GitLab MR, no reviewer).

Work in a worktree of the clone
([../create-pr/references/worktrees.md](../create-pr/references/worktrees.md)),
branched off the latest target line, with a descriptive English branch name:

```bash
git -C ~/Web/unicore-template fetch --prune origin
git -C ~/Web/unicore-template worktree add --no-track -b <type>/<short-description> \
  ~/.worktrees/unicore-template-<slug> origin/<line-branch>
```

Match the neighbouring style. On v4, add a line to the top (unreleased) section
of `CHANGELOG.md`; the `template.json` version bump and the tag belong to the
release, not to this MR.

## Step 5 — Verify like CI

Read the target line's `.gitlab-ci.yml` and `.husky/` and run what they run:

- **v4** — CI checks the **generated** project, not the raw template, which
  holds unselected vendor code. Clone the branch into the scratchpad and run
  `node scripts/setup-project.js --name check --cms none --skip-install` (plus
  the preset the change touches, when that preset is `available`). Then run the
  line's `lint:check`, `type-check` and `test`; use `jest --runInBand` when
  workers fail to load native bindings.
  `node scripts/check-presets.js lint:check type-check test` runs all three
  for every available preset at once, from the git index, so `git add` first.
- **A change to `next.config.ts`, a layout, a route handler or route segment
  config** also gets a build and a request: CI never runs `next build`, and
  lint, type-check and tests stay green while the build fails or a route
  answers with the wrong status. Generate the project in the scratchpad, clone
  `node_modules` into it with `cp -Rc` (Turbopack rejects a symlink), run
  `next build`, then `next start` and `curl -w "%{http_code}"` the routes the
  change touches. The Payload preset needs a database: a throwaway
  `docker run -d --name <slug> -e POSTGRES_PASSWORD=<pw> -p <free port>:5432 postgres:17`
  (5432 is usually a project's own), then `payload migrate` with `NODE_ENV`,
  `PAYLOAD_DB_URL` and `PAYLOAD_SECRET` set. Remove the container afterwards.
- **v3** (a `v3` branch only) — the `package.json` scripts that the CI file
  and the hooks call.
- In the worktree from Step 4 the template's git hooks do not run: husky
  creates its hooks path, `.husky/_`, at install, so a fresh worktree has none.
  `pnpm install` in the worktree takes seconds from the pnpm store and creates
  it, after which a commit runs the pre-commit as is; symlink that
  `node_modules` into further worktrees. A worktree without its own install
  runs the hooks' checks by hand with the line's package manager before
  committing, and lists them in the MR. Read the hook files for the current
  list; on 2026-10-19 they ran:
  - pre-commit: `gitleaks` on the staged change (when installed), then
    `node scripts/husky/index.js`, which recognises the template repository by
    its remote and passes there. Then `lint` and `lint:styles`, both with
    `--fix`, so commit their fixes, and the type-check: on v4
    `node scripts/check-presets.js type-check` (Node from `.nvmrc`, pnpm on
    `PATH`); on a `v3` branch `type-check`.
  - pre-push: on v4 `node scripts/check-presets.js lint:check type-check test`,
    the scratchpad run above; on a `v3` branch `test`.
  - Push from the worktree, not from the clone: the clone's hooks run against
    the clone's own checkout and `node_modules`, not the branch you push.
- Anything that could not run (no package manager, missing dependencies) is
  reported as not run. Never report a pass you did not see.

## Step 6 — Push and open the MR

Ask before pushing, unless the user gave a blanket go-ahead. Push from the
worktree (`git -C <worktree> push origin <branch>`), then create the MR. A body with backticks or tables goes through the API
with `--input <file>`, as the upstream MR rule describes; a plain body can use:

```bash
glab mr create -R greenberrynl/the-greenhouse/unicore-template \
  -H greenberrynl/the-greenhouse/unicore-template \
  --source-branch <type>/<short-description> \
  --target-branch <line-branch> \
  --title "<type>: <short description>" \
  --description "<generated body>" --yes
```

- **Name the head repo with `-H`.** `-R` only sets the target; the source
  project defaults to the current directory's remote, which is usually the
  originating project, and glab then fails with
  `422 [Source project is not a fork of the target project]`.
- **No reviewer flag.** The template's reviewer is a human decision. Pass
  `--reviewer` only for a person the user named in this session.
- Verify with `glab mr view <iid> -R greenberrynl/the-greenhouse/unicore-template`
  before reporting.
- `glab` can fail with `tls: failed to verify certificate` in the sandbox:
  retry with the bypass. If it still fails, return the
  `merge_requests/new?…` link that `git push` printed. Never claim an MR the
  API did not return.

MR body:

- what changed and why
- **Origin**: project and commit, or "harvest of `<project>` since `<base>`"
- **Line**: v4 (`development`), or the `v3` branch and why
- **Adaptation notes**: what was rewritten or dropped for the template
- **Verification**: the commands from Step 5 and their results, including what
  did not run
- follow-ups, such as the v3 projects that need the same fix

## Step 7 — Keep it moving

- Report the MR URL, its line, and that a human still has to assign a reviewer.
  Add the open queue from Step 0 with this MR included.
- Offer `skills/watch-mrs` on the MR, so approval, review comments and pipeline
  failures come back into the session.
- For a fix that v3 projects also need, name those projects as an open action.
- Remove the worktree after the push. Never leave a branch half-pushed without
  saying what state it is in.

## Constraints

- Every change lands via an MR on a line branch from the table — never a direct
  push, and never on a branch that is missing from the table.
- The target is `development` (v4); a `v3` branch only on the user's explicit
  ask.
- Keep the template client-agnostic and CMS-agnostic: no client naming, no
  tracker references, and CMS code only under `src/vendor/<cms>/` on v4.
- Read the target line's conventions at run time; never carry a wrapper, path,
  script or package manager over from the origin project or from this skill's
  text.
- Triggered from `skills/mr-merged` or `skills/close-sprint`, the harvest is a
  proposal: it runs on the user's go.
- Ask before pushing or creating the MR, unless given a blanket go-ahead.
- Report the MR URL truthfully; on a `glab` API failure, return the browser
  `merge_requests/new` link instead of asserting success.
