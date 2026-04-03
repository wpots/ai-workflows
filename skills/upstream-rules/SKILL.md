---
name: upstream-rules
description: When rules, skills, or CONVENTIONS.md are modified locally, ask the developer if the change should be upstreamed to ai-workflows. If yes, create a branch and PR on the ai-workflows repo. Use when the developer edits rules/, skills/, or conventions — or explicitly asks to upstream, propose, or share a rule change.
---

# Upstream Rules Skill

Use this skill when rules, skills, or conventions are modified in a project and
the change may benefit other projects. Also trigger when the developer
explicitly asks to upstream, propose, or share a rule change.

## When to Trigger

This skill should activate when you detect or are told about:

- Changes to files in `rules/` in the current project
- Changes to `CONVENTIONS.md` that are generic (not project-specific)
- New skills or modifications to existing skills
- The developer says "upstream this", "propose this rule", "share this with
  other projects", or similar

## Upstream Repository

The canonical ai-workflows repo is `wpots/ai-workflows` on GitHub.
All diffs and PRs target this remote — never assume a local clone exists.

## Steps

### 1. Identify the Change

Fetch the current upstream version of the file from GitHub and diff against
the local project copy:

```bash
gh api repos/wpots/ai-workflows/contents/rules/<file>.md \
  --jq '.content' | base64 -d > /tmp/upstream-<file>.md
diff <project>/rules/<file>.md /tmp/upstream-<file>.md
```

If the file is new (doesn't exist upstream), note it as an addition.

Summarize what changed and why.

### 2. Ask the Developer

Present the change and ask:

> This change to `<file>` could benefit other projects.
> Should I upstream it to ai-workflows?
>
> - **What changed**: <summary>
> - **Affected projects**: all projects using ai-workflows rules
> - **Risk**: <low/medium — does it contradict existing rules?>

Wait for explicit confirmation before proceeding.

### 3. Classify the Change

Determine where the change belongs in ai-workflows:

| Change type | Destination in ai-workflows |
|---|---|
| Rule modification | `rules/<file>.md` |
| New rule file | `rules/<file>.md` |
| Convention that's generic | `rules/` (extract from CONVENTIONS.md) |
| Convention that's project-specific | Do NOT upstream — stays in CONVENTIONS.md |
| Skill modification | `skills/<name>/SKILL.md` |
| New skill | `skills/<name>/SKILL.md` |

If a CONVENTIONS.md change mixes project-specific and generic parts, extract
only the generic parts for upstreaming.

### 4. Clone, Branch, and Apply Changes

Clone the upstream repo into a temporary directory (or use the local clone
if it exists at `~/Web/ai-workflows`):

```bash
# Prefer local clone if available and clean
if [ -d ~/Web/ai-workflows/.git ]; then
  cd ~/Web/ai-workflows
  git fetch origin
  git checkout main
  git pull
else
  gh repo clone wpots/ai-workflows /tmp/ai-workflows-upstream
  cd /tmp/ai-workflows-upstream
fi
git checkout -b rules/<short-description>
```

Apply the changes to the correct file(s).

If the change modifies shared rules, fetch related files from the repo and
verify it doesn't contradict existing rules. If it does, flag the conflict
to the developer and ask how to resolve.

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
- Rule files affected
- Any projects that may need re-sync after merge

### 6. Post-PR Guidance

After the PR is created, remind the developer:

> Once merged, run `sync.sh` globally and `sync.sh --project` on
> each project to pick up the changes.

## Constraints

- Never upstream project-specific conventions (stack, structure, scripts)
- Always ask before creating a branch or PR
- Never force-push to main
- Always diff against the GitHub remote, not a potentially stale local copy
