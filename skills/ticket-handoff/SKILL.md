---
name: ticket-handoff
description: The ticket's stretch after the test comment — read the replies since the last handoff comment, classify the newest (findings, no findings, product owner approves, product owner rejects, unclear), route findings to a backlog item or a new ticket, draft the assignee's comment for the product owner and post it after approval, check the Done layer before Done, and name the assignee's move with the ticket link. Never moves a ticket and never fixes anything. Use when a tester or the product owner has commented on a ticket in test or acceptance ("tester commented", "test findings", "bevindingen", "geen bevindingen", "PO approved", "PO rejected", "naar acceptatie", "ticket naar done", "ticket handoff").
metadata:
  owner: wieteke.pots
---

# Ticket Handoff — Test and Acceptance Comments

After `skills/mr-merged` posts the test comment, the ticket goes back and forth
by comment: the team tests and comments back, the assignee hands it to the
product owner, the product owner approves or rejects. This skill reads the
newest reply, says what it means for the ticket, and prepares the assignee's
next step. The flow, the roles and the Definition of Done are
`rules/ticket-flow.md`.

The skill classifies and routes; the assignee decides and moves the ticket.

## Tracker write — safety

This skill contains the repo's third sanctioned tracker write (after
`skills/jira-ticket` and `skills/mr-merged`): one comment for the product owner
when the test came back without findings.

- **Show the comment for approval and only post after an explicit go.** Never
  post silently.
- Moving the ticket is the assignee's handwork. This skill names the move with
  the ticket link and neither makes nor offers it. It moves a ticket only when
  the user asks in this session and gives a go on the key and target status
  (`skills/service-cli` § Ticket status).
- It never fixes a finding and never writes the backlog item or the new ticket
  itself: it hands those to `skills/backlog` and `skills/jira-ticket`.
- Everything else in this skill is tracker-read-only.

## Step 1 — Resolve the ticket

Take the key from the argument, or from the current branch name
(`^([A-Z]+-[0-9]+)`). No key → ask which ticket. Do not guess.

Read the ticket and its comments through the CLI
(`skills/service-cli/references/jira.md`):

```bash
jira issue view <KEY> --raw \
  | jq '{key, summary: .fields.summary, status: .fields.status.name, assignee: .fields.assignee.displayName}'
jira issue view <KEY> --plain --comments 10
```

`--comments` shows the last N comments (one by default). Raise N until the last
handoff comment (Step 2) is in view.

## Step 2 — Find the last handoff comment

The last handoff comment is the newest comment in which the assignee hands the
ticket on:

- the test comment from `skills/mr-merged` ("How to test this", with a test
  checklist) — the ticket is in test;
- the comment for the product owner from Step 4 (where to test, what to test,
  known deviations) — the ticket is in acceptance.

The comments after it are the replies. The newest reply is the one to classify;
the earlier ones are its context. No handoff comment in the ticket → report it
as unclear. A handoff comment without a reply → the test or the acceptance is
not back yet; report who is up next and stop.

## Step 3 — Classify the reply

Read the reply in its own language: "geen bevindingen" and "akkoord" are as
clear as their English.

| Class | After | The reply | Move |
| --- | --- | --- | --- |
| Findings | the test comment | names something that does not work, does not match the design or the criteria, or is missing | In Test → In Progress |
| No findings | the test comment | says the test passed and names no finding | In Test → Acceptatie |
| Approves | the comment for the product owner | the product owner accepts | Acceptatie → Done, once the Done layer holds |
| Rejects | the comment for the product owner | the product owner does not accept, with reasons | Acceptatie → In Progress |
| Unclear | either | anything else | none |

Unclear is reported with the quote, its author and date, and never guessed.
It covers:

- a question, or a reply that can be read two ways ("akkoord, maar …");
- a reply that does not fit its place in the flow, such as an approval while
  the ticket is in test;
- a finding in an earlier reply that the newest one does not say is resolved.

## Step 4 — Per class

**Findings, or a rejection.** List each finding or reason, quoted short, with
its author. Propose per finding whether it is in scope: within the ticket's
acceptance criteria or a line of the test checklist it fails. The user decides.

- In scope → hand to `skills/backlog`: a bug or task item carrying the ticket
  key. Fixing it is `skills/work-backlog` on that item.
- Out of scope → hand to `skills/jira-ticket` for a new ticket, which confirms
  before it creates anything.

The tester's findings or the product owner's reasons are the comment that goes
with the move, so this skill drafts no comment here.

**No findings.** Draft the comment for the product owner, from the ticket, the
test comment and its replies — never invented:

- **Where to test** — the environment the product owner tests on (acceptance
  where the project has it, per `CONVENTIONS.md`; otherwise development) and
  the navigation path in the product.
- **What to test** — the capability in feature language and the acceptance
  criteria to check.
- **New instructions** — what the product owner needs that the team did not,
  such as a test account or content to create; "none" when there are none.
- **Known deviations** — from the design or the criteria, each with its reason;
  "none" when there are none. This is where the Done layer finds them written.

Write it in the tracker's working language, matching the project's existing
tickets, and keep it readable in one minute (`skills/jira-ticket` § Ticket
length).

**Approves.** Check the Done layer of `rules/ticket-flow.md` line by line; a
project's own Definition of Done in `CONVENTIONS.md` or on its board wins.

- the product owner approved in a comment — this reply;
- no finding is open — no finding in the replies without a later resolution,
  and no item in `docs/backlog/` carrying the key that is not `done`;
- todos and out-of-scope findings are tickets of their own — each one names a
  ticket key or appears in the ticket's links;
- deviations from the design are written in the ticket — in the comment for
  the product owner or the description;
- the change is on acceptance where the project has that environment — the
  merge commit is an ancestor of the acceptance branch
  (`git merge-base --is-ancestor <sha> <remote>/<acceptance-branch>`).

Report each line that fails with what is missing. A line the skill cannot read
is reported as "not checked — confirm by hand", never as holding. The move to
Done is named only when every line holds.

## Step 5 — Post after approval

Show the draft for the product owner. After the go, write it to a file in the
scratchpad and post it with the CLI:

```bash
jira issue comment add <KEY> -T <path/to/comment.md> --no-input
```

Only when `jira` is not installed and cannot be installed now: resolve the
`cloudId` via `getAccessibleAtlassianResources` (instance ids drift — discover
at runtime, never hardcode) and post with `addCommentToJiraIssue`, and say in
the recap that the connector was used. Report the ticket URL in the recap.

## Step 6 — Name the move

Status names differ per project. Match them by their place in the flow
(`rules/ticket-flow.md` § Statuses and handoffs): the current one from Step 1,
the target from the statuses the project's tickets carry:

```bash
jira issue list --jql 'project = <PROJECT> AND updated >= -30d' --raw \
  | jq '[.[].fields.status.name] | unique'
```

No match → use the flow's name and say so. Name the move as the assignee's
action, with the link (`<server>/browse/<KEY>`, server from `jira serverinfo`):
`RFW-288: In Test → Acceptatie — https://<site>.atlassian.net/browse/RFW-288`.
A ticket that is already where the class puts it needs no move; say so. Do not
make the move or offer to.

## Step 7 — Degrade honestly

No tracker available (no `jira` CLI and no connector, or the lookup fails):
classify a reply the user pastes and say the tracker was not read. Report the
comment for the product owner as **drafted but undelivered** and include the
draft in the recap so it can be pasted by hand.

## Step 8 — Retrospective check

End by checking whether this run needed intervention (corrections, re-steering,
failed steps needing a workaround). If it did, hand off to
`skills/improve-skill` before closing out.

## Recap

Report in one block: the ticket and its status as read back, the reply
classified (quote, author, date), the findings and where each went (backlog
item, new ticket, or still to decide), the comment for the product owner
(posted with URL, or drafted and undelivered), the Done layer per line, and
anything skipped and why.

End with exactly one `Next step:` line:

| Outcome | Next step |
| --- | --- |
| findings, rejection, no findings, or approval with every Done line holding | the assignee's move, with the link |
| approval with a Done line failing or not checked | the assignee resolves or confirms that line |
| unclear | the assignee asks the commenter what they meant |
| no reply yet | the team tests, or the product owner accepts |

## Constraints

- One ticket per invocation.
- Never guess an unclear reply.
- Never post a comment without the approval described above, and never
  transition a ticket unless the user asked for it and gave a go on the key and
  target status.
- Never fix a finding, and never create the backlog item or the ticket for it
  without the skill that owns it.
