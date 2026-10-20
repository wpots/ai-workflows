# Maintenance tickets

Maintenance work gets one of two tickets, and never a subtask:

| Work | Ticket | The MR |
| --- | --- | --- |
| A critical on production (`skills/dependency-hotfix`) | its own Task with label `maintenance:critical` | closes it: `Closes <KEY>` |
| Everything else: highs within two weeks, moderate and low, other periodic upkeep | the quarter's maintenance ticket, label `maintenance:periodical` | names it and never closes it |

A critical has its own deadline (24–72 hours), so it gets a ticket that is
tracked and closed on its own. The quarter's ticket collects the rest of the
quarter's maintenance, and a human closes it.

## Rules

- **The quarter's ticket stays under human control.** No edits, no comments,
  no links and no transitions on it. An MR only names it.
- **One open critical ticket per Jira project.** The dependency scanner files
  one through gb-dashboard after a scheduled run, and skips the project while
  one is still open. Reuse that ticket; create one only when none is open.
- **Create the critical ticket before the MR.** The MR then carries the key
  from the start, and the GitLab–Jira integration closes the ticket on merge.
- **No ticket for the quarter means stop and ask** before a regular
  maintenance MR. Never create the quarter's ticket. A critical does not need
  it.

## The critical ticket

Look for an open one first:

```sh
jira issue list -p <KEY> -q 'labels = "maintenance:critical" AND statusCategory != Done' --order-by created --plain --columns key,status,summary,created
```

- One hit: use it. Read its description: the scanner lists one line per
  package. When the hotfix fixes only part of that list, the MR says
  `Refs <KEY>` instead of `Closes <KEY>`, and the recap names what remains.
- Some Jira projects hold more than one GitLab project (IAMS, IDHM), so the
  open ticket can belong to another one. When it does not show which GitLab
  project it is for, ask.
- No hit: create one.

```sh
jira issue create -p <KEY> -t Task -l maintenance:critical -s "<summary>" -T <body.md> -a <assignee email> --no-input
```

- Write the summary and body in the tracker's language; match the project's
  recent tickets.
- The body says what the scanner reported (advisory ids, severity), what the
  MR changes, what stays open and why, and the MR link once it exists. Put it
  in a file and pass `-T`, which avoids quoting trouble.
- Assign it to the person who runs the work.

## Find the quarter's ticket

Greenberry's Jira automation creates one ticket per project per quarter: type
Task, label `maintenance:periodical`, and the quarter in the summary, such as
"Refugeework onderhoud Q4-2026".

```sh
jira issue list -p <KEY> -q 'labels = "maintenance:periodical"' --order-by created --plain --columns key,type,status,summary,created
```

Take the ticket whose summary names the quarter of today's date (Q1 is
January to March). When none does, search the summaries for `onderhoud` or
`maintenance` and confirm the match with the user. The CLI wraps `-q` in its
own project filter and ordering, so put the sort in `--order-by`; an
`ORDER BY` inside the JQL fails with a 400.

## Link the MR

Follow the project's ticket convention. In RefugeeWork the title starts with
the key; the integration reads that.

- **Critical:** `RFW-325: fix(deps): …`, and the description starts with
  `Closes RFW-325`. Add a remote link on the ticket:
  `jira issue link remote <KEY> <MR URL> "MR !<iid>: <title>"`. The
  integration moves the ticket when the MR merges, but not a ticket created
  after its MR merged. Report that one in the recap with its status; move it
  only when the user asks and gives a go on that key
  (`skills/service-cli` § Ticket status).
- **Regular maintenance:** `RFW-319: chore(deps): …`, and the description
  starts with `Part of RFW-319`. Never `Closes`, `Fixes` or `Resolves`: the
  integration would close the quarter's ticket on merge. Add no remote link,
  because that is a change to the quarter's ticket.

## Expected side effect

The GitLab–Jira integration can comment on the quarter's ticket when an MR
names it. That comes from the integration, not from the run: report it and
leave it.

## Recap line

The critical ticket's key, reused or created, with its status and its MR
link. For regular maintenance: the quarter's key, untouched, and the MRs that
name it.
