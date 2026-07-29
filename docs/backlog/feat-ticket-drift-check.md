# Feature: Requirements Snapshot and Ticket-drift Check

## Status

draft

Readiness pass 2026-07-29 — blocked on a maintainer decision: the snapshot
format and location must be agreed with feat-requirements-traceability before
either is built (this item's own Technical Notes require it). Note the
create-pr wiring is owned by chore-create-pr-preflight-and-monitor, not this
item. First of the tracker chain: this → traceability → jira-feedback-loop.

## Priority

high

## Summary

Pin the requirements a branch is built against as a read-only snapshot when work
starts, then check the live ticket against that snapshot. Drift is
`snapshot vs live` — that is what makes the check reproducible and gives every
downstream gate a stable contract to test against.

## User Story

As a developer, I want the ticket's requirements pinned at the moment I start and the
current ticket compared against them, so that scope which moved under my feet is caught
before review, and so that a gate checking my work gives the same verdict tomorrow as
it does today.

## Acceptance Criteria

- [ ] New `skills/ticket-drift-check/SKILL.md` with frontmatter `name`,
      `description` (including a `Use when …` routing cue), and no unknown keys, so
      `scripts/validate-skills.mjs` passes.
- [ ] **Snapshot**: when work starts on a ticket, the skill writes a read-only snapshot
      of the requirements and acceptance criteria as they are at that moment into the
      branch, and never writes back to the tracker.
- [ ] The snapshot is generated, never hand-edited — a cache of the contract, not a
      second copy of the ticket. Its location and format are documented, and it is
      obvious from the file itself that editing it is wrong.
- [ ] The skill is **read-only** on the tracker: it reads the issue and its comments
      and never writes, transitions, or comments.
- [ ] **Drift check**: compares the live ticket against the snapshot and reports,
      grouped and severity-ordered: acceptance criteria changed, added, or removed since
      the snapshot; scope changed by a comment; criteria not covered by the diff; diff
      areas not traceable to any criterion.
- [ ] Material drift produces a re-snapshot as an explicit, reported action — the fact
      that requirements moved after work started is itself the signal, not a silent
      overwrite.
- [ ] It states its evidence per finding (which criterion, which comment, which files),
      so the verdict is checkable rather than asserted.
- [ ] It resolves the ticket from an explicit key, the branch name
      (`^([A-Z]+-[0-9]+)`), or the MR description — in that order — and stops with a
      clear message when no ticket can be resolved.
- [ ] Callable from `skills/create-pr` (pre-flight), `skills/work-backlog` (snapshot at
      start, check before the MR), and `skills/address-review-comments` (rework), and
      says so in the skill body.
- [ ] It degrades honestly: no tracker access in the session → report that the check
      could not run, never a false "no drift".
- [ ] Listed in `docs/workflow-canonical-sources.md` and placed in
      `docs/pipeline-map.md`.

## Technical Notes

The snapshot is the point. A gate that checks work against **live** Jira is not
reproducible — it passes or fails depending on when it runs, because the ticket keeps
moving after the MR is opened. Mirroring the ticket into the repo and syncing it back is
the wrong fix: two masters, prose conflicts, and Jira quietly demoted from single source
of truth. One-way and read-only avoids all of that.

Tracker reads go through the Atlassian MCP tools (`getJiraIssue`, plus the comment
endpoints); instance ids are per-site and must be discovered at runtime — see the
"Jira gotchas" section of `skills/jira-ticket/SKILL.md` for the established pattern.

For local backlog items (`docs/backlog/`) the BLI already **is** the pinned contract —
it lives in the branch and `skills/work-backlog` treats its `## Acceptance Criteria`
block as the definition of done. Only tracker-sourced criteria need snapshotting; say so
rather than adding a redundant snapshot for local items.

`docs/backlog/feat-requirements-traceability.md` verifies against this snapshot, so
agree the format between the two before either is built.

## Out of Scope

- Writing to the tracker in any form.
- Two-way sync of any kind.
- Deciding whether the drift is acceptable — that stays a human call.
- Auto-updating the MR description from the ticket.

## Related

- [../../skills/create-pr/SKILL.md](../../skills/create-pr/SKILL.md)
- [../../skills/work-backlog/SKILL.md](../../skills/work-backlog/SKILL.md)
- [../../skills/address-review-comments/SKILL.md](../../skills/address-review-comments/SKILL.md)
- [../../skills/jira-ticket/SKILL.md](../../skills/jira-ticket/SKILL.md)
- [../pipeline-map.md](../pipeline-map.md)
