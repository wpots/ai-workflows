---
name: upstream-rules
description: When shared workflow assets are modified locally, ask the developer if the change should be upstreamed to ai-workflows. If yes, create a branch and a GitLab MR in the canonical Greenberry repository, then return the approval link. Use when the developer edits rules, skills, prompts, workflow adapters, or generic conventions — or explicitly asks to upstream, propose, or share a workflow change.
---

# Upstream Shared Rules

Use this skill when shared workflow assets are modified in a project and the
change may benefit other projects. Also trigger when the developer explicitly
asks to upstream, propose, or share a workflow change.

## When to Trigger

This skill should activate when you detect or are told about:

- Changes to `commands/` in the current project
- Changes to files in `rules/` in the current project
- Changes to files in `.github/prompts/`
- New skills or modifications to existing skills
- Changes to `AGENTS.md` or `CLAUDE.md` that are reusable across projects
- Changes to `AI-WORKFLOWS.md` that improve the shared project guide
- Changes to `.cursor/rules/` that are part of the shared workflow setup
- Changes to `CONVENTIONS.md` that are generic rather than project-specific
- The developer says "upstream this", "propose this rule", "share this with
  other projects", or similar

In synced target projects, treat the `Shared Workflow Assets` section in
`AI-WORKFLOWS.md` as the canonical project-facing definition of reusable
workflow assets.

## Upstream Repository

The canonical collaboration repository is
`gitlab.com/greenberrynl/config/ai-workflows`.

Prefer the local clone at `~/Web/ai-workflows`. Resolve the remote by URL rather
than assuming its name: it is commonly named `gitlab` in an existing local
clone and `origin` in a fresh GitLab clone. Use only the remote whose URL points
to the canonical GitLab repository. Always fetch it before diffing.

## Steps

### 1. Identify the Change

Determine which shared workflow files changed and map them to their upstream
source paths.

Common mappings:

| Project file | Upstream destination |
|---|---|
| `commands/<file>.md` | `commands/<file>.md` |
| `rules/<file>.md` | `rules/<file>.md` |
| `.github/prompts/<file>` | `.github/prompts/<file>` |
| `AI-WORKFLOWS.md` | `templates/project-ai-workflows.md` |
| `AGENTS.md` | `templates/project-AGENTS.md` |
| `CLAUDE.md` | `templates/project-CLAUDE.md` |
| `.github/copilot-instructions.md` | `templates/project-copilot-instructions.md` |
| `.cursor/rules/conventions.mdc` | `templates/project-cursor-conventions.mdc` |

Fetch the current upstream version of each mapped file from
`<gitlab-remote>/main` and diff it against the local source material. If the
file is new upstream, note it as an addition.

Summarize what changed and why.

### 2. Ask the Developer

Present the change and ask:

> This workflow change could benefit other projects.
> Should I upstream it to ai-workflows?
>
> - **What changed**: <summary>
> - **Affected projects**: all projects using ai-workflows
> - **Risk**: <low/medium — does it contradict existing workflow behavior?>

Wait for explicit confirmation before proceeding.

### 3. Classify the Change

Determine where the change belongs in ai-workflows:

| Change type | Destination in ai-workflows |
|---|---|
| Command runbook modification | `commands/<file>.md` |
| New command runbook | `commands/<file>.md` |
| Rule modification | `rules/<file>.md` |
| New rule file | `rules/<file>.md` |
| Prompt modification | `.github/prompts/<file>` |
| New prompt | `.github/prompts/<file>` |
| Skill modification | `skills/<name>/SKILL.md` |
| New skill | `skills/<name>/SKILL.md` |
| Project adapter change | `templates/<file>` and possibly `shared/*.md` |
| Project workflow guide change | `templates/project-ai-workflows.md` |
| Generic workflow policy | `AGENTS.md`, `CLAUDE.md`, or `shared/*.md` |
| Convention that's project-specific | Do NOT upstream — stays in `CONVENTIONS.md` |

If a `CONVENTIONS.md` change mixes project-specific and generic parts, extract
only the generic parts for upstreaming.

### 4. Clone, Branch, and Apply Changes

Use the local clone when it exists. Otherwise clone the canonical GitLab
repository into a temporary directory:

```bash
if [ -d ~/Web/ai-workflows/.git ]; then
  cd ~/Web/ai-workflows
else
  git clone git@gitlab.com:greenberrynl/config/ai-workflows.git \
    /tmp/ai-workflows-upstream
  cd /tmp/ai-workflows-upstream
fi

git remote -v
git fetch <gitlab-remote>
git checkout -b rules/<short-description> <gitlab-remote>/main
```

Resolve `<gitlab-remote>` from the remote URL before running the fetch or
checkout commands.

Apply the changes to the correct file(s).

If the change modifies shared rules or workflow adapters, fetch related files
from the repo and verify it does not contradict existing guidance. If it does,
flag the conflict to the developer and ask how to resolve it.

Three things about committing here, each of which costs a wasted cycle otherwise:

- **Run the commit with the sandbox disabled.** The pre-commit hook runs
  `scripts/generate-adapters.sh`, which calls `mktemp` in the real `TMPDIR`. A
  sandboxed Bash call is denied there, so the hook dies on
  `mktemp: mkstemp failed … Operation not permitted` and **nothing is
  committed** — verify with `git log -1` rather than assuming the commit landed.
- **Expect one drift retry when the change touches `commands/`.** The same hook
  regenerates `.github/prompts/<name>.prompt.md` from `commands/<name>.md`, then
  fails the commit with `Drift detected`. Stage the regenerated prompt and
  commit again. Editing a `shared/*.md` fragment does the same to `CLAUDE.md`,
  `AGENTS.md`, `.github/copilot-instructions.md` and the `templates/` adapters —
  stage all of them; they are generated, never hand-edited.
- **A new `rules/<file>.md` must land in every rule index in the same commit.**
  The validator warns on a rule missing from the `FEATURES.md` rules table and
  from a phase table in `docs/pipeline-map.md`, on top of the `rules/rules.md`
  index and the focused-rules lists in `templates/project-CLAUDE.md` and
  `templates/project-AGENTS.md`. And `docs/pipeline-map.md` is link-checked
  against **this repo**: naming a project-relative path like `docs/adr/` there
  fails the commit with `names \`docs/…\`, which does not exist` — describe
  project paths in words ("the project's ADR folder") instead of path literals.

A change to a `shared/*.md` fragment or anything else the plugin ships also needs
a `## [Unreleased]` entry in `CHANGELOG.md`, and must **not** touch the `version`
in `.claude-plugin/plugin.json` — see the shared workflow-assets rule.

### 5. Create the GitLab MR and capture its approval link

GitLab is the default upstream. `main` is protected, so the change lands via an
MR, never a push to `main`:

Push, then create the MR through the API with the body in a **file**, and set
the reviewer in a second call:

```bash
git push -u <gitlab-remote> rules/<short-description>
```

Write the body to `$TMPDIR/mr-body.md`, then build the payload with a script —
never assemble this JSON in the shell:

```js
// $TMPDIR/build-mr-payload.mjs
import { readFileSync, writeFileSync } from "node:fs";
const dir = process.env.TMPDIR;
writeFileSync(`${dir}/mr-payload.json`, JSON.stringify({
  source_branch: "rules/<short-description>",
  target_branch: "main",
  title: "rules: <short description>",
  description: readFileSync(`${dir}/mr-body.md`, "utf8"),
  remove_source_branch: true,
  squash: true,
}));
```

```bash
node "$TMPDIR"/build-mr-payload.mjs
glab api "projects/greenberrynl%2Fconfig%2Fai-workflows/merge_requests" \
  -X POST -H "Content-Type: application/json" --input "$TMPDIR"/mr-payload.json
glab mr update <iid> -R greenberrynl/config/ai-workflows --reviewer wieteke.pots
```

**`glab mr create` cannot carry a real MR body.** There is no
`--description-file` flag (it errors `Unknown flag`), `-d` takes a *string*, and
`-d -` opens an editor an agent cannot use. Any body worth writing has backticks,
tables, and `${...}`-shaped text, so passing it as a shell argument means either
mangling it or reaching for the command substitution and heredocs the autonomy
rules forbid. A file plus `--input` has neither problem. `glab mr create` is
still fine for a throwaway one-line description.

**Two calls, not one.** The `glab api` hazard is narrow and specific: passing the
reviewer as `--field "reviewer_ids[]=<id>"` sends the bracket as a literal JSON
key and silently opens the MR with **no reviewer**. Creating with `--input` and
then setting the reviewer with `glab mr update` avoids it entirely — `--reviewer`
takes a username, so no user-id lookup is needed either.

**Every `glab` call names the repo.** The API path above is explicit, but every
`glab mr` subcommand — `update`, `view` — defaults to the **current directory's**
git remote, so `-R greenberrynl/config/ai-workflows` is required on each one.
Without it they resolve against the originating project and report on the wrong
MR, or claim it does not exist.

If you do fall back to `glab mr create` for a one-line description, pass `-H
greenberrynl/config/ai-workflows` as well: `-R` sets only the *target*, and the
head (source) project still comes from the current directory's remote, so from a
project checkout it fails with
`422 [Source project is not a fork of the target project]`.

**The reviewer is mandatory, and verified.** An `ai-workflows` MR without
`wieteke.pots` as reviewer is not done. Read it back before reporting — the
create call returns `"reviewers": []`, so the only proof is the follow-up:

```bash
glab api "projects/greenberrynl%2Fconfig%2Fai-workflows/merge_requests/<iid>" \
  | jq '{iid, web_url, state, reviewers: [.reviewers[]?.username]}'
```

**GitLab accepts a review request from the MR author.** This looks like a
contradiction the first time — the shared rule says never to assign the MR
author, and on `ai-workflows` the maintainer usually *is* the author — so state
it plainly rather than stalling on it: `--reviewer wieteke.pots` succeeds and the
reviewer sticks. The never-assign-the-author line governs *other* repos, where
picking a reviewer would be a guess. GitHub does refuse it, which is one more
reason these MRs live on GitLab.

MR body should include:

- What changed and why
- Which project originated the change
- Rule, prompt, skill, or template files affected
- Any projects that may need re-sync after merge

### 6. Post-MR Guidance

Return a concise handoff with the actual URL — never merely say a review was
created:

> Ready for approval:
> - GitLab MR: <gitlab_mr_url>

If the command fails or does not return a URL, report that failure clearly and
do not claim the review exists.

After the GitLab MR is merged, remind the developer:

> Once merged, re-run `sync.sh --project <path>` on each project that uses
> ai-workflows rules to pick up the changes.

If the developer also has a global ai-workflows setup (`~/Web/ai-workflows`),
suggest running `git pull && ./scripts/sync.sh` there as well — but do not
assume this exists.

## Constraints

- Never upstream project-specific conventions (stack, structure, scripts)
- Always ask before creating a branch or PR
- Never force-push to main
- Always diff against the latest upstream state, not a stale local copy
- Use only the remote that resolves to the canonical GitLab repository
- After creating a review, always return the GitLab MR URL so the developer can
  approve it directly
- Always request review from `wieteke.pots` on the MR, and verify it is set
  before reporting — never leave an upstream MR without a reviewer
- GitLab `main` is protected and enforces a committer-email push rule — reach it
  only via a Merge Request, never a direct or force push
