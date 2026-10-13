# Feature: The Path of a Ticket in AI-WORKFLOWS.md

## Status

ready

Drafted and flipped to ready 2026-10-13 with the maintainer.

## Slice

4/4 — one page in every synced project that shows the path from ticket to merged MR

## Priority

medium

## Summary

The recap lines (slice 3) guide a developer one step at a time; this slice gives them
the whole map. Every project's `AI-WORKFLOWS.md` gets a section that walks the path of
a ticket — which step comes when, what to type, and which steps are the developer's and
which the agent's — with the ready check as the visible gate between planning and the
autonomous loop.

## User Story

As a developer new to a project, I want one page that shows how a ticket travels from
refinement to a merged MR, so that I understand where my decisions sit before I hand
work to an agent.

## Acceptance Criteria

- `AI-WORKFLOWS.md` in a synced project has a section "The path of a ticket" that lists
  the steps from refinement to the post-merge closeout in order.
- Per step, the section shows what the developer types and whether the step is the
  developer's, the agent's, or the PO's.
- The ready check is shown as the gate: before it the developer decides, after it
  work-backlog may run unattended until the MR, and the review is human again.
- The section links to the Definition of Ready in `rules/backlog.md` instead of
  restating it.
- A project sync regenerates the section without touching `CONVENTIONS.md`.

## Technical Notes

- Template: `templates/project-ai-workflows.md`, next to `## How Developers Should Use
  This` (the closest existing section). `scripts/sync.sh` already renders the template;
  `scripts/smoke-test-project-sync.sh` checks the output — extend it with the new heading.
- Content source: the "Het pad van één backlog-item" slide in the October plugin demo
  and the path order in slice 3's Technical Notes. Write it as a table:
  `Step | You type | Who | Outcome`.
- A drawn version belongs in `docs/diagrams/<name>.drawio.svg` if a diagram is added
  (draw.io, never Mermaid).
- Changelog fragment `changelog.d/added.path-of-a-ticket.md`.

## Out of Scope

- Changing any skill's behaviour.
- A per-project variant of the path; projects without sprints follow the same steps in
  support mode and the page says so in one line.

## Related

- Depends on: feat-delivery-guidance-3-next-step-in-recaps.md
- [../../templates/project-ai-workflows.md](../../templates/project-ai-workflows.md)
- [../../scripts/sync.sh](../../scripts/sync.sh)
- [../../scripts/smoke-test-project-sync.sh](../../scripts/smoke-test-project-sync.sh)
