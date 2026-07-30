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

### 5. Create the GitLab MR and capture its approval link

GitLab is the default upstream. `main` is protected, so the change lands via an
MR, never a push to `main`:

```bash
git push -u <gitlab-remote> rules/<short-description>
gitlab_mr_url=$(glab mr create -R greenberrynl/config/ai-workflows \
  -H greenberrynl/config/ai-workflows \
  --source-branch rules/<short-description> \
  --target-branch main \
  --reviewer wieteke.pots \
  --title "rules: <short description>" \
  --description "<generated body>" --yes)
printf 'GitLab MR: %s\\n' "$gitlab_mr_url"
```

**Name the head repo with `-H`.** `-R` only sets the *target*; the head (source)
project still defaults to whatever git remote the **current directory** has. Run
this from a project checkout — which is normal, since the change originates
there, and an agent forbidden from `cd`-ing cannot leave it — and glab offers
that project as the source, failing with
`422 [Source project is not a fork of the target project]`. `-H` pins the source
to the canonical repo and makes the command cwd-independent, so it works both
from `~/Web/ai-workflows` and from the originating project.

**The reviewer is mandatory.** `--reviewer wieteke.pots` is part of the MR, not
an optional extra — an MR without that reviewer is not done. If the flag is
unsupported or silently dropped, set it afterwards with
`glab mr update <iid> -R greenberrynl/config/ai-workflows --reviewer wieteke.pots`
and verify with `glab mr view <iid> -R greenberrynl/config/ai-workflows` before
reporting. Both need `-R` for the same reason as above: without it they resolve
against the current directory's repo and report on the wrong project — or claim
the MR does not exist.

Do **not** hand-roll this with `glab api …/merge_requests`. It works, but
`--field "reviewer_ids[]=<id>"` sends the bracket as a literal JSON key and
silently creates the MR with **no reviewer**; getting one attached then needs a
raw JSON body plus an explicit `-H "Content-Type: application/json"`. `-H` on
`glab mr create` avoids the whole detour.

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
