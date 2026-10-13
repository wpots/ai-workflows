---
name: upstream-to-unicore
description: Upstream reusable work from a Greenberry project into the unicore-template via a GitLab MR on the release line or lines the change is needed on — v4 (the CMS-preset line) or v3 (development) — adapting project-specific bits and reading the template's conventions from the target line itself. Also runs as a harvest, listing the template-owned changes a project made since the template commit it started from, so upstreaming does not wait for someone to remember. Use when the user asks to upstream, port or share something to unicore, the unicore-template or the project template, asks what should go back to the template ("template harvest", "wat moet terug naar de template"), or when mr-merged or close-sprint hands over changes to template-owned files.
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
| Local clone | `~/Web/unicore-template` — `git fetch origin` first; writes to its `.git` and every network call need the sandbox bypass |

The template has two release lines. Take the target from this table — never
from the repository's default branch, and never from memory:

| Line | Branch | Status |
| --- | --- | --- |
| v4 | `feat/declarative-cms-presets` | the CMS-preset line, being prepared |
| v3 | `development` | the current line, without presets or `.unicore.json` |

- How the lines relate once v4 is ready — whether v4 replaces `development`,
  and what v3 still takes — is not decided yet. So the target is a choice per
  change: CMS code and changes to the preset setup exist on v4 only; for
  anything else, ask the user whether it goes to v4, v3 or both. Never pick a
  line by default.
- Confirm the branch before you branch off it:
  `git ls-remote --heads origin <branch>`. When it is missing, the line was
  renamed: read the "Versions and lineage" table in the template README on the
  remaining candidate branches, ask the user which one it is, and update this
  table through `skills/upstream-rules` — the README table and this table change
  together.
- A change for both lines is two small MRs, one per line.
- The template is CMS-agnostic. CMS-specific code goes to `src/vendor/<cms>/`
  on v4, with its dependencies, scripts and environment variables declared in
  `config/cms-presets.json`. There are no CMS variant branches to target;
  `development-payloadcms` is a porting source until the Payload preset is
  complete, never a target.

**Lineage.** A v4 project carries `.unicore.json`, written by the template's
setup: `template.version`, `template.commit` and the `preset`. The paths the
template owns are the `owned` globs in `template.json` at that commit. A v3
project has no record, and its history was replaced when it was created (the
template's `readme-checks` hook demands it), so no merge-base can find its
starting point; Step 1 estimates it. Projects are created from the copy
`greenberrynl/project-templates/unicore-template`, which is updated by hand
until DEV-694 publishes it from this repository; a commit that copy made on
its own does not exist here, and Step 1 then falls back to the version tag.

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
  exists — that hook only ships with the template): estimate the base. Fetch
  the v3 line into the project
  (`git -C <project> fetch --no-tags https://gitlab.com/greenberrynl/the-greenhouse/unicore-template.git development`),
  take the 30 most recent first-parent commits before the project's first
  commit
  (`git -C <project> rev-list --first-parent --before=<first-commit-date> -n 30 FETCH_HEAD`),
  and pick the one with the smallest
  `git -C <project> diff --shortstat <commit> HEAD -- <owned globs>`. For v3,
  the owned globs are the v4 `template.json` list without `agents/**` and
  `src/vendor/**`. Report the base as **estimated**, and offer the project a
  one-file MR that writes `.unicore.json` with that commit, `"version": null`
  and `"estimated": true`, so the next run starts exact.
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
git -C ~/Web/unicore-template fetch origin
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
- **v3** — the `package.json` scripts that the CI file and the hooks call.
- The template's own pre-commit hook cannot pass inside the template repository
  (it treats the template as a project and demands a clean history), so
  commits there use `--no-verify`. Say so, and list the commands you ran by
  hand instead.
- Anything that could not run (no package manager, missing dependencies) is
  reported as not run. Never report a pass you did not see.

## Step 6 — Push and open the MR

Ask before pushing, unless the user gave a blanket go-ahead. Push from the
clone, then create the MR. A body with backticks or tables goes through the API
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
- **Line**: v3 or v4, and why this line
- **Adaptation notes**: what was rewritten or dropped for the template
- **Verification**: the commands from Step 5 and their results, including what
  did not run
- follow-ups, such as the v3 counterpart of a fix

## Step 7 — Keep it moving

- Report the MR URL, its line, and that a human still has to assign a reviewer.
  Add the open queue from Step 0 with this MR included.
- Offer `skills/watch-mrs` on the MR, so approval, review comments and pipeline
  failures come back into the session.
- For a change that goes to both lines, name the second line's MR as an open
  action until it exists.
- Remove the worktree after the push. Never leave a branch half-pushed without
  saying what state it is in.

## Constraints

- Every change lands via an MR on a line branch from the table — never a direct
  push, and never on a branch that is missing from the table.
- The line is the user's choice per change until the team decides how v3 and
  v4 relate; only CMS code and preset-setup changes are fixed to v4.
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
