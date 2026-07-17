---
name: work-backlog
description: Autonomously pick up the next eligible backlog item from docs/backlog/, implement it on a feature branch, verify with project checks, self-review, and open one merge request for human review. Use when the user asks to work the backlog, pick up the next backlog item, or run autonomous delivery.
---

# Work Backlog Skill

Use this skill to deliver one backlog item end-to-end without supervision:
pick → branch → implement → verify → MR. The human's job is reviewing and
merging the MR; this skill's job is everything before that.

This skill is the canonical workflow source for work-backlog on skill-aware
tools. The matching command runbook is a compatibility and fallback surface.

## Contract (read first — these override everything below)

1. **One MR per run.** Deliver exactly one backlog item, then stop and report.
2. **Never commit or push to `main`** (or the project's default branch). All
   work happens on a feature branch; humans merge.
3. **WIP limit 1.** If an open MR from a previous run exists, stop and report
   instead of starting new work.
4. **The BLI's acceptance criteria are the definition of done.** Do not invent
   scope; do not skip criteria. Anything explicitly out-of-scope stays out.
5. **Checks must be green before the MR opens.** If they cannot be made green,
   open a **draft** MR with the blockers listed in the description — never
   fail silently, never open a broken non-draft MR.
6. **A blocked step is a reportable outcome, not an error.** Missing
   credentials, human-only steps (e.g. OAuth consents, GitLab settings) →
   deliver what is deliverable, flag the rest in the MR and final report.

## Prerequisites

- A `docs/backlog/` folder with BLIs in the Greenberry backlog template
  (`Status`, `Priority`, `Acceptance Criteria`, `Related` with
  `Depends on:` links).
- Clean working tree on the default branch.
- `glab` (GitLab) or `gh` (GitHub) authenticated — verify with
  `glab auth status` / `gh auth status`.
- Project conventions available: `CONVENTIONS.md`, `rules/`, and any
  project docs the BLIs link to.

## Steps

### 1. Sync

```bash
git fetch origin
git checkout main && git pull --ff-only
```

Refuse to continue if the working tree is dirty.

### 2. WIP check

List open MRs (`glab mr list --state opened` / `gh pr list`). If any open
MR's source branch corresponds to a backlog item (branch naming, step 4),
**stop**: report the MR URL and suggest merging it or picking up its review
comments (the address-review-comments skill) instead. Also flag any local
work-backlog branch that has no MR (a crashed previous run) and ask whether
to resume it rather than starting fresh.

### 3. Pick the next item

Parse every `docs/backlog/*.md`:

- **Status** — only `ready` items are candidates.
- **Dependencies** — from the `Depends on:` links in `## Related`. A
  dependency is satisfied when that BLI's `Status` is `done` **on
  `origin/main`** (i.e. its MR merged). Unlinked prose like "rolling" means:
  eligible only when no other item is.
- **Order** — roadmap order if the Ticket field carries one (`roadmap item
  N`) or `docs/ROADMAP.md` defines a sequence; otherwise priority
  (`critical > high > medium > low`), then filename.

Pick the **first eligible** item. If none is eligible, report per item what
blocks it (status, unmet dependency, open MR) and stop.

### 4. Branch

From fresh `origin/main`, using the project's branch convention (check
`CONVENTIONS.md` / `docs/ROADMAP.md`; Greenberry default is
`epic-lowercase/short-slug`):

```
SESSION-feat-create-join-room.md → session/create-join-room
```

First commit: flip the BLI `Status` from `ready` to `in-progress`
(`docs: start <bli-name>`).

### 5. Implement

- Read the BLI fully, **including every linked doc** (spec sections,
  architecture) before writing code.
- Follow `CONVENTIONS.md`, the project `rules/`, and existing code style.
- Work through the acceptance criteria in order; keep the diff scoped to
  this item. If you discover missing prerequisite work, stop and report
  rather than smuggling it in.
- Write the tests the BLI names (unit/component/E2E); they are acceptance
  criteria like any other.

### 6. Verify

Run the project's full check suite — prefer the run-checks skill or the
scripts `CONVENTIONS.md` documents (typically: lint, typecheck, unit tests,
build, plus Storybook/Playwright where configured). Everything green is a
precondition for a non-draft MR (Contract #5). Fix failures; do not weaken
checks, skip tests, or add lint suppressions to get green.

### 7. Self-review

Review the full branch diff against `origin/main` (use the code-review skill
if available) and fix findings before opening the MR: correctness first, then
convention violations. Re-run checks if the fixes were non-trivial.

### 8. Close out the BLI

On the branch: flip `Status` to `done` and commit. After step 9 produces the
MR URL, append it to the BLI's `## Related` section, commit
(`docs: link MR for <bli-name>`), and push — the MR picks up the new commit
automatically. A merged MR thus lands the BLI as `done` with its MR link, and
step 3's dependency check needs nothing but `origin/main`.

### 9. Open the MR

Use the create-pr skill (it handles rebase onto base, MR templates, push, and
`glab mr create` / fallbacks). Additionally:

- Title: conventional (`feat(session): create & join a session room`).
- Description must link the BLI file and map the diff to its acceptance
  criteria (checked list). Note the preview URL if the platform provides one.
- Draft MR + a **Blocked on** section when Contract #5 or #6 applies.
- This is an autonomous run: skip create-pr's interactive approval pause —
  the MR itself is the review surface.

### 10. Notify

If the repo's GitLab→Slack (or equivalent) integration is configured, MR
notifications are automatic — do nothing. Otherwise, if a Slack tool is
available in the session, post the MR link + one-line summary to the
project's merge-request channel. If neither, say so in the final report.

### 11. Report

End with: item picked (and why it was next), branch + MR URL, checks run and
their results, acceptance criteria coverage, and anything a reviewer should
look at first. If anything was skipped or blocked, state it plainly.

## Edge cases

- **Malformed BLI** (missing Status/Related): skip it, flag it in the report.
- **Dependency cycle**: report the cycle, stop.
- **Empty backlog / all done**: say so — do not invent work.
- **Checks broken on `main`** (pre-existing): report and stop; fixing main is
  not this run's scope unless the picked BLI says so.
