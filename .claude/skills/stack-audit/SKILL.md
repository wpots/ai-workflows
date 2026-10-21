---
name: stack-audit
description: The quarterly audit of the ai-workflows AI stack, run as a sprint of one quarter — one audit file in docs/audits/, ranked backlog items keyed to it, and a close of the previous quarter's plan. Use when the user asks for the quarterly audit, a stack review or AI-stack review, the January, April, July or October audit, "kwartaalaudit", "stack audit", "audit van de AI-stack", wants backlog items filed or ranked from an audit, or asks how far the previous audit's plan got.
metadata:
  owner: wieteke.pots
---

# Stack Audit

The audit is a sprint of one quarter. The audit file is its planning document,
the backlog items keyed to it are its scope, the `work-backlog` loop is its
delivery, and the next audit opens with this one's close. Status always comes
from git, never from an earlier audit file: the July 2026 file still listed
`packages/` as open after it had been removed the same day.

## The quarter

| Phase | Sprint equivalent | Output |
| --- | --- | --- |
| 1. Close the previous plan | `close-sprint` | status table per rank |
| 2. Measure and research | — | baseline + dated outside changes |
| 3. Write the audit, review pause | `sprint-planning` | `docs/audits/<yyyy>-<mm>.md` |
| 4. Refine into backlog items | `refinement` | keyed BLIs, one readiness MR |
| 5. Deliver | the sprint itself | one MR per item via the loop |
| 6. Demo (optional) | `sprint-demo` | deck for colleagues |

Audits open in January, April, July and October; the file is named after the
month it opens (`docs/audits/2026-10.md`).

Call `backlog` (phase 4) and `work-backlog` (phase 5) directly. Do not call
`close-sprint`, `sprint-planning`, `refinement`, `sprint-demo` or
`compact-sprint`: they stop without a live Jira connection, which this repo
does not have, and close-sprint's BLI move collides with the release cut —
`scripts/backlog-archive.mjs` already archives every `done` item at each
release, with the release tag as the archive anchor. Borrow their shape (close
table, review pause, demo record), not their runbooks. Nothing gets compacted:
an audit file stays as the quarter's record.

## Phase 0 — Prepare

- Work in a worktree off `gitlab/main` (the canonical remote is `gitlab`;
  `origin` is the GitHub mirror) per `skills/create-pr/references/worktrees.md`.
  The main checkout is shared with other sessions.
- Read the latest file in `docs/audits/`: its ranked plan, its baseline numbers
  and its maintainer decisions are this run's inputs.

## Phase 1 — Close the previous plan

For every rank of the previous audit, read its backlog items by key (see Phase
4 for the key):

```sh
rg -l "Audit 2026-10\]" docs/backlog/                     # still open
git log gitlab/main --format= --name-only -S "Audit 2026-10]" -- docs/backlog/ | sort -u
git log gitlab/main -1 --diff-filter=D --format=%h -- docs/backlog/<file>
git show <sha>^:docs/backlog/<file>                       # last status before archive
```

The second command lists every item that ever carried the key; one that is gone
from `docs/backlog/` was archived by a release, and the last two commands read
it back. Narrow to one rank with `rg -w "roadmap item 3"` on the result. Items
filed before the key existed name their audit in prose only; find them with
`-S "October 2026 stack review"` (or the July equivalent) instead of the key.

Classify each rank: done (with MR links), in-progress, ready, draft (name the
blocking decision), parked, superseded, dropped (with the reason). Re-measure
every number the previous baseline holds with the same definitions; a changed
definition makes the delta meaningless, so say so instead of comparing.

## Phase 2 — Measure and research

Baseline on `gitlab/main`:

- plugin version (`.claude-plugin/plugin.json`), skill count, `CLAUDE.md` bytes
- `node scripts/delivery-metrics.mjs --since <previous audit date>`: merged MRs,
  median hours to merge, reverts, agent-authored share by label **and** by
  trailer (they diverge while the label is missing on some MRs)
- `node scripts/backlog-archive.mjs` (no `--write`): open items per status
- eval results from this quarter's runs, if any

Outside, since the previous audit's date: Claude Code (changelog, what's new,
docs), Codex, GitLab releases (Duo flows, CI), the standards (Agent Skills,
Agent Plugins), and the frontrunners (Anthropic engineering, obra/superpowers,
Every compound-engineering, and whoever the previous audit named). Primary
sources only. Every claim that would change a rank gets an adversarial check.
State the verification budget before the run, and report in "Confidence and
gaps" how many claims were checked: the October 2026 run checked 25 of 105
before its session limit and had to mark the rest single-source.

A research fan-out runs on subagents. Use the Workflow tool only when she asks
for one. Name the cost before a paid run: evals and research spend her seat,
and `claude plugin eval` always gets `--no-publish`.

## Phase 3 — Write the audit, then pause

`docs/audits/<yyyy>-<mm>.md`, sections in this order (the shape of
`docs/audits/2026-10.md`):

1. Header: measured against `gitlab/main` at plugin `<version>` (`<date>`), how
   it was produced, and a link to the previous audit.
2. TL;DR: at most five points.
3. Status of the previous plan: the Phase 1 table.
4. What changed outside: grouped by source, dated, single-source items marked.
5. Ranked plan: `Rank | Item | What to do now | Why it pays off | Impact | Effort`.
   "Why it pays off" names Quality, Time, Tokens, Automation, Security or Team
   scale plus the mechanism. Impact ▲ ► ▽, effort S/M/L. Then a "Dropped" line.
6. Decisions only the maintainer can make: answered (dated) and open.
7. Confidence and gaps.
8. Sources, grouped, at the end.

Rules for the file:

- Name backlog items by rank and description, never by file name.
  `scripts/backlog-archive.mjs` keeps a `done` item for as long as any tracked
  doc outside `docs/backlog/` names its file name, so a file name in the audit
  blocks its archive. The link runs from the item to the audit (Phase 4).
- Once the audit is merged, its ranks are stable keys. Re-ranking happens in the
  next audit, never by renumbering this one.

Then stop and hand over the file. She decides on the ranking and the open
decisions before anything is filed.

## Phase 4 — Refine into backlog items

Run `backlog` per rank, in rank order. On top of `rules/backlog.md`:

- `## Ticket` carries the audit key:
  `[Audit 2026-10](../audits/2026-10.md) — roadmap item 3`. `work-backlog`
  orders by "roadmap item N" from that field, and Phase 1 of the next audit
  greps for the key. A rank that needs several MRs gets slices that each repeat
  the key (`rules/backlog.md`, "One Ticket, Many Items").
- Re-check each rank's premise against fresh `gitlab/main` before filing: main
  moves several releases a week.
- `ready` only when the item needs no maintainer decision and every criterion
  can hold. Otherwise `draft`, with the blocking decision named under
  `## Status`.
- One readiness MR, docs only, within the `rules/mr-sizing.md` budget, carrying
  the audit file when it is new. Ranks deliberately not filed are listed in the
  MR description with the reason.

## Phase 5 — Deliver

Run `/loop work-backlog` scoped to the audit key: only `ready` items whose
`## Ticket` carries this audit's key, one open loop MR at a time. When no keyed
item is `ready`, stop the loop and report which decisions block which ranks.
Do not pick unkeyed `ready` items unless she names them. When the queue runs
dry mid-quarter, run Phase 4 again for the next ranks.

## Phase 6 — Demo (optional)

When the quarter's delivery is shown to colleagues, the Phase 1 table of the
next audit (or a fresh Phase 1 run) is the content. Build the deck as a Slides
artifact. Google Slides plays video only from Drive or YouTube, so the clips go
to Drive. The working folder `docs/demo/<yyyy>-<mm>-<slug>/` stays untracked.
Recordings of a skill at work come from `record-skill-demo`.

Afterwards, delete a local file only after finding its copy elsewhere by name
**and** byte size, file by file. An export or a zip is not proof of
completeness: after the October 2026 demo, a Flow export folder and its zip
each held clips the other lacked.

## Constraints

- Never commit to `main`: every change lands through an MR with reviewer
  `wieteke.pots` (`.claude/rules/upstream-mr.md`).
- The repo is mirrored to GitHub. Licensing tiers, roles and spend decisions go
  in as plain facts, without credentials, invoices or personal details.
- `docs/audits/` holds only audit files; working notes stay in the session or
  in memory.
