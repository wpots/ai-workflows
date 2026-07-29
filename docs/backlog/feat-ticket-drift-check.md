# Feature: Ticket-drift Check Skill

## Status

draft

## Priority

high

## Summary

A read-only skill that compares a tracker ticket's **current** acceptance criteria
and comments against the work actually done on the branch, so scope that moved
after the branch was cut is caught before review instead of after.

## User Story

As a developer, I want to know when the ticket changed under my feet — an AC edited,
a comment that redefined the scope, an AC nothing in my diff addresses — so that the
MR I open still matches what the team agreed the ticket means.

## Acceptance Criteria

- [ ] New `skills/ticket-drift-check/SKILL.md` with frontmatter `name`,
      `description` (including a `Use when …` routing cue), and no unknown keys, so
      `scripts/validate-skills.mjs` passes.
- [ ] The skill is **read-only** on the tracker: it reads the issue and its comments
      and never writes, transitions, or comments.
- [ ] It resolves the ticket from an explicit key, the branch name
      (`^([A-Z]+-[0-9]+)`), or the MR description — in that order — and stops with a
      clear message when no ticket can be resolved.
- [ ] It reports, grouped and severity-ordered: acceptance criteria changed or added
      since the branch started, scope changed by a comment, acceptance criteria not
      covered by the diff, and diff areas not traceable to any acceptance criterion.
- [ ] It states its evidence per finding (which AC, which comment, which files), so
      the verdict is checkable rather than asserted.
- [ ] It is callable from `skills/create-pr` (pre-flight), `skills/work-backlog`
      (before implementing), and `skills/address-review-comments` (rework), and says
      so in the skill body.
- [ ] It degrades honestly: no tracker access in the session → report that the check
      could not run, never a false "no drift".
- [ ] Listed in `docs/workflow-canonical-sources.md` and placed in
      `docs/pipeline-map.md`.

## Technical Notes

Tracker reads go through the Atlassian MCP tools (`getJiraIssue`, plus the comment
endpoints); instance ids are per-site and must be discovered at runtime — see the
"Jira gotchas" section of `skills/jira-ticket/SKILL.md` for the established pattern.

For local backlog items (`docs/backlog/`) the same comparison applies against the
BLI's `## Acceptance Criteria` block, which `skills/work-backlog` already treats as
the definition of done. Supporting both sources keeps the skill useful in projects
without a tracker.

"Since the branch started" is not directly available from Jira history in a cheap
way. Prefer comparing the ticket's current state against what the branch actually
contains (commits, diff, MR description) over reconstructing a timeline.

## Out of Scope

- Writing to the tracker in any form.
- Deciding whether the drift is acceptable — that stays a human call.
- Auto-updating the MR description from the ticket.

## Related

- [../../skills/create-pr/SKILL.md](../../skills/create-pr/SKILL.md)
- [../../skills/work-backlog/SKILL.md](../../skills/work-backlog/SKILL.md)
- [../../skills/address-review-comments/SKILL.md](../../skills/address-review-comments/SKILL.md)
- [../../skills/jira-ticket/SKILL.md](../../skills/jira-ticket/SKILL.md)
- [../pipeline-map.md](../pipeline-map.md)
