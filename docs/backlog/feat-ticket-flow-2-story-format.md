# Feature: The Team's Story Format in jira-ticket

## Status

in-progress

Flipped to ready 2026-10-29 by the maintainer after the ready check that split the
old slice 2.

## Slice

2/5 — `jira-ticket` writes stories in the team's format

## Priority

medium

## Summary

The team writes a story as a description of what is built and where it is used,
acceptance criteria, a link to the visual design and the dependencies, always under an
epic. A story that cannot be described yet carries "(specificeren)" behind its title; a
story that waits on design or research is flagged with the reason and the person who
has to answer is tagged. `jira-ticket` still writes "As a …, I want …, so that …" and
files a story without an epic unless the user names one. This slice brings its story
template and workflow in line with the team's format.

## User Story

As a developer filing a story, I want `jira-ticket` to write it the way the team reads
stories, so that the product owner and the team find the description, the design and
the dependencies in the same place on every ticket.

## Acceptance Criteria

- A story's body has four sections: description (what is built and where it is used,
  no "As a …, I want …, so that …" sentence), acceptance criteria, visual design and
  dependencies, with headings in the tracker's working language.
- The visual design section links to the component in the design file; a story without
  UI says so in that section instead of leaving it out.
- The dependencies section names what is not a ticket (content, a coupling, another
  party) or says there is none; a dependency on another ticket stays an issue link named
  at the confirm step.
- Every story is filed under an epic: the skill proposes one from the project's open
  epics and asks when none fits; it never picks one without the user's confirmation.
- A story the user cannot describe yet is filed as a placeholder: "(specificeren)"
  behind its title and the four section headings left empty, never invented content.
- When an open question holds up the build, the confirm step proposes flagging the story
  and a comment with the reason that mentions the person who answers; both happen only
  after the go, and the recap lists every flagged story.
- The Story caps stay at 250 words and 8 criteria, and a project's own issue-type
  template still wins over these headings.

## How to verify

- `claude plugin eval <worktree> --case jira-ticket-1 --runs 1 --ablation none
  --judge-model sonnet`: a5–a7 fail on the base and pass on the branch; a1–a4 keep
  passing (criteria 1–4, 6 and the caps of 7).
- Read `skills/jira-ticket/SKILL.md` § Templates: the Visual design placeholder says
  "or: no UI" (criterion 2), the Placeholder paragraph keeps the headings empty
  (criterion 5), and the intro still lets a project's own Story template win
  (criterion 7).
- Flag and mention: one write on a DEV test ticket after the maintainer's go; the
  result decides between the step 5 commands and the handwork line in the recap.

## Technical Notes

Approach: change the Story parts of `skills/jira-ticket/SKILL.md` only; the Bug and Task
templates stay as they are.

- `## Templates` → `### Story`: replace the `## User story` block with the four
  sections. English headings: Description, Acceptance criteria, Visual design,
  Dependencies; Dutch: Omschrijving, Acceptatiecriteria, Visual design,
  Afhankelijkheden. Open questions stay after them, in their current one-line format,
  and Out of scope stays last.
- `## Ticket length`: the Story row lists the four sections; the Story bullet drops
  "one user-story sentence" for "the description in at most three lines"; the
  Dependencies bullet says what goes in the section and what stays an issue link.
- `## Workflow` step 1: the facts for a story become what is built and where it is used,
  at least one criterion, the design link when it has UI, and the epic. Step 3 resolves
  the epic (`jira epic list --plain` for the open epics; the parent goes in with `-P`,
  or `jira epic add <EPIC> <KEY>` after the create). Step 5 shows the epic, the
  placeholder suffix and any proposed flag at the confirm step.
- `## Jira fields`: the parent row becomes "epic — always for a story"; drop "no parent
  unless the user names the epic".
- `## Jira gotchas`: the flag and the mention (see assumptions below).
- `## Output`: the recap lists placeholders and flagged stories.

Test level per criterion, in the existing case `evals/jira-ticket/jira-ticket-1/`
rather than a new one: its item already has a Figma frame, notification copy that is
still with marketing, and a product-owner question that blocks criterion 1. New graders:

- a5 (criteria 1–3): the body has Description, Acceptance criteria, Visual design
  (naming the Figma page and frame) and Dependencies (the marketing copy), and no
  "As a …, I want …, so that …" sentence.
- a6 (criterion 4): the response asks which epic the story goes under, or proposes one
  and asks to confirm it; it invents no epic key.
- a7 (criterion 6): the confirm step proposes flagging the story and a comment that
  gives the guest-search question as the reason and mentions the product owner; neither
  is claimed as done.

a1–a4 stay and must keep passing (criterion 7: the caps). Run the case on the base
first: a5 and a7 have to fail there. Update its `expected_outcome` with the new
behaviour. Review only: the no-UI half of criterion 2, criterion 5 (the placeholder
rule) and the project-template half of criterion 7 — the scenario has none of them, and
a second case for them would not pay for its run.

Assumption: this format is the default for every project, not only for the client whose
process it was written for; a project's own issue-type template and `CONVENTIONS.md`
still override it.

Assumption: the CLI can flag and mention. The Flagged field is in the CLI config as an
array of options (on this instance `customfield_10025`), so
`jira issue edit <KEY> --custom flagged=Impediment --no-input` should set it; the reason
and the mention go in a comment through `jira issue comment add`, with the person's
account id. Verify both with one write on a test ticket in the DEV project, after the
user's go, before writing the gotcha. Whatever the CLI cannot do becomes handwork named
in the recap with the ticket link, like moving a ticket (`rules/ticket-flow.md`): no
flag means "flag <KEY>", no mention means the comment names the person in plain text
and the recap says to tag them.

## Out of Scope

- The ticket-level Definition of Ready and the check in refinement and sprint planning
  (slice 3).
- The Bug and Task templates.
- Creating epics, and the tasks the team adds under a story.

## Related

- Depends on: feat-ticket-flow-1-test-handoff.md
- [../../skills/jira-ticket/SKILL.md](../../skills/jira-ticket/SKILL.md)
- [../../evals/jira-ticket/jira-ticket-1/prompt.md](../../evals/jira-ticket/jira-ticket-1/prompt.md)
- [../../rules/ticket-flow.md](../../rules/ticket-flow.md)
- [../../skills/service-cli/references/jira.md](../../skills/service-cli/references/jira.md)
