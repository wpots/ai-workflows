# Ticket Flow

> Apply when a skill checks whether a story is ready for a sprint (refinement
> prep, sprint planning), comments on a tracker ticket, reads its status back,
> or checks whether it may be called done: the test handoff after a merge, test
> findings, the product owner's acceptance, the release.

A ticket moves through the sprint by comments between people, and the board
follows the comments. Skills draft the comments and read the board back; the
people move the ticket.

## Roles

- **Assignee** — one per ticket, and it stays on that person from start to
  Done. The assignee writes the handoff comments and moves the ticket.
- **The team tests.** There is no named tester: whoever picks up the test
  comments back to the assignee, with findings or with none. A tester is never
  made assignee.
- **Product owner** — accepts or rejects in a comment. Never made assignee
  either.

## Statuses and handoffs

Status names differ per project (one board says Open where another says To Do);
match them by their place in this flow, and read the project's board when in
doubt.

| From → to | When | Comment with it |
| --- | --- | --- |
| In Progress → In Test | every item carrying the key is done on the default branch and deployed to development | how to test this, for the team (`skills/mr-merged`) |
| In Test → In Progress | the test comment reports findings | the tester's findings |
| In Test → Acceptatie | the test comment reports no findings | for the product owner: where and what to test, new instructions, known deviations |
| Acceptatie → In Progress | the product owner rejects in a comment | the product owner's reasons |
| Acceptatie → Done | the product owner approves in a comment and the Done layer below holds | — |

## Moving is handwork

- **No skill moves a ticket.** The assignee does, by hand. On some projects
  Jira's automation moves a ticket on a pipeline event, such as a merge.
- A skill reads the status back. When the ticket is not where the handoff puts
  it, the recap names the move as the assignee's action — key, current and
  target status, and the ticket link:
  `RFW-288: In Progress → In Test — https://<site>.atlassian.net/browse/RFW-288`.
- The skill does not offer to make the move. The one exception, a move the
  user asks for with a go per ticket, and the hook that enforces it are in
  `skills/service-cli` § Ticket status.

## Definition of Ready

A story is ready for a sprint when every line below holds. A project's own
Definition of Ready, in its `CONVENTIONS.md` or on its board, wins over this
one. Bugs, tasks and support tickets are not held against it.

| Line | Ready when |
| --- | --- |
| Sections | Description, Acceptance criteria, Visual design and Dependencies are filled (Omschrijving, Acceptatiecriteria, Visual design, Afhankelijkheden); Dependencies may say there are none |
| Placeholder | no `(specificeren)` behind the title |
| Flag | the story is not flagged |
| Design | the design is linked in the body when the story has UI |
| Epic | the story sits under an epic |
| Size | the story is sized in story points |
| One capability | the title and description read as one capability, not two joined by "and"; a story may still take more than one MR (`rules/backlog.md` § One Ticket, Many Items), so this line is not sized against `rules/mr-sizing.md` |

Refinement prep and sprint planning read each story's issue type, body, parent,
Flagged field and story points, and report per story the lines that fail. The
report is the output: neither edits, flags, comments on or moves the ticket.

## Definition of Done

Three layers, one per handoff: a ticket goes to the next status when its layer
holds. A project's own Definition of Done, in its `CONVENTIONS.md` or on its
board, wins over this one.

| Layer | Holds when | Checked by |
| --- | --- | --- |
| Dev — before In Test | the MR was reviewed by someone who did not write it, its checks passed, every item carrying the key is `done` on the default branch, and the deploy to development went out | `skills/create-pr`, the reviewer, `skills/mr-merged` |
| Test — before Acceptatie | every line of the test checklist below holds | the team, from the checklist in the test comment |
| Done — before Done | the product owner approved in a comment; no finding is open; todos and out-of-scope findings are tickets of their own; deviations from the design are written in the ticket; the change is on acceptance where the project has that environment | the assignee |

The test checklist, filled in per ticket in the test comment, as plain bullets:

- each acceptance criterion, one line apiece
- the design against Figma at desktop, tablet and mobile width
- the project's browser matrix
- WCAG 2.2 AA: keyboard only, visible focus, contrast, labels a screen reader
  reads (`rules/accessibility.md`)
- copy as in Figma
- the edge cases and error states the change touches

Leave out a line that cannot apply, and say why in a few words: a change
without UI has no design or WCAG line.
