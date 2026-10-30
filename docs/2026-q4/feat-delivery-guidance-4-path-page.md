# Feature: The Path of a Ticket in AI-WORKFLOWS.md

## Status

done

Drafted and flipped to ready 2026-10-13 with the maintainer. Delivered 2026-10-30.

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

## How to verify

- `bash scripts/smoke-test-project-sync.sh` → `Project sync smoke test passed.`,
  including the two new assertions on the synced `AI-WORKFLOWS.md`: the heading
  `## The Path of a Ticket` and the link `(rules/backlog.md#definition-of-ready)`.
  On `main` (aa2819d) a synced `AI-WORKFLOWS.md` has no such heading
  (`grep -c` → 0), so both assertions fail on the base.
- `node scripts/validate-skills.mjs` → `OK: 40 skills validated, 107 docs
  link-checked, no errors.` (one existing warning: `create-pr` SKILL.md at 506
  lines).
- `bash scripts/validate-ai-instructions.sh` → no drift.
- AC "sync regenerates the section without touching `CONVENTIONS.md`": a temp
  project with a hand-written `CONVENTIONS.md`, synced first from `main`
  (heading absent), then from this branch. The sync prints
  `[ok] CONVENTIONS.md exists (preserved — project-owned)`, the section lands at
  line 117 of `AI-WORKFLOWS.md`, and `cmp` against a copy of `CONVENTIONS.md`
  taken before the sync reports no difference.
- AC "links to the Definition of Ready": the synced `rules/backlog.md` sits next
  to `AI-WORKFLOWS.md` and has `## Definition of Ready` at line 207, so the
  relative link resolves in the project.
- By eye, in `templates/project-ai-workflows.md` § The Path of a Ticket: eleven
  steps from refinement to acceptance, each with what you type and a Who column
  (you, the agent, reviewer, the team, the PO); the gate paragraph above the
  table and the bold step 4 put the ready check between your decisions and the
  unattended build; the last line covers projects without sprints.

## Related

- Depends on: feat-delivery-guidance-3-next-step-in-recaps.md
- [../../templates/project-ai-workflows.md](../../templates/project-ai-workflows.md)
- [../../scripts/sync.sh](../../scripts/sync.sh)
- [../../scripts/smoke-test-project-sync.sh](../../scripts/smoke-test-project-sync.sh)
- MR: https://gitlab.com/greenberrynl/config/ai-workflows/-/merge_requests/339
