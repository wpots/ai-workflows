---
name: work-backlog
description: Autonomously pick up the next eligible backlog item from docs/backlog/, implement it on a feature branch, verify with project checks, self-review, and open one merge request for human review. Use when the user asks to work the backlog, pick up the next backlog item, or run autonomous delivery.
metadata:
  owner: wieteke.pots
---

# Work the Backlog

Use this skill to deliver one backlog item end-to-end without supervision:
pick → branch → implement → verify → MR. The human's job is reviewing and
merging the MR; this skill's job is everything before that.

This skill is the canonical workflow source for work-backlog on skill-aware
tools. The matching command runbook is a compatibility and fallback surface.

## Contract (read first — these override everything below)

1. **One MR per run.** Deliver exactly one backlog item, then stop and report.
2. **Never commit or push to `main`** (or the project's default branch). All
   work happens on a feature branch; humans merge.
3. **WIP limit 1 — advance the in-flight MR before starting anything new.** If
   an open MR from a previous run exists, do **not** start a new backlog item.
   Instead resolve *that* MR first:
   - If it has **unresolved reviewer comments**, picking them up as rework **is**
     this run's unit of work (step 2) — reworking keeps WIP at 1 and is the
     progress that stops an autonomous loop from stalling.
   - If it is merely **awaiting review** (no actionable comments) or blocked on a
     human-only step, stop and report. Never open a second MR.
4. **The BLI's acceptance criteria are the definition of done.** Do not invent
   scope; do not skip criteria. Anything explicitly out-of-scope stays out.
5. **Checks must be green before the MR opens.** If they cannot be made green,
   open a **draft** MR with the blockers listed in the description — never
   fail silently, never open a broken non-draft MR.
6. **A blocked step is a reportable outcome, not an error.** Missing
   credentials, human-only steps (e.g. OAuth consents, GitLab settings) →
   deliver what is deliverable, flag the rest in the MR and final report.
   Evidence a criterion needs from a deployed environment is a blocked step
   too: never add a route, endpoint or code path whose only job is to produce
   it — a reviewer reads that as product code without product behaviour. Let
   the evidence ride on the capability that needs it.

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

### 2. WIP check — and rework the in-flight MR if it has feedback

List open MRs (`glab mr list` / `gh pr list` — open is the default for both;
`glab mr list` has no `--state` flag and rejects it). If any open MR's source
branch corresponds to a backlog item (branch naming, step 4), that MR is the
WIP — do **not** pick a new item. Decide its state and act:

1. **Fetch its reviewer feedback.** Read the MR's comments and review threads
   (`glab mr view <iid> --comments` / `gh pr view <n> --comments`; use the API
   for thread `resolved` state). An **actionable** comment is an *unresolved*
   thread authored by **someone other than the MR author** (a real reviewer): a
   question, change-request, or `suggestion` block. Ignore resolved threads,
   system notes, and the bot's own comments.

2. **Actionable comments exist → rework (this is the run's work).** Hand off to
   the **address-review-comments** skill for this MR in **full-auto mode**
   (propose *and* apply back-to-back — no approval pause; the autonomous loop is
   the "do it all" case). It handles the worktree, fix, checks, commit, push, and
   rebase. Then **resolve each thread you addressed** on the platform (optionally
   with a one-line reply) so the next loop iteration sees no actionable comments
   and converges. Do **not** re-announce the MR (rework is never posted to the MR
   channel). Report what was reworked + the MR URL, then **stop** (one unit of
   work per run).

3. **No actionable comments (awaiting review / blocked on a human) → stop and
   report** the MR URL: suggest merging it, or that it waits on a reviewer.
   Never open a second MR.

Also flag any local work-backlog branch that has no MR (a crashed previous run)
and ask whether to resume it rather than starting fresh.

### 3. Pick the next item

Parse every `docs/backlog/*.md`:

- **Status** — only `ready` items are candidates.
- **Dependencies** — from the `Depends on:` links in `## Related`. A
  dependency is satisfied when that BLI's `Status` **on `origin/main`** is
  `done`, or `in-progress` with its MR (linked under `## Related`) merged and
  only a post-merge check left — the code a dependent builds on is there
  either way. Unlinked prose like "rolling" means: eligible only when no other
  item is.
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

Before writing code, scan `docs/solutions/` (when the folder exists) for
notes matching the item's area — a documented root cause or prevention there
overrides guesswork and often collapses the approach decision.

- Read the BLI fully, **including every linked doc** (spec sections,
  architecture) before writing code.
- Re-check the BLI's premises against the tree you branched from: file names,
  paths, inventories, counts. An item refined before an earlier slice merged
  describes the old tree. Correct the item on the branch, say so in the MR, and
  code to the tree rather than to the stale text.
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

Two finding classes are always yours to fix here — they read fine to their
author and cost a human review round-trip every time they slip through:

- **Reviewer-facing comments** — comments that restate the code, argue why
  the change is correct ("deliberately", "on purpose", "is the point"), or
  narrate design decisions in a file header. Move the justification into the
  MR description and delete the comment ("What A New Comment May Say" in
  `rules/documentation.md`).
- **Single-consumer files in shared layers** — anything this branch added
  under `utils/`, `lib/`, or `constants/` that only the feature you built
  consumes. Move it (and its test) into the feature's module folder; shared
  placement is earned by the second consumer, in that consumer's MR ("Shared
  Layers Are Earned, Not Claimed" in `rules/project.md`).

### 8. Write `How to verify`, then close out the BLI

Fill the BLI's `## How to verify` section **from what you actually ran**, not
from intent (`rules/backlog.md`). It is the developer-facing proof:

- the commands you ran and what they reported (`npm run test -- <path>` → 12
  passing, the one that fails without the change)
- the route to open, as which role, and the observable result
- the states worth checking by hand: empty, error, unauthorised — where the BLI
  has criteria for them
- one line per acceptance criterion that needs more than "the test passes"

No invented steps, no "verify that it works". A step you did not run does not go
in. If a criterion could not be verified locally (needs a preview deploy, a real
credential), say that instead of implying you checked it.

Then on the branch, set the final `Status` and commit:

- every criterion verified before merge → `done`;
- a criterion that can only be checked after merge (a deploy, a human browser
  check, a credential rotation) → keep `in-progress`, and put that check first
  in `How to verify`. The item goes to `done` when the check is ticked, not
  when the MR merges.

After step 9 produces the MR URL, append it to the BLI's `## Related` section,
commit (`docs: link MR for <bli-name>`), and push — the MR picks up the new
commit automatically. A merged MR thus lands the BLI with its final status, its
MR link and its verification steps, and step 3's dependency check needs nothing
but `origin/main`.

### 9. Open the MR

Use the create-pr skill (it handles rebase onto base, MR templates, push, and
`glab mr create` / fallbacks). Additionally:

- Title: conventional (`feat(session): create & join a session room`).
- Description: fill the sections of the template create-pr resolves — never
  invent your own top-level headings; free-forming the structure is how agent
  MRs drift off the template. With the bundled fallback template:
  - `## Backlog` — link the BLI file and map the diff to its acceptance
    criteria as a checked list.
  - `## How to verify` — repeat the BLI's `How to verify` steps so a reviewer
    can reproduce them without opening the BLI. Note the preview URL if the
    platform provides one.
  - `## Scope` — when the BLI is one slice of several: which slice, which
    ticket, what the remaining slices still cover. A reviewer who does not
    know that will read the diff as an incomplete feature.
  When the project ships its own MR template, map the same content into its
  closest headings instead.
- Draft MR + a **Blocked on** section when Contract #5 or #6 applies.
- This is an autonomous run: skip create-pr's interactive approval pause —
  the MR itself is the review surface.
- In the canonical config repos (`ai-workflows`, `unicore-template`) never push
  straight to the base branch. An `ai-workflows` MR must carry
  `--reviewer wieteke.pots` — verify it (`glab mr view <iid>`) before reporting.
  Everywhere else, including this project's own MRs, open the MR without a
  reviewer and let the human assign one.

### 10. Notify

If the repo's GitLab→Slack (or equivalent) integration is configured, MR
notifications are automatic — do nothing. Otherwise, if a Slack tool is
available in the session, post the MR link + one-line summary to the
project's merge-request channel. If neither, say so in the final report.

### 11. Report

End with: item picked (and why it was next), branch + MR URL, checks run and
their results, acceptance criteria coverage, the `How to verify` steps, and
anything a reviewer should look at first. When the item is a slice, add the
ticket's standing — "slice 2/3 for PROJ-123; slice 3 remains" — so it is visible
that the product owner cannot test the feature yet. If anything was skipped or
blocked, state it plainly.

## Edge cases

- **Malformed BLI** (missing Status/Related): skip it, flag it in the report.
- **Dependency cycle**: report the cycle, stop.
- **Empty backlog / all done**: say so — do not invent work.
- **Checks broken on `main`** (pre-existing): report and stop; fixing main is
  not this run's scope unless the picked BLI says so.
