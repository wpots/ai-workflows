# MR board follow-ups — Reference

A merge closes an MR, not the work that still has to ship after it: a security
fix that only reached development, or a back-merge that waits on a Monitor the
session will outlive. The maintainer's local MR board (`mr-board`, a personal
CLI that is not part of this plugin) keeps that work as a separate follow-up,
so it stays visible when no session is running. `skills/dependency-hotfix`,
`skills/mr-merged` and `skills/release` add and close follow-ups with this
recipe. Nothing here touches GitLab, Slack or the tracker.

## Is the board there?

Run `mr-board status --summary`. A failure (command not found, service not
running) → skip the board for this run and say so in one recap line. Never
install, start or repair it, and never wait on it.

## The title is the identity

`mr-board task add` has no dedupe (every call mints a new id) and `status` does
not show a task's link, so a follow-up is found by its title. Write
`<PROJECT> <kind> !<iid>: <what>`, with `<PROJECT>` the Jira project key
(`RFW` from `RFW-337`) or the repository name when there is no ticket, in the
board's language (Dutch):

- `RFW back-merge hotfix !541: production terug naar acceptance en development`
- `OBA release !711: security patch (next 16.4.2) naar productie`

Find before add, so a resumed run does not file a second one:

```sh
mr-board status | jq '[.entries[] | select(.key | startswith("task:")) | select(.section != "done") | select(.title | startswith("RFW back-merge hotfix !541"))]'
```

## Add

```sh
mr-board task add 'RFW back-merge hotfix !541: production terug naar acceptance en development' --next-step 'Na merge en live: production mergen in acceptance en development.' --notes '2026-10-26: hotfix-MR open, auto-merge aan.' --url '<MR url>'
```

`--notes` holds dated facts, never status prose: a note that says "acc: 16.3.7"
is wrong the day after, and the board does not refresh it. `--next-step` holds
the one thing still to do.

## Close

Only after the skill has read the fact back, never on intent:

| Kind | Closed when |
| --- | --- |
| `back-merge hotfix` | `git merge-base --is-ancestor origin/<production> origin/<branch>` holds for every long-lived branch that exists |
| `release` | the MR's merge or squash commit is an ancestor of the release tag, and the deploy read-back is green |

```sh
mr-board task done 'task:<id>'
```

Then read `mr-board status` back and report the section it landed in. A
follow-up that cannot be verified stays open and goes in the recap with what is
missing.
