---
name: release
description: Run a production release end to end around the project's own release runbook — pre-flight, a "release is starting" mail draft with a two-hour indication, the promotion, tag and GitLab Release the runbook prescribes, customer release notes, a "release is live" reply draft with the overview of changes, an optional post in the project's Slack channel, the shipped tracker tickets tagged with the version and their status read back, and the housekeeping after it (sprint or support-month close and compaction, stale branches and worktrees). Asks who gets the mail and proposes sharing in Slack; drafts mail, never sends it. On a project without versions it proposes introducing them once and records the decision. Use when the user starts, runs or finishes a release ("release starten", "start the release", "naar productie", "release afronden", "promote acceptance to production"), or asks to version and close the tickets of a release ("versie op de tickets", "tickets van de release naar done").
metadata:
  owner: wieteke.pots
---

# Release

A release is more than the push to production. Around it sit the parts that
otherwise depend on someone remembering: telling the customer it starts and
that it is live, the notes, the tracker, and the cleanup afterwards. This
skill owns those parts and runs them in order.

The mechanics belong to the project. Its runbook — `docs/release-process.md`,
or whatever `CONVENTIONS.md` points to — decides versioning, the cut, the
promotion, the tag, deploy verification and the back-sync. This skill
follows that runbook and never invents steps it does not name.

One project and one release per invocation.

## What this skill writes

Everything outward-facing is listed in the Step 3 plan and approved there in
**one** go:

- the runbook's own writes: release commit, promotion, tag, GitLab Release,
  back-sync — exactly as the runbook prescribes;
- two Gmail **drafts**: "release is starting" and "release is live". The
  user sends them. This skill never sends mail. When the connector cannot
  write, the mail text goes in the reply instead;
- Slack posts in the project channel, only when the user chose to share;
- one reply in the dependency scanner's Slack thread, when its latest scan
  lists the project under *Fix now* or *Deploy to fix now* (Step 8c);
- closing the maintainer's local MR board follow-ups that this release
  shipped, when `mr-board` is installed (Step 8d). Local only;
- tracker writes for the tickets the plan lists: a version (or the label
  fallback). No status change: Jira's automation moves tickets from the
  pipeline, and Step 7 reads the status back;
- when the user chose to introduce versioning: the setup MR through
  `skills/create-pr`, and the baseline tag on the current production
  commit. When they chose "no versions", the one line in `CONVENTIONS.md`
  that records it.

Branch and worktree deletion is approved separately at the end, per item
(Step 8). Never: send a mail, post to Slack without that yes, transition a
ticket without the user's go on that ticket (Step 7), force-push, skip a runbook check, or run
`skills/close-sprint` or `skills/compact-sprint` inline — they are separate
lanes with their own review pause.

## Step 0 — Resume or start

A release spans an hour or more and can cross sessions. Derive the state from
git, GitLab and Gmail, never from memory:

| State | Resume at |
| --- | --- |
| nothing cut yet: `## [Unreleased]` still open, no tag beyond the last | Step 1 |
| release commit on the pre-production branch, production does not contain it | Step 5, promotion |
| production contains the release commit, tag or GitLab Release missing | Step 5, tag |
| tag and Release exist | Step 6 onwards: notes, live mail, tracker, housekeeping |

**After a pause.** When the release waited for acceptance or another go (a day
or more), the table above is only where you start: re-derive the state before
the promotion. The pre-production tip may have moved or been re-cut (a second
release commit), the changelog date and the production dump are as old as the
pause, and the Step 3 plan was approved for the old scope. Re-read scope,
tickets and pre-flight, redo the dump and the production checks, show the
delta against the approved plan, and get a go on the changed scope. A
scratchpad does not survive between sessions: rebuild the watcher scripts.

**After the fact.** "Give the tickets of the last release a version and move
them to Done" is the last row: run Step 7 (and Step 8 when asked) for that
tag only. "The last release" is the newest tag whose range carries ticket
work. A hotfix tag without ticket keys has nothing for the tracker, so list
the recent tags with their ticket counts and say which tag you took.

## Step 1 — Read the project (read-only)

- **Runbook.** `docs/release-process.md` or the `CONVENTIONS.md` pointer. No
  runbook: stop and ask how this project releases — which branch deploys
  production, versioned or not — and offer to record the answer in
  `docs/release-process.md`.
- **Versioning.** Semver tags (`git tag --list 'v*' --sort=-v:refname`), the
  `version` in `package.json`, `CHANGELOG.md` with `## [Unreleased]`. No
  versions, and no "Versioning" decision in `CONVENTIONS.md`: Step 2 proposes
  introducing them once. A recorded "no versions" decision is respected: the
  mails name the release by date and the tracker step writes no version.
- **Scope.** `<last tag>..<pre-production ref>` as the runbook defines it;
  for an unversioned project, `<production ref>..<pre-production ref>`.
  Collect ticket keys from commit subjects and bodies, and from the merged
  MRs' titles, source branches and descriptions in that range
  (`glab api ".../merge_requests?state=merged&updated_after=<last tag date>"`).
  Step 7 classifies them.
- **Runbook pre-flight facts.** Migrations, env changes, cron or infra
  changes. A migration in scope decides the "can editors keep working" line
  in the start mail.
- **Tracker versions.** Jira goes CLI first, through the recipes in
  `skills/service-cli`: `jira release list -p <KEY>`. Versions in use mean
  the project works with fixVersions. None means Step 2 asks.
- **Mail.** Is the Gmail connector available, and can it write? Reading works
  without compose rights, so a successful search proves nothing about
  drafting; Step 4 has the fallback. Find the previous release mail:
  `search_threads` with `in:sent subject:release` plus this project's customer
  domain or name, `newer_than:180d`. A generic word such as "website" also
  matches another client's thread. Count a hit only when its recipients or
  text name this project's customer: those recipients are the proposal for
  Step 2, and its wording is the model, next to
  [references/release-mails.md](references/release-mails.md). A release mail to
  a different client is a model for wording only, never a recipient proposal.
- **Slack.** The channel `CONVENTIONS.md` names (a `Slack` or
  `Notifications` entry with the channel id), and whether the connector is
  available.
- **Sprint or support close.** Input for Step 8a: the latest finished sprint
  or support month, whether its changelog exists, and whether delivered
  backlog items still sit in `docs/backlog/`.

## Step 2 — Questions

Ask with `AskUserQuestion`, at most four per call. Skip what `CONVENTIONS.md`
already answers, and ask a second call only for what remains.

1. **Recipients** of the release mails. Offer the previous release mail's
   To and Cc as the recommended option; "Other" takes free text. Without a
   hit, ask with no recommended option: "leave them empty, I fill them in" is
   a valid answer, and the drafts then carry no To or Cc. Offer to record the
   answer in `CONVENTIONS.md` under "Release communication", so the next
   release does not ask.
2. **Slack.** Recommend sharing in the linked channel: "start and live" /
   "live only" / "no". Without a known channel, ask for it or drop the
   question.
3. **Version**, when the runbook leaves a choice: the runbook's default
   bump, with a one-line scope summary.
   **Unversioned project without a recorded decision**: ask instead whether
   to introduce versions. The options are "introduce: a setup MR now, the
   next release is the first versioned one" (recommended for a project that
   releases in batches), "not now, ask again next release", and "no
   versions, record that". This release stays unversioned in every case:
   changing the release process halfway through a cut is the risk this
   avoids.
   [references/introduce-versioning.md](references/introduce-versioning.md)
   says when versions pay off, what the setup MR contains, and how to record
   the decision.
4. **Tracker without versions**: "label `vX.Y.Z`" (recommended) /
   "create a Jira version" (needs project-admin rights) / "no version".

When a migration is in scope and the runbook does not say whether editors
can keep working, ask that too.

## Step 3 — Plan, then one go

Show one plan block plus the start-mail draft text, then ask for the go:

```
Project       greenberrynl/<client>/<site> · runbook docs/release-process.md
Version       1.2.0 (minor) · scope v1.1.2..origin/acceptance · 14 commits, 9 tickets
Pre-flight    no migration · env unchanged · nightly window clear (now 09:40)
Start mail    draft to 6 recipients, subject "Release V1.2.0"
Release       cut on acceptance → acc rehearsal → ff-push to main → deploy read-back → tag + GitLab Release → back-sync
Notes         skills/release-notes, v1.1.2..v1.2.0, product owner, Dutch
Live mail     reply in the same thread, overview from the notes
Slack         #<channel>: start message, live reply in the thread
Scanner       reply "patched" in the dependency-scan thread of 20 Oct (payload 3.86.0 → 3.90.2), or "not listed"
Tracker       fixVersion v1.2.0 on 11 tickets, 2 of them partial (RFW-295 MR still open, RFW-292 open PO question) · status read back after the deploy, no transitions · open, no version: RFW-301 (MR only)
Housekeeping  support-2026-09 not closed yet → close-sprint after this run · stale branches listed at the end
```

No go, no writes.

## Step 4 — Start mail

- Create the draft with `create_draft`: recipients from Step 2, subject in
  the form of the previous release mail (default `Release V<x.y.z>`), body
  per [references/release-mails.md](references/release-mails.md).
- The connector does not add the user's Gmail signature. The recap says so.
- **Without compose rights** `create_draft` fails with "Insufficient scope".
  Do not retry and do not look for another route: put the mail text in the
  reply (subject, To and Cc as known, body), say that the Gmail connector
  needs compose rights (re-authorize it in the claude.ai connector settings),
  and carry on. The live mail in Step 6 does the same.
- **Acceptance gate.** When the runbook asks for an accepted acceptance state
  before the cut, the customer's start mail waits for that acceptance. The
  acceptance deploy gets one internal mail instead
  ([references/release-mails.md](references/release-mails.md) § Acceptance
  deploy mail), and the start mail goes out when the promotion starts.
- Slack, when chosen: one parent message with the same content. Keep its
  `ts`; every later Slack post is a reply in that thread.
- **Pause** until the user says the start mail is out, or explicitly skips
  it. The promotion only starts after that.

## Step 5 — Run the runbook

Follow the runbook's release steps in order — cut, rehearsal deploy,
promotion, deploy read-back, tag and Release, back-sync. Where it is silent
about the deploy read-back, use Step 3 of `skills/mr-merged/SKILL.md`: read
the deploy job's log and the platform's own activity, not only a green job.

- Note the time production went live, in the customer's timezone. The live
  mail states it.
- Run the read-only smoke checks the runbook's verify step names: key pages
  and headers. The live mail only says the pages were checked when that
  happened.
- **Sandbox.** The read-back and verify steps need what the sandbox blocks:
  `clever-tools` (it writes the npm cache) and the pre-flight `pg_dump` or
  `psql` through Docker run with the sandbox off, and a `curl` to the
  production host needs that host in `allowed_domains`. Say where the dump
  lives and that a scratchpad is wiped between sessions: the user moves the
  dump when it is the rollback point.
- **Failure** (red pipeline, refused deploy, failed build): stop. Post a
  "blocked" reply in the Slack thread when sharing was chosen. Draft a short
  delay or rollback mail in the start-mail thread instead of the live mail.
  Rollback is the runbook's call and the user's go — never automatic.

## Step 6 — Release notes and the live mail

- Hand off to `skills/release-notes` for `<previous tag>..<new tag>`, with
  the production ref, the product owner as audience, and the customer's
  language. Its `docs/releases/<key>.md` is the source of the mail's
  overview. Reuse an existing notes file for this tag after checking its
  range.
- Find the sent start mail (`search_threads` with `in:sent` and the
  subject). Create the live mail as a reply draft, with `replyToMessageId`
  set to that message, so it lands in the same thread. Use `htmlBody` with a
  `<ul>` so the bullets render, and a plain `body` as the alternative.
- Slack, when chosen: a thread reply with the same overview in Slack's
  bullet format.

## Step 7 — Tracker

Classify every key from the scope before writing anything:

| Evidence | Class | Write |
| --- | --- | --- |
| key in a commit subject or squash commit, or in a merged MR's title or source branch in the range | shipped | version |
| key only in an MR description, as context ("anonymisation is RFW-218") | context | nothing |
| shipped, and also an open MR still carries the key, or the PO reported it still reproducible after the merge, or a PO question in the comments is unanswered | partial | version, like `shipped` — report it with the reason |
| an open MR carries the key and no commit or merged MR in the range does | open | nothing — report it with the open MR |

The version follows the code: every key with a commit or merged MR in the range
gets it, in whatever status and with whatever PO question open. A ticket that
shipped without it reads as "not in this release". Done is a separate decision
(Moving on request): the version never implies it.

A key that sits only in an MR description, but with the statement that its work
landed through another MR of the range and a PO comment that clears it for
production, is a proposal for `shipped`: put it in the plan, flagged, and let
the go decide.

Read the comments of every shipped ticket that is not yet Done; that is
where partial delivery shows. `--plain` prints the whole description first;
the comment bodies are ADF JSON, so take the text nodes:

```bash
jira issue view <KEY> --raw | jq -r '.fields.comment.comments[]? | .author.displayName + " " + .created[0:10] + ": " + (([.body | .. | objects | select(.type=="text") | .text] | join(" "))[0:520])'
```

Then write, for the tickets the plan listed. Jira goes CLI first
(`skills/service-cli`); only version creation has no `jira` command and uses
the Atlassian connector.

```bash
# Version or label — the CLI appends, existing values stay
jira issue edit <KEY> --fix-version vX.Y.Z --no-input
jira issue edit <KEY> --label vX.Y.Z --no-input

# Verify, and read the status back
jira issue list --jql 'project = <KEY> AND labels = "vX.Y.Z"' --plain --columns key,status,summary
```

- **Status.** Jira's automation moves tickets from the pipeline; this step
  does not (`skills/service-cli` § Ticket status). After the deploy, report
  every shipped ticket that is not in the project's done category yet, with
  its current status. A partial ticket the automation already moved to done
  is reported too: the work on it is not finished.
- **Moving on request.** Only when the user asks for it ("zet ze op done"):
  list the shipped tickets that are not done, each with its current and
  target status, and wait for the go on that list. Then run
  `jira issue move <KEY> "<status>"` for exactly those keys. Partial, open and
  context tickets never go on the list. Take the target from the project's
  own done-category status, as used by tickets that are already done;
  workflows differ per project. When `jira issue move` refuses, list that
  ticket's transitions with the connector (`listJiraIssueTransitions`) and
  use the one whose target is in the done category.

- **Answering a partial ticket.** When the release answers a PO question on a
  partial ticket ("is deze om te testen?"), offer a comment: what is live
  since when, where, and how to test it. That is a tracker write with its own
  go. `jira issue comment add <KEY> --template <file> --no-input` keeps
  paragraphs and lists intact.
- **Version.** When the project works with versions and `jira release list`
  does not show this one yet, create it with the connector's
  `manageJiraProjectVersion` (`action: create`, the numeric project id,
  named after the tag, release date, `released: true`). Then set the
  fixVersion per ticket with the CLI.
- **No rights.** Version creation that returns 404 "Project with key 'null'
  either does not exist or you do not have permission to create versions"
  for both the key and the numeric id means the user lacks project-admin
  rights. Fall back to the label `vX.Y.Z`, and say that a project admin can
  create the version later. Say in the recap that Releases and the Fix Version
  field stay empty, and where the label shows: the ticket's Labels field and
  `labels = "vX.Y.Z"`.
- **Connector fallback** (no `jira` CLI installed): `editJiraIssue` sets
  labels and fixVersions instead of appending, so read the current values
  and send them along. Say in the recap that the connector was used.

Projects on another tracker run the same classification. Their writes go
through that tracker's connector or CLI, or stay as a list in the recap when
neither can write.

## Step 8 — Housekeeping

**8a. Sprint or support close.** Find the sprint or support month this
release completes, by the merge dates in the range. Two signals:

- Its changelog is missing (`docs/sprint-<N>-changelog.md` or
  `docs/support-<yyyy>-<mm>-changelog.md`), or delivered backlog items still
  sit in `docs/backlog/`. The close has not run: hand off to
  `skills/close-sprint`.
- Archive folders older than the previous period still exist: hand off to
  `skills/compact-sprint` afterwards.

Both run in the user's own checkout with their own review pause. Name the
hand-off; do not run either inline.

**8b. Stale branches and worktrees.** Collect and classify as Phase 8 of
`commands/close-sprint.md` does, with two differences:

- Measure "merged" against the production ref after the release, because the
  release is what made those branches stale.
- For a squash-merged branch, prove the merge as Step 5 of
  `skills/mr-merged/SKILL.md` describes before `git branch -D`. Also list
  remote source branches of merged MRs that survived the merge, checked
  against the remote itself (`git ls-remote --heads origin <branch>`, or
  `git fetch --prune`): remote-tracking refs outlive branches GitLab deleted
  on merge, and `git branch -r` lists them as survivors. Inside the sandbox
  `git branch -D` prints a `.git/config` lock warning and still deletes;
  `git branch -dr origin/<branch>` removes a stale tracking ref.

Never list protected branches (`main`, `master`, `development`, `acceptance`,
`staging`, `production`) or the checked-out branch. A dirty worktree is
reported, never removed. Show the itemized list, then delete only the items
the user approves. Verify that each approved item is gone.

**8c. Dependency scanner thread.** The weekly scan post in Slack lists a
project under *Deploy to fix now* when its fix sits on a branch but not on
production yet, and says a release fixes it. This release is that fix, so
close the loop once the deploy read-back is green:

- Find the newest post: `slack_search_public` for "Dependency scan: action
  items", then `slack_read_thread`. Skip the step when the project is listed
  under neither *Fix now* nor *Deploy to fix now*.
- Check before claiming: for each listed package, read the version the tag
  ships (npm: `git show <tag>:package-lock.json | jq -r
  '.packages["node_modules/<pkg>"].version'`) and compare it with the
  scanner's fixed version. A package still below it is not patched: say that
  and name the package instead.
- Reply once in that thread, in its language: the project, "gepatcht" or the
  equivalent, the live version and date, each package as `name@shipped` with
  the scanner's `old → fixed`, and that the scan of `<date>` predates the
  release, so the next scan clears it. `generatedAt` in the scanner's
  `report.json` gives that date (`skills/dependency-hotfix` shows how to
  fetch it). Never write that the scanner confirms the fix before a scan after
  the release says so. The Step 3 go covers this post.

**8d. MR board follow-ups.** `skills/mr-merged` adds a `<PROJECT> release
!<iid>` follow-up on the maintainer's local MR board for a security fix that
reached development before production. Once the deploy read-back is green, list
the project's open ones as `skills/mr-merged/references/mr-board-followups.md`
describes, and close each whose MR commit the tag ships:
`git merge-base --is-ancestor <merge-or-squash-sha> <tag>`. Read the sha from
`glab api "projects/<enc-path>/merge_requests/<iid>" | jq -r '.merge_commit_sha // .squash_commit_sha'`.
A follow-up the tag does not ship stays open and goes in the recap. Skip the
step when `mr-board` is not available.

## Step 9 — Recap

| | |
| --- | --- |
| Release | version, tag and GitLab Release links, or "unversioned" with the recorded decision |
| Deploy | read-back result and the live time, or ⚠️ with the quoted response |
| Mails | draft links, whether the start mail was sent, the signature reminder |
| Slack | thread link, or "not shared" |
| Scanner thread | reply link, "not listed", or "not patched" with the package still below its fixed version |
| Board | follow-ups closed by this release, left open with the reason, or "mr-board not available" |
| Notes | `docs/releases/<key>.md` |
| Tracker | version or label with the ticket count (partial ones included) and where to find it, shipped tickets not yet done with their status, tickets moved on the user's go, partial and open tickets with the reason |
| Housekeeping | close and compact hand-offs, branches and worktrees removed or kept |
| Not done | each skipped step and why |

The recap ends with one `Next step:` line, from the first row that applies. A
human action names who takes it: `<action> (<who>)`.

| Outcome | Next step |
| --- | --- |
| Deploy ⚠️ | the deploy, with the quoted response (you) |
| Live mail drafted | send it (you) |
| Shipped tickets not yet done | move them, with the links (assignee) |
| Close not run (Step 8a) | `close-sprint`, the hand-off named there |
| Otherwise | none: the release is closed |

Run needed intervention (corrections, re-steering, a workaround) → hand off
to `skills/improve-skill/SKILL.md` before closing out.

## Constraints

- Mail is drafted, never sent. Slack is posted only after the user's yes.
- The runbook decides the mechanics. When this skill and the runbook
  disagree, the runbook wins and the recap names the difference.
- No promotion before the user confirms the start mail is out or skips it.
- Tracker writes only for the tickets in the approved plan. Partial tickets
  get the version like shipped ones and stay in their status; open and
  context tickets get nothing.
- No status change without the user's go on that ticket; the plan's go does
  not cover it.
- Branch and worktree deletion only per approved item, never protected
  branches, never a dirty worktree.
