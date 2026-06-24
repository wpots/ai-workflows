# Sprint Planning Runbook

Canonical runbook for planning the **upcoming** sprint. The `sprint-planning`
skill on skill-aware tools (Claude, Codex, Cursor) wraps this runbook; Copilot
and other prompt-first tools should follow these steps directly.

Goal: turn what the tracker has scheduled for the next sprint into a single,
decision-ready planning document — spillover carried in from the closed sprint,
a dependency map, a realism check against velocity and capacity, and a proposed
execution order — and bring the supporting docs in line (create the missing
ones, flag the mismatched ones, mark the planned BLIs). The issue tracker is
read-only throughout — never edit issues, transitions, or comments.

This flow is **forward-looking only**. It does not re-run the retrospective:
the just-closed sprint's `close-sprint` output (changelog + gaps document) is an
**input** here, not something this flow reproduces.

## Safety

- **Never** mutate the issue tracker (no comments, transitions, edits,
  assignments, fixVersion, sprint field, story points). Sprint assignment and
  story points are set by the user in the tracker; this flow only **validates**
  them and marks the local docs.
- **Never** run `git commit` — the user commits themselves.
- **Write docs on the `development` branch** (the project's main integration
  branch), never on a feature branch — BLIs and the planning document are
  integration docs. Switch before writing anything (see Phase 0).
- **"Planned for Sprint N" is a doc status, not a tracker mutation.** The marker
  goes in the BLI (mirroring `close-sprint`'s `Delivered in Sprint N`). If a
  ticket is not yet assigned to the sprint in the tracker, **flag it** — do not
  assign it.
- Flag, do not fix: doc ↔ tracker mismatches are surfaced, never silently
  rewritten.
- Stop and ask when a ticket is ambiguous or empty; do not invent scope.

## Inputs

Ask the user at start (one question at a time):

1. Target sprint name or id (e.g. `Sprint 8`) — the sprint being planned.
2. Assignee email — whose tickets to plan in detail (default: the configured
   tracker user; verify with `jira me`).
3. Tracker project key (infer from backlog filenames, e.g. `RFW`).
4. The just-closed sprint's gaps document (default: `docs/sprint-<N-1>-gaps.md`)
   and changelog (`docs/sprint-<N-1>-changelog.md`) — the spillover and velocity
   source. If `close-sprint` has not run yet, say so and offer to run it first;
   never reconstruct the retrospective inside this flow.
5. Available working days this sprint (default: ask — the realism check needs a
   capacity number; the user's own working pattern is the source of truth).

## Phase 0 — Preconditions (tracker + branch)

### Tracker connection is mandatory

A live connection to the issue tracker is a **hard precondition**. Planning on
local docs alone produces a plan against stale scope — do not do it. Use the
**most efficient method available**:

1. The tracker's **MCP connector** if it is connected — richest data, full
   description + acceptance criteria + parent + links in one query. Preferred.
2. The tracker **CLI** otherwise (e.g. `ankitpokhrel/jira-cli` for Jira — verify
   with `jira me`).

If neither connects, **stop** and help the user get connected (MCP: authenticate
the connector; Jira CLI: `brew install ankitpokhrel/jira-cli/jira-cli` then
`jira init`). Never silently fall back to local-only planning.

### Work on the `development` branch

Planning writes BLIs and the planning document — integration docs, not feature
work. Before writing anything, switch to the **`development` branch** (the
project's main integration branch) and pull the latest, so the docs land there
and not on whatever feature branch is checked out:

```bash
git rev-parse --abbrev-ref HEAD     # current branch
git switch development
git pull --ff-only
```

If the working tree is dirty, **stop and ask** before switching — never stash or
discard the user's uncommitted work. If `development` is not the project's main
integration branch, use the actual integration branch instead.

## Phase 1 — Fetch the next sprint's tickets (read-only)

Fetch the full sprint (to see the whole, for dependencies) and the subset on the
user's name (to plan in detail). With the CLI:

```bash
jira sprint list --plain                          # confirm the target sprint name
# whole sprint — for the dependency picture
jira issue list --plain --no-truncate \
  --jql 'sprint = "Sprint 8" AND project = RFW'
# the user's own tickets — planned in detail
jira issue list --plain --no-truncate \
  -a "<assignee-email>" \
  --jql 'sprint = "Sprint 8" AND project = RFW'
jira issue view RFW-XX --plain                    # per-ticket: AC, links, parent
```

With the MCP, query the same JQL and request status, assignee, issue type,
parent/epic, story points, description + acceptance criteria, and **linked
issues** (blocks / is-blocked-by).

Capture per ticket: key, summary, assignee, status, issue type, parent/epic,
story points, AC, and links. Tag each as **mine** (user's name) or **other**.

## Phase 2 — Spillover carry-in and dependency map

1. **Carry-in.** Read the closed sprint's gaps document (Phase 0 input). Pull the
   `Spillover` items (`partial`, `spillover`, `not-started`). For each, confirm
   whether it is now scheduled in the target sprint:
   - in the target sprint → fold it into the plan as carried-over work.
   - not scheduled but unfinished → flag as **unplanned spillover** (work
     continues but no sprint home).
2. **Restpoints for carry-in.** Compute the remaining load each carried-in
   ticket adds, from its current Jira status:
   - status **not** in `test` / `acceptance` → still has work → **1 restpoint**.
   - status **in** `test` / `acceptance` → effectively done, only verification /
     release left → **0 restpoints**.

   Restpoints feed the realism total in Phase 4. (`test` / `acceptance` are the
   project's workflow columns — adjust if the tracker labels these stages
   differently.)
3. **Dependency map.** For each **mine** ticket, list its `blocks` and
   `is-blocked-by` links. Resolve where each link points:
   - blocked-by a ticket **in this sprint** → an internal ordering constraint.
   - blocked-by a ticket **outside this sprint / not done** → an **external
     blocker** that can stall the user; flag it prominently.
   - blocks someone else's ticket → the user's work is on a critical path; it
     should land early.

## Phase 3 — Ground each ticket (docs + code-start)

For each **mine** ticket:

### 3a. Doc check (create missing, flag mismatches)

1. Locate the BLI: `docs/backlog/<KEY>-*.md` (also check `docs/refine/`,
   `docs/specs/`, `docs/plans/`).
2. **Missing doc** → create it from `docs/backlog/_template.md` per
   `rules/backlog.md`. Pre-fill Ticket, User Story, and Acceptance Criteria from
   the tracker. Note whether a **DB migration** is expected (project convention:
   every BLI states migration expectation).
3. **Existing doc** → compare its acceptance criteria against the tracker. If
   they diverge, **flag the mismatch** in the planning doc — do **not** rewrite
   the BLI silently. Material rewrites belong to refinement, not planning.

### 3b. Code-start check

Check whether work has **already started** on the ticket, so Phase 4 can
estimate the *remaining* effort rather than the full ticket:

```bash
git log --all --grep="<KEY>" --format="%h %s %an"   # commits referencing the key
git branch -a --list "*<KEY>*"                        # feature branch for the ticket
```

Inspect any matching branch / commits for partial implementation, then classify:

- `not-started` — no code, no branch. Full SP remaining.
- `started` — branch or scaffolding commits only. Most of the SP remaining.
- `partially-done` — substantial implementation already merged or in progress.
  Note what is left; remaining effort is well below the full SP.

Record the observed code state and a remaining estimate per ticket — this feeds
the realism total.

## Phase 4 — Capacity and realism check

Realism is measured against two anchors — report both:

1. **Velocity (empirical).** Sum the story points delivered in the just-closed
   sprint (from the changelog / tracker). This is the primary anchor.
2. **Capacity (theoretical).** The available working days this sprint (Input 5).
   When reasoning in time rather than points, apply a **×1.5 buffer** to
   estimates (established convention — people consistently under-estimate).

Then build the **planned load** and compare:

- For each fresh upcoming ticket, take its story points **minus** any progress
  from the Phase 3b code-start check — use the *remaining* estimate, not the full
  SP, for already-started work.
- Add the **restpoints** for carried-in spillover from Phase 2 (1 per ticket not
  in test/acceptance, 0 otherwise).
- The sum of the two is the **planned load**. Compare it to velocity: flag
  **over-commit** (load > velocity) or a notable **under-commit**, with the
  numbers.
- Sanity-check against capacity days; if velocity is missing or unreliable (e.g.
  first sprint, holidays), lead with the capacity estimate and say so.
- Call out any unsized ticket — it makes the load number untrustworthy.

## Phase 5 — Proposed execution order

Order the user's tickets for efficient flow, with a one-line rationale per
decision. Order by, in priority:

1. **Dependencies first** — anything that blocks others, or that the user is
   blocked-by, comes first (unblock the critical path early; surface external
   blockers as risks, not as schedulable work).
2. **Group by shared surface / area** — cluster tickets that touch the same
   code, collection, or feature, to minimize context-switching.
3. **Risk / uncertainty** — pull high-uncertainty or migration-bearing work
   earlier so surprises surface while there is sprint time to absorb them.

## Phase 6 — Write the planning document and mark planned BLIs

Write `docs/sprint-<N>-planning.md` (alongside the changelog and gaps docs). Use
this structure:

- **Header** — target sprint, assignee planned in detail, when planned, and the
  velocity + capacity anchors used.
- **TL;DR — decide first** — the 2–4 things that gate the sprint (over-commit,
  external blockers, unplanned spillover, unsized tickets).
- **Planned tickets** — table: `Ticket | Title | SP | Code state | Remaining |
  Doc`. Mark carried-in spillover and put their restpoints in the `Remaining`
  column.
- **Dependency map** — internal ordering constraints and external blockers
  (Phase 2), with who/what blocks whom.
- **Realism** — planned load (remaining SP + restpoints) vs velocity vs capacity,
  with the over/under-commit verdict and rationale (Phase 4).
- **Proposed order** — the ordered list with per-item rationale (Phase 5).
- **Doc actions** — BLIs created, BLIs flagged for mismatch, migration
  expectations.
- **Local anchors** — the BLI / spec / code paths a reader should open.

Then, for each **mine** ticket confirmed scheduled in the target sprint, set the
BLI's `## Status` → `Planned for Sprint <N>.` (BLIs stay in `docs/backlog/` —
`close-sprint` moves them out only when delivered).

## Phase 7 — Review pause (stop here)

Print a summary: planning-doc path, planned load (remaining SP + restpoints) vs
velocity verdict, count of external blockers, count of already-started tickets,
count of BLIs created, count of mismatches flagged, and any unplanned spillover.
Then stop. The document is the deliverable — do not edit the tracker.

## Output

End with a concise list of:

- The planning-doc path (`docs/sprint-<N>-planning.md`).
- Planned load (remaining SP + restpoints) vs velocity/capacity verdict (over /
  under / on-track), and which tickets are already started in code.
- BLIs created and BLIs marked `Planned for Sprint <N>`.
- Doc ↔ tracker mismatches flagged (awaiting a user decision).
- External blockers and unplanned spillover that need a user/PO decision.
