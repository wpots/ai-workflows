---
name: close-sprint
description: "Close Sprint Runbook"
---

# Close Sprint Runbook

Canonical runbook for closing out a sprint. The `close-sprint` skill on
skill-aware tools wraps this runbook; Codex, Copilot, and other prompt-first
tools should follow these steps directly.

Goal: produce a sprint changelog, a gaps/spillover document, and move the
delivered backlog items into a dedicated sprint folder. Jira is read-only
throughout — never edit issues, transitions, or comments.

## Safety

- **Never** mutate Jira (no comments, transitions, edits, assignments).
- **Never** run `git commit` — the user commits themselves.
- Use `git mv` to relocate files so history is preserved.
- Stop and ask when classification is ambiguous; do not guess.

## Inputs

Ask the user at start:

1. Sprint name or id (e.g. `Sprint 2`).
2. Assignee email (default: the configured Jira user, verify with `jira me`).
3. Jira project key (infer from existing backlog filenames, e.g. `RFW`).

## Phase 0 — Switch to the integration branch

Closing a sprint means reporting what landed on the **integration branch**
(`development` by default — confirm the project's main branch if unsure). Run
the whole flow from there, not from a feature branch:

1. Verify a clean working tree (`git status --short`); stop and ask if dirty.
2. Check out the integration branch and bring it up to date with the remote:
   ```bash
   git checkout development
   git fetch origin
   git pull --ff-only
   ```
   `--ff-only` is non-destructive (it only advances a strictly-behind local
   branch). If it refuses because local has diverged, stop and ask.
3. All later phases — code verification (Phase 2), `git mv` of delivered BLIs
   (Phase 5), and the cleanup overview (Phase 8) — run from this up-to-date
   branch. A feature branch is ahead of `development` and will misclassify
   delivered vs spillover work and operate on the wrong `docs/` tree.

## Phase 1 — Fetch Jira tickets (read-only)

A live Jira connection is a **hard precondition** — closing a sprint on local
docs alone produces an inaccurate changelog. Use the **most efficient method
available**: the **Atlassian MCP** if it is connected (preferred), otherwise the
**`jira` CLI** (`ankitpokhrel/jira-cli`). If neither connects, **stop** and help
the user connect before continuing (MCP: authenticate the Atlassian connector;
CLI: `brew install ankitpokhrel/jira-cli/jira-cli` then `jira init`). Never fall
back to local-only.

With the CLI:

```bash
# Verify config
jira me

# List active sprints (to confirm sprint name)
jira sprint list --state active --plain

# Tickets in the target sprint on the user's name
jira issue list --plain --no-truncate \
  -a "<assignee-email>" \
  --jql 'sprint = "Sprint 2" AND project = RFW'

# Per-ticket detail (assignee, status, summary, links)
jira issue view RFW-XX --plain
```

With the MCP, query the same set by JQL and request status, assignee,
fixVersion, and linked issues.

Capture for each ticket: key, summary, Jira status, assignee, fixVersion,
linked issues.

## Phase 2 — Code verification

For each ticket:

1. Locate the BLI: `docs/backlog/<TICKET>-*.md` (also check `docs/refine/`,
   `docs/plans/`, `docs/specs/`).
2. Check commits on the main integration branch:
   ```bash
   git log --all --grep="<TICKET>" --format="%h %s %an <%ae>"
   ```
3. Note PR / branch existence if discoverable.
4. Classify the ticket:
   - `delivered` — code is on the integration branch and matches the BLI.
   - `partial` — some code merged, scope not fully covered.
   - `spillover` — ticket exists, no merged code, work continues next sprint.
   - `not-started` — ticket exists, no code, no docs.
   - `code-without-ticket` — code references exist without a matching Jira key
     (surface during Phase 4b).

## Phase 3 — Draft the sprint changelog

Create `docs/sprint-<N>-changelog.md` mirroring the structure of
`docs/sprint-1-changelog.md`:

- Short intro paragraph.
- `## Delivered in Sprint <N>` — markdown table with columns `Ticket`,
  `Backlogitem`, `Opgeleverd`. Include **only** `delivered` items.
- `## Review Evidence` — bullet list of grouped code paths that reviewers can
  open to verify delivery.

## Phase 4 — Draft the gaps and spillover document

Create `docs/sprint-<N>-gaps.md` with these sections:

### 4a. Spillover

Tickets classified `partial`, `spillover`, or `not-started`. Per item:

- Jira key + summary
- Current Jira status
- BLI path (or `none`)
- Observed code state (files touched, partial implementation notes)
- Open question or proposed next action

### 4b. Gaps Jira ↔ Code

- Code merged this sprint without a matching Jira ticket
- Tickets without a BLI or spec
- BLIs without a Jira ticket

### 4c. BLI / Doc mismatches

BLIs whose acceptance criteria diverge from what actually shipped. Note the
divergence — do not rewrite the BLI yet (that happens after review).

### 4d. The gaps document is a convergence artifact

The gaps document is not a static dump — it is refined during review
(Phase 6/7) until it contains **only** genuine spillover and open actions for
the sprint being closed. As each item is resolved, remove it:

- A delivered ticket that only lacked a BLI → create the BLI in
  `docs/sprint-<N>/`, add it to the changelog, and remove it from the gaps
  document (it is no longer a gap).
- A "code without ticket" item that belongs to an existing/known ticket, or a
  subtask folded into another BLI → record the resolution in that BLI and
  remove the gaps entry.
- Cross-assignee code that is genuinely delivered in the sprint → give it a BLI
  in `docs/sprint-<N>/` (with confirmed authorship), add it to the changelog,
  and remove it from gaps. Verify it is actually on the integration branch
  first; if it only lives on an unmerged branch it is spillover, not delivered.
- Only truly unresolved items stay: real spillover (code not on the integration
  branch) and concrete follow-up actions (a tracker status to update, a
  follow-up subticket to create, a doc/intent mismatch to confirm).

## Phase 5 — Move delivered BLIs into the sprint folder

For each ticket classified `delivered`:

1. `git mv docs/backlog/<TICKET>-*.md docs/sprint-<N>/<TICKET>-*.md`
   (create `docs/sprint-<N>/` if missing).
2. Update the BLI:
   - `## Status` → `Delivered in Sprint <N>.`
   - `## Authors` → populate from Jira assignee plus git commit authors.
     - Primary: assignee from `jira issue view <TICKET> --plain`.
     - Additional: unique committers from
       `git log --all --grep="<TICKET>" --format="%an <%ae>" | sort -u`.
     - Deduplicate against existing entries; never remove existing authors.
     - Format:
       ```markdown
       ## Authors

       - Wieteke Pots <wieteke.pots@greenberry.nl>
       ```

Spillover and partial BLIs stay in `docs/backlog/` or `docs/refine/` — do not
move them.

## Phase 6 — Review pause (stop here)

Print a summary:

- Path to the changelog
- Path to the gaps document
- List of moved BLIs
- Count of spillover / gap items awaiting review

Then stop and ask the user to review the changelog and gaps document before
continuing. Do not proceed to Phase 7 without explicit acknowledgement.

## Phase 7 — Spillover walkthrough (after user ack)

Walk through each gap item with the user. For spillover work without an
adequate doc:

1. Ask where the new md belongs (`docs/refine/`, `docs/todo/`,
   `docs/backlog/`).
2. Create the new md using the relevant template (e.g.
   `docs/backlog/_template.md` for a new backlog item).
3. Pre-fill Ticket, Authors, User Story, and Acceptance Criteria from Jira
   plus the observations gathered in Phase 2.
4. Update `docs/sprint-<N>-gaps.md` with the resolution (link to the new doc
   or recorded decision).

### Refining the gaps document from user feedback

The gaps document is reviewed interactively. When the user comments on it, treat
each comment as an instruction to update the document in place and re-converge:

1. Apply the decision (create/move a BLI, fold a subtask into another BLI,
   reclassify spillover vs delivered, correct attribution/authorship, note a
   deleted tracker ticket).
2. Propagate the change everywhere it appears: the moved/created BLI, the
   `docs/sprint-<N>-changelog.md` delivered table and intro counts, and any
   cross-references.
3. Remove the now-resolved entry from the gaps document.
4. Repeat until `docs/sprint-<N>-gaps.md` contains **only** genuine spillover
   and open actions for the sprint being closed.

End state of the gaps document: a short, action-oriented file — Spillover,
Actions, any still-open BLI/doc mismatches, and the Phase 8 cleanup overview.
Nothing that has already been resolved should remain.

## Phase 8 — Stale branches and worktrees overview

Produce a cleanup report. Do **not** delete anything — only surface candidates
for the user to act on.

### 8a. Collect branch and worktree state

```bash
# Local branches with last commit date and merge status against development
git for-each-ref --format='%(refname:short)|%(committerdate:iso8601)|%(committerdate:relative)' refs/heads/

# Branches fully merged into development
git branch --merged development

# Worktrees
git worktree list
```

### 8b. Classify each branch

**Always exclude protected branches** from the cleanup overview entirely —
never list them, never suggest actions for them. Protected branches:

- `main`
- `master`
- `development`
- `acceptance`
- `staging`
- `production`
- the branch currently checked out

For every remaining local branch:

- `merged-stale` — merged into `development` and last commit > 14 days ago.
  Safe-delete candidate.
- `delivered-this-sprint` — matches a ticket in the changelog (e.g.
  `feature/RFW-52-*`). Safe-delete candidate once the user confirms the PR
  is closed/merged.
- `spillover-active` — matches a ticket in the gaps document. **Keep.**
- `unmerged-old` — not merged, last commit > 30 days ago. Flag for user
  decision.
- `active` — recent commits within the last 14 days, no decision needed.

### 8c. Classify each worktree

- `review-tmp` — path under `/tmp` or `/private/tmp` with detached HEAD.
  Safe to remove once review is done.
- `branch-gone` — worktree references a branch that no longer exists or is
  merged.
- `active` — matches a current working branch.

### 8d. Write the cleanup overview

Append a `## Stale branches and worktrees` section to
`docs/sprint-<N>-gaps.md` (so all sprint-close output lives in one review
document):

- Table of stale branches: `Branch`, `Last commit`, `Classification`,
  `Suggested action`.
- Table of stale worktrees: `Path`, `Branch / HEAD`, `Classification`,
  `Suggested action`.
- Footer with the exact commands the user can run to clean up — but do not
  execute them:
  ```bash
  git worktree remove <path>
  git branch -d <branch>      # safe delete (merged only)
  git branch -D <branch>      # force delete (unmerged) — confirm first
  ```

Ask the user before deleting anything. Branch and worktree deletion is
destructive — never run these commands without explicit per-item approval.

## Output

End with a concise list of:

- Files written
- Files moved (via `git mv`)
- New docs created during Phase 7
- Stale branch / worktree count from Phase 8
- Items still open that need user follow-up
