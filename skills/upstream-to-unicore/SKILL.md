---
name: upstream-to-unicore
description: Upstream a reusable change from a synced Greenberry project (e.g. the RefugeeWork website) into the unicore-template repo via a GitLab MR, adapting project-specific bits to the template's conventions. Use when the user asks to upstream/port/share something to unicore, the unicore-template, or the project template.
---

# Upstream to Unicore Skill

Use this skill when a change made in a synced Greenberry project is generic
enough to belong in the shared project template, and the user wants it landed in
**unicore-template** rather than kept only in the origin project.

This is distinct from `upstream-rules`: that skill upstreams **workflow assets**
(rules, skills, prompts) to `ai-workflows`. This skill upstreams **template
code/config** (build scripts, config files, boilerplate, utilities) to the
Next.js project template.

## Target Repository

| | |
|---|---|
| Repo | `greenberrynl/the-greenhouse/unicore-template` (GitLab) |
| URL | https://gitlab.com/greenberrynl/the-greenhouse/unicore-template |
| Local clone | `~/Web/unicore-template` (prefer this — always `git fetch` first) |
| Default target branch | `experimental-new-setup` (the active redesign line) — **confirm with the user** before branching; it may differ per change |

The template is a **generic boilerplate**. It must stay client-agnostic: no
RefugeeWork/RFW naming, no Jira ticket references, no project-specific data,
routes, or copy.

### Environment / build convention

The template wraps Next commands with dotenvx directly (no loader script):

```
dotenvx run -f .env.${NEXT_PUBLIC_ENVIRONMENT:-development} --convention=nextjs -- next <cmd>
```

When porting an npm script from a project that uses a different wrapper (e.g.
the website's `scripts/dotenvx-loader.sh`), **rewrite it to the template's
dotenvx convention** — do not copy the origin wrapper.

## Steps

### 1. Identify the source change

Determine exactly what is being upstreamed:

- a specific commit / branch / diff in the current project, or
- a set of files the user names.

Show the diff (`git show <ref>` / `git diff`) and confirm the scope with the user.

### 2. Assess portability and adapt

For each file in the change, decide: **port as-is**, **adapt**, or **drop**.

Drop or rewrite anything project-specific:

- Client naming (RefugeeWork, RFW, domain-specific terms) → generic template naming
- Jira ticket references (`RFW-xxx`) → remove entirely
- Project-only wrappers/paths (e.g. `scripts/dotenvx-loader.sh`) → template equivalent
- Project-specific docs (per-route baselines, audit snapshots) → drop, or replace with a short generic usage note
- Project-specific env vars, routes, collections, copy → drop or generalise

Before writing, fetch the **current** template version of each target file from
`origin/<target-branch>` and diff against your adapted change — the template may
already differ from the origin project (different scripts, config, deps).

Summarise: what lands, what was adapted, what was dropped and why.

### 3. Prepare the clone and branch

Read [../upstream-rules/references/upstream-mr.md](../upstream-rules/references/upstream-mr.md)
first: it is the full rule for landing a change in `unicore-template` (branch, GitLab
MR, no reviewer), and the always-on `CLAUDE.md` only points at it.

Git write ops may need the sandbox disabled (see the parent repo's git-config
sandbox note). Run:

```bash
cd ~/Web/unicore-template
git fetch origin
git checkout -b <type>/<short-description> origin/<target-branch>
```

Use a descriptive English branch name (e.g. `chore/opt-in-bundle-analysis`).
Never Dutch slugs.

### 4. Apply the adapted change

Edit the template files with the adapted content. Match the template's existing
style, script ordering, and README section conventions — read the neighbouring
lines first.

### 5. Verify

Do the cheapest meaningful check for the change:

- config/script-only change → confirm JSON validity and that the script mirrors
  the template's existing wrapper convention
- code change → `npm i` (if needed) + `npm run type-check` on the touched area
- if a full install/build isn't feasible in this environment, say so explicitly
  rather than claiming it passed

### 6. Push and open the MR

Ask for confirmation before pushing (unless the user already gave a blanket
go-ahead). Then:

```bash
git push -u origin <type>/<short-description>
glab mr create -R greenberrynl/the-greenhouse/unicore-template \
  -H greenberrynl/the-greenhouse/unicore-template \
  --source-branch <type>/<short-description> \
  --target-branch <target-branch> \
  --title "<type>: <short description>" \
  --description "<generated body>" --yes
```

**Name the head repo with `-H`.** `-R` only sets the *target*; the head (source)
project still defaults to the git remote of the **current directory**, which
during this skill is usually the originating project rather than the template
clone. glab then offers the wrong source project and fails with
`422 [Source project is not a fork of the target project]`. `-H` pins the source
to the template and makes the command cwd-independent.

**No reviewer flag.** Do not pass `--reviewer` — the template's reviewer is a
human decision, and an agent guessing one (or assigning the author) is worse
than none. Open the MR without a reviewer, then say in the hand-off that a
reviewer still has to be assigned. Only pass `--reviewer <username>` when the
user named that person in this session. Verify the MR with
`glab mr view <iid> -R greenberrynl/the-greenhouse/unicore-template` before
reporting — it resolves against the current directory's repo without `-R`.

**glab API fallback**: `glab` API calls can fail in a sandboxed/TLS-restricted
environment (`tls: failed to verify certificate`). If `glab mr create` fails:

1. Retry the `glab` command with the sandbox disabled.
2. If it still fails, the `git push` output prints a
   `https://gitlab.com/.../merge_requests/new?...` URL — return that link so the
   user can open the MR in the browser. Never claim an MR exists if the API call
   did not return one.

MR body should include:

- What changed and why
- **Origin**: which project + commit this was ported from
- **Adaptation notes**: what was changed/dropped for the template (e.g. dotenvx
  wrapper rewritten, project docs dropped)
- Any follow-up needed

### 7. Hand off

Return the actual MR URL (or the `merge_requests/new` link on API failure) and a
one-line summary. Do not leave the branch half-pushed without telling the user
its state.

## Constraints

- Every change lands via an MR — never a direct push to the target branch. The
  MR is opened without a reviewer; a human assigns one.
- Keep the template client-agnostic — no RefugeeWork/RFW naming, no Jira refs.
- Always adapt project-specific wrappers/paths to template conventions; never
  copy them verbatim.
- Always branch off the latest `origin/<target-branch>`; confirm the target
  branch with the user (default `experimental-new-setup`).
- Ask before pushing / creating the MR unless given a blanket go-ahead.
- Branch names in English.
- Report the MR URL truthfully; on `glab` API failure, return the browser
  `merge_requests/new` link instead of asserting success.
