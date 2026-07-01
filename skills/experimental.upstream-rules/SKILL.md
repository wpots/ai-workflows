---
name: upstream-rules
description: When shared workflow assets are modified locally, ask the developer if the change should be upstreamed to ai-workflows. If yes, create a branch and PR on the ai-workflows repo. Use when the developer edits rules, skills, prompts, workflow adapters, or generic conventions — or explicitly asks to upstream, propose, or share a workflow change.
---

# Upstream Rules Skill

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

## Upstream Repositories (two remotes)

ai-workflows lives on **two remotes that must both receive every shared-asset
change**:

| Remote | Repo | Role |
|---|---|---|
| `origin` | `wpots/ai-workflows` (GitHub) | Canonical source of truth |
| `gitlab` | `greenberrynl/config/ai-workflows` (GitLab) | Greenberry team distribution |

Prefer the local clone at `~/Web/ai-workflows` (it has both remotes). Always
fetch both before diffing so you compare against the latest state of each.

**Their histories are divergent and cannot be unified — do not try.** GitLab was
seeded as an independent import, so the two `main` branches share no common
ancestor. Do **not** attempt to fix this by force-pushing one lineage onto the
other or re-seeding: gitlab `main` is a **protected branch** *and* enforces a
committer-email push rule that rejects GitHub's `*.noreply.github.com` committer
identities, so GitHub's history can never be replayed onto GitLab (both were
tried and both are hard-blocked). Treat the two as separate lineages that must
be kept **content-identical**, applying each change to both (steps 5 + 5b).
Never re-seed either remote from a fresh import — that is what caused the
divergence in the first place.

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

Fetch the current upstream version of each mapped file from GitHub and diff it
against the local source material. If the file is new upstream, note it as an
addition.

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

Clone the upstream repo into a temporary directory (or use the local clone
if it exists at `~/Web/ai-workflows`):

```bash
if [ -d ~/Web/ai-workflows/.git ]; then
  cd ~/Web/ai-workflows
  git fetch origin
  git fetch gitlab          # keep the GitLab lineage current too
  git checkout main
  git pull origin main
else
  gh repo clone wpots/ai-workflows /tmp/ai-workflows-upstream
  cd /tmp/ai-workflows-upstream
fi
git checkout -b rules/<short-description> origin/main
```

Apply the changes to the correct file(s).

If the change modifies shared rules or workflow adapters, fetch related files
from the repo and verify it does not contradict existing guidance. If it does,
flag the conflict to the developer and ask how to resolve it.

### 5. Create PR

Push the branch and open a PR against `wpots/ai-workflows`:

```bash
git push -u origin rules/<short-description>
gh pr create \
  --repo wpots/ai-workflows \
  --base main \
  --title "rules: <short description>" \
  --body "<generated body>"
```

PR body should include:

- What changed and why
- Which project originated the change
- Rule, prompt, skill, or template files affected
- Any projects that may need re-sync after merge

### 5b. Mirror the change to GitLab (greenberry)

The same change must also land on the GitLab remote, on **its own lineage**. The
two histories are unrelated, so you cannot merge or cherry-pick the GitHub commit
across — re-apply the patch onto a branch off `gitlab/main`. GitLab `main` is
protected, so it goes in via a Merge Request, never a push to `main`:

```bash
git fetch gitlab main
git checkout -b rules/<short-description>-gitlab gitlab/main
# Re-apply the SAME edit here — apply the diff/patch, not the GitHub commit.
# Fastest path: copy the touched files from the GitHub branch, then commit:
git checkout rules/<short-description> -- <changed paths>
git commit -am "<same conventional message>"
git push gitlab rules/<short-description>-gitlab
glab mr create -R greenberrynl/config/ai-workflows \
  --target-branch main \
  --title "<same title>" \
  --description "<same body>" --yes
```

After both are merged, the two `main` branches should differ only in history,
not content. Verify:

```bash
git fetch origin main && git fetch gitlab main
git diff origin/main gitlab/main -- <changed paths>   # expect: empty
```

### 6. Post-PR Guidance

After **both** the GitHub PR and the GitLab MR are merged, remind the developer:

> Once both are merged, re-run `sync.sh --project <path>` on each project
> that uses ai-workflows rules to pick up the changes.

If the developer also has a global ai-workflows setup (`~/Web/ai-workflows`),
suggest running `git pull && ./scripts/sync.sh` there as well — but do not
assume this exists.

## Constraints

- Never upstream project-specific conventions (stack, structure, scripts)
- Always ask before creating a branch or PR
- Never force-push to main
- Always diff against the latest upstream state, not a stale local copy
- Apply every shared-asset change to **both** remotes (GitHub `origin` and GitLab
  `gitlab`); landing it on only one leaves them out of sync
- GitLab `main` is protected and enforces a committer-email push rule — reach it
  only via a Merge Request, never a direct or force push, and never try to
  reconcile its history with GitHub's
