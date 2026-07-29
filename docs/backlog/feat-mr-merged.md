# Feature: MR-merged Closeout Skill

## Status

draft

## Priority

medium

## Summary

A post-merge closeout skill: move the board, hand the product owner a "how to test
this" comment on the ticket, propose the ticket transition, and clean up the branch
and any worktree. Today merging is where the workflow stops, and everything after it
depends on someone remembering.

## User Story

As a product owner, I want a short "how to test this" note on the ticket as soon as
the change is merged, so that I can verify it without asking the developer what
changed and where to look.

## Acceptance Criteria

- [ ] New `skills/mr-merged/SKILL.md` with valid frontmatter and a `Use when …`
      routing cue ("MR merged", "post-merge", "afgerond na merge").
- [ ] Works standalone (someone else merged it) and when invoked by
      `skills/watch-mrs`.
- [ ] Moves the item to done on the sprint board when the project keeps one
      (`skills/sprint-board`).
- [ ] Drafts a **"How to test this"** comment aimed at a non-developer: what changed,
      where to see it, what to click, what to expect, and what is explicitly not
      included. Derived from the MR description and diff, not invented.
- [ ] The comment is shown for approval and only then posted to the ticket; the skill
      never posts silently.
- [ ] Proposes the ticket transition (e.g. to review/done) and reports it as a
      suggestion — the transition is a human decision unless the user says otherwise.
- [ ] Deletes the merged branch and prunes any worktree used for it, after asking.
- [ ] Ends by checking whether the run needed intervention and, if so, hands off to
      `skills/improve-skill`.
- [ ] Degrades honestly when no tracker is available: still does board and cleanup,
      reports the comment as undelivered.
- [ ] Listed in `docs/workflow-canonical-sources.md` and placed in
      `docs/pipeline-map.md`.

## Technical Notes

Tracker writes are sanctioned but rare in this repo: `skills/jira-ticket` is the
precedent — confirm the content with the user, then write. Use
`addCommentToJiraIssue`; discover instance ids at runtime.

Write the comment in the tracker's working language, matching the project's existing
tickets, not the language of the chat session.

This skill is also the natural home for the Deploy-health gate if post-deploy
verification is added later — keep the structure open for a "verify on
staging/production" step without building it now.

## Out of Scope

- Deploying or triggering a release.
- Release notes or changelog generation (`skills/close-sprint` covers the sprint
  level).
- Automatic ticket transitions without confirmation.

## Related

- [../../skills/watch-mrs/SKILL.md](../../skills/watch-mrs/SKILL.md)
- [../../skills/sprint-board/SKILL.md](../../skills/sprint-board/SKILL.md)
- [../../skills/jira-ticket/SKILL.md](../../skills/jira-ticket/SKILL.md)
- [../../skills/improve-skill/SKILL.md](../../skills/improve-skill/SKILL.md)
- [../pipeline-map.md](../pipeline-map.md)
