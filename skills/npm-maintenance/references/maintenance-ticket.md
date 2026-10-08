# Maintenance ticket and subtasks

Every MR that comes out of maintenance work hangs under the Jira maintenance
ticket of the quarter in which the work is done, as its own subtask. That
covers a critical dependency hotfix, a regular dependency update and other
periodic upkeep. The quarterly ticket is where a human tracks and checks the
maintenance scope, so it stays theirs.

## Rules

- **Only subtasks are created or updated.** The parent ticket stays under
  human control: no edits, no comments, no links and no transitions on it.
- **One subtask per MR.** A critical hotfix and the regular maintenance that
  follows are separate MRs, so they are separate subtasks.
- **No parent for the current quarter means stop and ask.** Never create the
  parent.
- **Create the subtask before the MR.** The MR then carries the key from the
  start, and the GitLab–Jira integration closes the subtask on merge.

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

## Create the subtask

```sh
jira issue create -p <KEY> -t Sub-task -P <PARENT> -s "<summary>" -T <body.md> -a <assignee email> --no-input
```

- Read the subtask type's name from an existing one
  (`-q 'issuetype in subTaskIssueTypes()'`); it is `Sub-task` in most
  projects.
- Write the summary and body in the tracker's language; match the project's
  recent tickets.
- The body says what the scanner or audit reported (advisory ids, severity),
  what the MR changes, what stays open and why, and the MR link once it
  exists. Put it in a file and pass `-T`, which avoids quoting trouble.
- Assign it to the person who runs the work.

## Link the MR

- Follow the project's ticket convention in the MR. In RefugeeWork the title
  starts with the key (`RFW-326: chore(deps): …`) and the description starts
  with `Closes RFW-326`. The integration reads that.
- Add a remote link on the subtask:
  `jira issue link remote <SUBTASK> <MR URL> "MR !<iid>: <title>"`.
- The integration moves the subtask when the MR merges. It cannot close a
  subtask created after its MR merged. Move that one yourself with
  `jira issue move <SUBTASK> "Done"`, and only that one: this is the subtask
  exception to leaving tracker status alone.

## Expected side effect

Jira automation may move the parent from Open to In Progress when a subtask
moves. On the first run, "Automation for Jira" did this, and the parent's
changelog shows it. Report it and never undo it, because the parent is not
yours to change.

## Recap line

The parent key, untouched. Each subtask key with its status and its MR link.
