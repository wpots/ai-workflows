# Close Sprint Runbook

Canonical runbook for closing out a sprint. The `close-sprint` skill on
skill-aware tools wraps this runbook; Codex, Copilot, and other prompt-first
tools should follow these steps directly.

Goal: produce a sprint changelog, a gaps/spillover document, move the
delivered backlog items into a dedicated sprint folder, and clear out the
sprint's working documents. Jira is read-only throughout — never edit issues,
transitions, or comments.

## Safety

- **Never** mutate Jira (no comments, transitions, edits, assignments).
- **Never** run `git commit` — the user commits themselves.
- Use `git mv` to relocate files so history is preserved.
- `git rm` is for the Phase 5b working documents and a committed Phase 5c demo
  folder only — never a file that code, tests or config reference.
- Stop and ask when classification is ambiguous; do not guess.

## Inputs

Ask the user at start:

1. Sprint name or id (e.g. `Sprint 2`) — or, in support mode, the month to
   close (e.g. `2026-08`; default: the previous calendar month).
2. Assignee email (default: the configured Jira user, verify with `jira me`).
3. Jira project key (infer from existing backlog filenames, e.g. `RFW`).

## Support mode (projects without sprints)

A project in support/maintenance no longer runs sprints, but delivered backlog
items still need the same close: verification, changelog, gaps, archive. The
close then operates on a **calendar month**, and every `sprint-<N>` artifact in
this runbook maps to its `support-<yyyy>-<mm>` equivalent — always year plus
zero-padded month (`support-2026-08`), so archive folders sort chronologically
and month names cannot collide across years:

| Sprint mode                              | Support mode                                      |
| ---------------------------------------- | ------------------------------------------------- |
| `Sprint <N>`                             | the month `<yyyy>-<mm>`                           |
| `docs/sprint-<N>/`                       | `docs/support-<yyyy>-<mm>/`                       |
| `docs/sprint-<N>-changelog.md`           | `docs/support-<yyyy>-<mm>-changelog.md`           |
| `docs/sprint-<N>-gaps.md`                | `docs/support-<yyyy>-<mm>-gaps.md`                |
| `# Sprint <N> Changelog` (title)         | `# Support <yyyy>-<mm> Changelog`                 |
| `## Status` → `Delivered in Sprint <N>.` | `## Status` → `Delivered in support-<yyyy>-<mm>.` |
| tag `sprint-<N>-bli-archive`             | tag `support-<yyyy>-<mm>-bli-archive`             |
| sprint JQL (`sprint = "Sprint 2"`)       | month-window JQL (see below)                      |

Decide the mode at start: ask, or infer — existing `docs/support-*` folders, or
a tracker without active or future sprints, mean support mode. Two
support-specific notes; everything else in this runbook applies unchanged:

- **Phase 1 window query.** There is no sprint to query. When the project uses
  a tracker, fetch the month's set with a resolution window instead:
  `assignee = <user> AND project = <KEY> AND resolved >= "<yyyy>-<mm>-01" AND
  resolved < "<first day of next month>"`. Ticketless local BLIs are normal in
  support mode: they are classified on Phase 2 git evidence alone and land in
  the "Ticketloos opgeleverd" table.
- **The delivery boundary is the merge date** on the integration branch, not
  the MR or branch creation date: work merged on 2 September belongs to
  `support-2026-09`, even when its branch started in August.

## Phase 0 — Switch to the integration branch

Closing a sprint means reporting what landed on the **integration branch**
(`development` by default — confirm the project's main branch if unsure). Run
the whole flow from there, not from a feature branch, and in the user's own
checkout — the one they open in their editor. The user edits the changelog,
the gaps document and the moved BLIs during the review (Phases 6–7); files in
a worktree are out of their reach. So an interactive close never moves to a
worktree: not to sidestep a dirty tree, and not because a project habit says
to commit from one. The only worktree route is a session that cannot write to
the checkout at all (the skill's background-run fallback).

1. Verify a clean working tree (`git status --short`); stop and ask if dirty.
   Name each dirty file, and say which ones the close will move or delete — a
   staged edit inside the sprint folder needs the user's call before Phase 5b.
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
docs alone produces an inaccurate changelog. CLI first: the **`jira` CLI**
(`ankitpokhrel/jira-cli`; recipes in `skills/service-cli/references/jira.md`).
The Atlassian connector only when the CLI is not installed and cannot be
installed now (`brew install ankitpokhrel/jira-cli/jira-cli` then `jira init`)
— and say so in the recap. If neither connects, **stop** and help the user
connect before continuing. Never fall back to local-only.

With the CLI (`--raw | jq` instead of `--plain` when the list is long):

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

Without the CLI, query the same set by JQL through the connector and request
status, assignee, fixVersion, and linked issues.

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
4. Read each BLI's `## Status` on the integration branch, and match code to
   BLIs, not to MRs. A merge is not the delivery: an item that merged with
   `in-progress` still has a post-merge check open (`partial`, with that check
   as the gaps action). And one MR can carry a second item it was never
   branched for, so an item still marked open may already sit in another
   item's merged diff — check the diffs before calling it spillover.
5. Classify the ticket:
   - `delivered` — code is on the integration branch and matches the BLI.
   - `partial` — some code merged, scope not fully covered.
   - `spillover` — ticket exists, no merged code, work continues next sprint.
   - `not-started` — ticket exists, no code, no docs.
   - `code-without-ticket` — code references exist without a matching Jira key
     (surface during Phase 4b).

## Phase 3 — Draft the sprint changelog

Create `docs/sprint-<N>-changelog.md` from the template in
[Changelog template](#changelog-template) at the end of this runbook, following
its filling rules. Include **only** `delivered` items in the tables — spillover
and gaps belong in the Phase 4 document. When existing changelogs in the
project predate the template, follow the template, not the neighbour.

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

Before the first move, snapshot the tree for the link sweep below:
`git archive --format=tar -o "$TMPDIR/pre-close.tar" HEAD`, extracted into a
scratch folder.

For each ticket classified `delivered`:

1. `git mv docs/backlog/<TICKET>-*.md docs/sprint-<N>/<TICKET>-*.md`
   (create `docs/sprint-<N>/` if missing).
2. Update the BLI:
   - `## Status` → `Delivered in Sprint <N>.` When the old status carried
     evidence after `done` (`done — merged … as <sha> (MR !N); …`), keep that
     evidence after the sentence.
   - `## Ticket` → when it still holds a placeholder key (`<KEY>-TBD`) and a
     tracker ticket names this file as its spec, write that key.
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

After the moves, **sweep the links they broke.** A move out of `docs/backlog/`
breaks relative links three ways: documents that link `../backlog/<moved>.md`
(ADRs, todos, specs, the backlog index), moved BLIs that link a sibling that
stayed (`<file>.md` → `../backlog/<file>.md`), and staying BLIs that link a
moved sibling (`<file>.md` → `../sprint-<N>/<file>.md`). A big sprint breaks
hundreds. List every relative markdown link under `docs/` whose target is
missing now but resolves in the snapshot — that leaves out links that were
already broken — and fix those. In a file where every `../backlog/` link points
at a moved item, one replace-all of the prefix does it. Remove the delivered
rows from the backlog index and point it at the changelog. A code comment, test
or fixture that names a moved BLI's path is code: list it under Actions in the
gaps document for its own MR.

Spillover and partial BLIs stay in `docs/backlog/` or `docs/refine/` — do not
move them.

## Phase 5b — Clear out the sprint's working documents

A sprint leaves more than BLIs behind: the planning and refinement documents
this toolkit writes, plus whatever the project kept next to them — a tracker or
plan, a journal, spike notes, captured payloads. Once the sprint closes nothing
reads them to decide anything, and left in place they are most of the markdown
an AI-assisted project accumulates. Clear them at close, not at compaction: the
retention guard in `commands/compact-sprint.md` protects BLIs that a later
close still cross-references, and working documents have no such reader.

1. **Inventory.** The sprint's working documents are:
   - `docs/sprint-<N>-planning.md` and `docs/sprint-<N>-refinement.md`
     (written by `commands/sprint-planning.md`);
   - `docs/plans/refinement-<date>.md` dated inside the sprint window
     (written by `commands/refinement.md`);
   - a project-local sprint folder under any spelling — `docs/sprint<N>/`,
     `docs/sprint_<N>/`, or `docs/sprint-<N>/` itself — and every file in it
     that is not a delivered BLI or the Phase 5c demo record;
   - a prompt or loop file that only exists to drive the sprint's tracker.

   Ask when it is unclear which sprint a file belongs to. Out of scope:
   `docs/sprint-<N>-changelog.md` and `docs/sprint-<N>-gaps.md` — the next
   sprint's planning reads both, and `commands/compact-sprint.md` handles them.
2. **Classify** each file:
   - `consumed` — code, tests, config, scripts or a runtime message reference
     it: `rg -l --hidden "<file-or-folder>" --glob '!docs/**' --glob '!.git/**'`.
     A reference from another working document of the same sprint does not
     count. Typical cases: fixtures a test loads, a runbook an error message
     names, a decision a code comment links to. Never remove it here —
     relocating it changes code, so it is its own MR. Record it under
     `## Working documents` in the gaps document with a proposed permanent
     home (fixtures next to their tests, a runbook with the project's other
     runbooks, a decision as an ADR).
   - `durable` — it states a decision or fact that no BLI, ADR, spec or
     `docs/todo/` entry holds yet; search those homes before claiming it.
     Record it under `## Working documents` with the suggested home; the move
     is settled in the Phase 7 walkthrough. Lessons about how the work was run
     belong in the skill that ran it — hand those to `skills/improve-skill`
     instead of keeping them as prose.
   - `ephemeral` — everything else: tracker ticks, status lines, journal
     entries, load math, refinement proposals the tracker now holds. A journal
     that nothing reads to decide anything is ephemeral by construction, however
     long it is.
3. **Remove** the ephemeral files with `git rm`. A durable file goes once its
   content has reached its home; a consumed file stays until its own MR moves
   it.
4. **Sweep links.** `rg -l "<removed path>" docs/ README.md CONVENTIONS.md`:
   in active documents, drop the link or point it at the new home.
5. **Record** the removed paths in the changelog's `## Archief` section (see
   the [Changelog template](#changelog-template)). Git history keeps the files,
   so the list plus the retrieval recipe is the whole archive.

## Phase 5c — Flatten the sprint demo into the sprint folder

When `docs/demo/sprint-<N>/` exists (written by `commands/sprint-demo.md`),
fold it into one text record, `docs/sprint-<N>/demo.md`:

1. **Write the record**, in the changelog's language:
   - A header with the demo date, the audience, the demo environment, and
     where the shared version lives when the client received one.
   - Per slide, in deck order: the title, what was shown (its lines, the
     tickets), and the demo URLs. Add the dated facts the notes quote, such as
     "op 29-09: 250 resultaten".
   - The questions the runsheet expected, with their answers.

   Leave out the mechanics that only served the day: the klikpad, the
   checklists, the presenter-view instructions, the screenshots and the
   rendered files.
2. **Route what is not a record.** A `(Niet voorlezen: …)` caveat that states
   a durable fact goes to its home (BLI, ADR, `docs/todo/`), as in the Phase 5b
   `durable` rule. An open flag from the demo prep goes to the gaps document.
   A support one-pager moves next to the record, and is tracked from there.
3. **Check the shared pptx** before anything is deleted. Look up the
   destination the runsheet header names: a Drive path, a Drive link, or a
   local path outside the repo.
   - The file is there (for a path, its size matches the demo-folder copy):
     the demo-folder copy may go.
   - Only a link, no destination, or the file is missing: ask where to keep
     the pptx, move it there, and name that place in the record's header.
     Never delete the only copy of the deck the client received.
4. **Delete the folder.** Git does not track it (`docs/demo/` is ignored), so
   `rm -r docs/demo/sprint-<N>/` cannot be undone and the deck is not kept
   anywhere: list what goes (deck, runsheet, screenshots, build script,
   rendered files), ask first, and never offer a commit to keep it. When
   `git ls-files docs/demo/sprint-<N>/` lists files, an earlier run committed
   the folder: remove those with `git rm -r` and the rest with `rm -r`.
5. **Record** the record's path in the changelog's `## Archief`.

## Phase 6 — Review pause (stop here)

Print a summary:

- Path to the changelog
- Path to the gaps document
- List of moved BLIs
- Working documents removed, and those held back as `consumed` or `durable`
- The demo record written in Phase 5c, or "no demo folder"
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
Actions, any still-open BLI/doc mismatches, the Phase 5b working documents
still held back, and the Phase 8 cleanup overview.
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
- Working documents removed (Phase 5b), and those held back with their
  proposed home
- The demo record (Phase 5c), the demo folder it replaced, and where the
  shared pptx lives
- New docs created during Phase 7
- Stale branch / worktree count from Phase 8
- Items still open that need user follow-up
- Sprints now older than the previous one, as candidates for
  `commands/compact-sprint.md` (never run it as part of the close)
- Whether to write customer release notes next (`commands/release-notes.md`):
  the changelog's `Opgeleverd` rows are its first source

## Changelog template

Shared by this runbook (Phase 3, writing new changelogs) and
`commands/compact-sprint.md` (Phase 3, rewriting old ones). The section
structure and filling rules are normative; the labels follow the project's
changelog language — the example is Dutch, matching existing sprint
changelogs.

````markdown
# Sprint <N> Changelog

- **Venster:** <start> t/m <eind>
- **Geverifieerd:** <datum>, `development` @ `<sha>` (tracker read-only)
- **Tracker-set:** <X> tickets op <assignee>; <Y> geleverd, <Z> spillover (zie gaps)

## Opgeleverd

| Ticket  | Wat                                              | Bewijs            | Status        |
| ------- | ------------------------------------------------ | ----------------- | ------------- |
| RFW-134 | Onboarding-stap "Opleiding" incl. datumvalidatie | `51445485`        | In Acceptance |
| RFW-222 | robots.ts sluit privé-routes uit                 | `5a2fdca6` / !329 | Done          |

## Ticketloos opgeleverd

| Wat                                                      | Bewijs            |
| -------------------------------------------------------- | ----------------- |
| Vacature-overzicht toont alleen publiek-actieve vacatures | `a54603c8` / !348 |

## Afwijkingen & vervolg

- RFW-M: partieel — `priority`-prop bestaat, geen call-site gebruikt hem.

## Verantwoording

- RFW-30, RFW-59, … (16 st.): al gerapporteerd in sprint <N-1>, niet herhaald.
- RFW-197/198: Done zonder commit — bevestigd niet-code (dashboard-config).

## Review evidence

- Onboarding: `src/modules/Wizard/`

## Archief

- Werkdocumenten, verwijderd bij de close: `docs/sprint-<N>-planning.md`,
  `docs/sprint<N>/log.md` — `git show <sha>^:<path>`, met `<sha>` uit
  `git log --diff-filter=D --format=%h -1 -- <path>`
- Demo: `docs/sprint-<N>/demo.md`; de deck zelf is niet bewaard
- BLI's van deze sprint: `git show sprint-<N>-bli-archive:docs/sprint-<N>/<file>`
````

Filling rules:

- **"Wat" is one sentence, ~100 characters max**, phrased functionally (what
  can the user or PO see or do now). Implementation detail belongs in the
  tracker or the BLI, not here.
- **Ticketless rows must be self-contained** — after compaction that row is
  the only spec besides the git tag.
- **No ⚠️ prose inside table cells**: deviations, partials, and follow-up work
  go to "Afwijkingen & vervolg", one bullet per item.
- **"Verantwoording" is a bullet list, not a narrative intro**: one bullet per
  case (already reported in an earlier sprint, done-without-commit,
  cross-assignee delivery).
- **Target size: under 15 KB per changelog.** Larger means BLI or tracker
  content is leaking into it.
- At close, `## Archief` holds only the working-documents line from Phase 5b
  and the demo line from Phase 5c (omit the section when neither applies);
  compact-sprint adds the BLI line. While the sprint folder exists, BLIs live at `docs/sprint-<N>/` and
  need no per-row path column.
