# Refinement Runbook

Canonical runbook for preparing and recording a backlog refinement. The
`refinement` skill on skill-aware tools (Claude, Codex, Cursor) wraps this
runbook; Copilot and other prompt-first tools should follow these steps
directly.

Goal: turn a set of issue-tracker tickets into a single, decision-ready
refinement document — grouped, sized with story-point **proposals**, with
conflicts surfaced and a focused question list per ticket — and (after the
session) record the outcome. The issue tracker is read-only throughout — never
edit issues, transitions, or comments.

## Modes

This runbook has two modes. Ask the user which one at the start (default: infer
from whether a `docs/plans/refinement-<date>.md` already exists for today).

- **prep** (before the session) — fetch tickets, ground them in the code, and
  produce the question/decision document.
- **outcome** (after the session) — re-fetch the same tickets (they usually
  changed during refinement), diff against the prep doc, and rewrite it into a
  "decided / changed / still open" record.

## Safety

- **Never** mutate the issue tracker (no comments, transitions, edits,
  assignments, story points). Story points are **proposed in the doc only**; the
  user sets them in the tracker.
- **Never** run `git commit` — the user commits themselves.
- Story-point scale: small change = 1, 13+ = split. Proposals start the
  conversation, they are not final.
- Stop and ask when a ticket is ambiguous or empty; do not invent scope.

## Inputs

Ask the user at start (keep it to one question at a time):

1. Which tickets? A sprint name, an explicit key list, or "the next refinement".
2. Issue-tracker project key (infer from existing backlog filenames, e.g. the
   uppercase acronym used in `docs/backlog/<KEY>-*.md`).
3. Mode (`prep` / `outcome`) — or let it infer from today's doc.

## Phase 0 — Tracker connection is mandatory

A live connection to the issue tracker is a **hard precondition**. Refining on
local docs alone produces estimates on stale information — do not do it. Use the
**most efficient method available**:

1. The tracker's **MCP connector** if it is connected — richest data, full
   description + acceptance criteria + parent in one query. Preferred.
2. The tracker **CLI** otherwise (e.g. `ankitpokhrel/jira-cli` for Jira — verify
   with `jira me`).

If neither connects, **stop** and help the user get connected before continuing:

- MCP: walk them through authenticating the connector.
- Jira CLI: `brew install ankitpokhrel/jira-cli/jira-cli` then `jira init`.

Never silently fall back to local-only refinement.

## Phase 1 — Fetch tickets (read-only)

Via the connected method from Phase 0, fetch the batch in scope. With an MCP,
query by the tracker's query language (e.g. JQL `key in (KEY-1, KEY-2, ...)`)
and request description, status, issue type, parent, and the story-point field.
With a CLI (Jira example):

```bash
jira issue list --plain --no-truncate --jql 'project = KEY AND key in (KEY-1, ...)'
jira issue view KEY-XX --plain   # per-ticket: description, AC, links, parent
```

Capture per ticket: key, summary, parent/epic, status, current story points (if
any), full description + acceptance criteria, linked issues, last-updated
timestamp.

## Phase 2 — Ground each ticket in the codebase

For each ticket, before writing any question, check what already exists so
questions are specific and you don't ask about things already built:

1. Locate any local doc: `docs/backlog/<KEY>-*.md`, `docs/specs/`,
   `docs/plans/`.
2. Search the code for the surfaces the ticket touches (routes, collections,
   constants, components). Note what exists vs. what's new.
3. Flag, per ticket, whether a **DB migration** is expected (convention: every
   refined item states migration expectation).
4. Flag whether a **data-layer access-rule** change is implied (e.g. a Payload
   access rule).

## Phase 3 — Write the refinement document

Write to `docs/plans/refinement-<YYYY-MM-DD>.md`. Use this structure:

- **Header** — date, when prepped, how many tickets, SP-scale reminder, and the
  note that story points are proposals (not set in the tracker).
- **TL;DR — decide first** — the 2–4 blocking decisions that gate the rest
  (status models, rescoped/empty tickets, tightly-coupled groups).
- **Grouping** — group related tickets (usually by epic / shared surface) in
  tables: `Ticket | Title | What | SP proposal`. Note the dependency chain
  within a group and external dependencies outside the batch.
- **Conflicts (critical — resolve first)** — contradictions between tickets
  (enum mismatches, overlapping scope, fields referenced but not defined).
- **Questions per ticket** — a short, specific question list per ticket. Prefer
  questions that block sizing or implementation. Avoid questions answered by the
  code (Phase 2) or the acceptance criteria.
- **Cross-ticket questions** — migrations expected, access-rule changes, design
  coverage, "already refined / only needs sizing".
- **Local anchors** — the spec/BLI/code paths a reader should open.

## Phase 4 — Review pause (stop here, prep mode)

Print a summary: doc path, ticket count, number of blocking decisions, and the
biggest SP risks. Then stop. The document is the deliverable for the session —
do not edit the tracker or BLIs.

## Phase 5 — Outcome (after the session, outcome mode only)

Run only when the user returns after refinement:

1. Re-fetch the same tickets (Phase 1). They usually changed during the session.
2. Diff each ticket against the prep doc. Classify every prep question as:
   - **decided** — answered in the acceptance criteria now, or decided in
     session.
   - **changed** — ticket scope/parent/fields changed materially (call out
     rescoped or rewritten tickets explicitly — these usually need re-sizing).
   - **still open** — unresolved; carry forward as a blocker.
3. Rewrite the doc into an outcome record with sections: `TL;DR — status`,
   `Decided during refinement`, `Grouping (after refinement)` (with a "change vs
   <prep-date>" column), `Still open (before pickup)`, `Cross-ticket`, `Local
   anchors`.
4. Note where story points still need to be set in the tracker (the user does
   this).

## Phase 6 — Optional BLI follow-up (after user ack)

Only on explicit request. For tickets that are now decided and ready, draft or
update the backlog item in `docs/backlog/` following `rules/backlog.md`
(PO-friendly acceptance criteria, field table for persisted fields, migration
expectation noted, `Related` links). Do not move or relocate BLIs — that is the
`close-sprint` flow's job.

## Output

End with a concise list of:

- The refinement doc path (written or rewritten)
- Ticket count and blocking-decision count
- Biggest SP risks / rescoped tickets
- Items still open that need a PO/user decision before pickup
