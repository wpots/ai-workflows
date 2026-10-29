---
name: mr-merged
description: Post-merge closeout for a merged MR/PR — check whether the ticket is actually complete (every backlog item carrying its key merged on the default branch), draft a "How to test this" comment for the product owner covering the whole capability and post it after approval, confirm the post-merge deploy went out, read the ticket status back, and clean up the branch and worktree. Use when an MR/PR has just merged ("MR merged", "post-merge", "afgerond na merge"), when watch-mrs reports a merge, or when the user asks to close out a merged change or whether it is live yet ("staat het live").
metadata:
  owner: wieteke.pots
---

# MR Merged — Post-merge Closeout

Merging is where most workflows stop; everything after it usually depends on
someone remembering. This skill owns that tail: product-owner handoff, ticket,
and cleanup — one pass, nothing silent.

Works standalone (someone else merged it) and as the hand-off target when
`skills/watch-mrs` reports a merge.

## Tracker write — safety

This skill contains the repo's second sanctioned tracker write (after
`skills/jira-ticket`): one "How to test this" comment on the ticket.

- **Show the comment for approval and only post after an explicit go.** Never
  post silently.
- Ticket status is Jira's automation's job: this skill reads it back and
  neither proposes nor makes a transition. It moves a ticket only when the
  user asks in this session and gives a go on the key and target status
  (`skills/service-cli` § Ticket status).
- Everything else in this skill is tracker-read-only.

## Step 1 — Resolve the merged MR

Accept an MR/PR URL or iid as the argument. When none is given, resolve the
most recently merged MR for the current branch:

- `glab mr list --merged --source-branch <current-branch>` (or
  `gh pr list --state merged --head <branch>`); take the newest.
- No match on the current branch → ask which MR this is about. Do not guess
  across branches.

Fetch what the closeout needs in one pass: `glab mr view <iid>` (title,
description, merge commit, source branch) and `glab mr diff <iid>` when the
description alone is too thin to describe what changed.

Extract the ticket key from the source branch name (`^([A-Z]+-[0-9]+)`) or the
MR title/description. No key → the tracker steps degrade (see Step 6).

## Step 2 — Is the ticket complete?

One ticket can carry several backlog items — one per reviewable MR
(`rules/mr-sizing.md`). The product owner can only test a **capability**, so the
handoff waits for the last slice instead of arriving three times half-finished.

Ticket completeness is derived, never tracked by hand: read `docs/backlog/` and
the sprint folders (`docs/sprint-*/`, where a `done` item moves in the commit
that sets it, per `rules/backlog.md`) for every item whose `Ticket` field
carries this key, and check each one's `Status` **on the default branch**
(`git show origin/main:<path>` — a `done` that only exists on a feature branch
has not shipped).

| Situation | Do |
| --- | --- |
| every item for the ticket is `done` on the default branch | continue to Step 3 — the ticket shipped |
| some items are still open | first check whether a merged diff already carries them — an MR can deliver an item it was never branched for, and then the item needs its close-out, not more work. Otherwise **skip the comment.** Report "slice 2/3 merged for PROJ-123; the product-owner handoff waits for `<remaining item>`" and continue with the cleanup |
| no local items carry this key (no backlog folder, or the work was not tracked there) | treat this MR as the whole ticket and continue to Step 3, saying so in the recap |

When the ticket **is** complete and it took several slices, the comment covers
the whole capability: read the merged items' `How to verify` sections and the
other slices' MR descriptions, not just this diff. A product owner testing a
feature does not care which MR delivered which half of it.

## Step 3 — Draft "How to test this"

Aimed at a non-developer, derived from the MR description, the diff, and the
ticket's items — never invented:

- **What changed** — one or two sentences, feature language, no file paths.
- **Where to see it** — URL or navigation path in the product.
- **What to click / do** — concrete steps in order.
- **What to expect** — the observable result per step.
- **Not included** — what this change explicitly does not do, so the PO does
  not test scope that never shipped.

Keep the whole comment readable in one minute, the rule `skills/jira-ticket`
sets for the ticket itself (§ Ticket length).

Write it in the tracker's working language, matching the project's existing
tickets — not the language of the chat session. If the diff gives no
user-observable behaviour (pure refactor, CI, tooling), say so in the comment
draft instead of inventing steps ("no user-facing change; verify by …").

## Step 4 — Post after approval

Show the draft. After the go, write it to a file in the scratchpad and post it
with the CLI (`skills/service-cli/references/jira.md`):

```bash
jira issue comment add <KEY> -T <path/to/comment.md> --no-input
```

Only when `jira` is not installed and cannot be installed now: resolve the
`cloudId` via `getAccessibleAtlassianResources` (instance ids drift — discover
at runtime, never hardcode) and post with `addCommentToJiraIssue`, and say in
the recap that the connector was used. Report the ticket URL in the recap.

## Step 5 — Read back deploy and ticket status, then clean up

- **Read the deploy back.** Find the target branch's pipeline for the merge or
  squash commit (`glab api "projects/<path>/pipelines?sha=<sha>"`), wait for
  its deploy job, and read the job's log, not only its status. A `canceled`
  pipeline whose deploy job never started was usually superseded by a later
  push to the target branch, not refused: take the oldest later pipeline on
  that branch whose sha contains the merge commit (`git merge-base
  --is-ancestor <merge-sha> <later-sha>`), read its deploy log instead, and
  name that pipeline in the recap. Wait in one
  bounded poll: every 30–60 s, for at most about 10 minutes (in Claude Code a
  Monitor until-loop, since a foreground `sleep` is blocked). A deploy job
  that has not run by then is ⏳ in the recap, with the pipeline link. A deploy job
  that only POSTs to a hook passes whatever the hook answers: a Vercel hook
  that refused (`{"error":{"code":"incorrect_git_source_info",…}}` instead of
  `{"job":{…}}`) leaves a green job and the environment on the previous
  build. Where the platform's CLI is at hand, confirm a deployment exists for
  the commit (`vercel ls <project> --scope <team> --meta
  gitlabCommitSha=<sha>`). A refused or missing deploy is a ⚠️ in the recap
  with the response quoted; retrying the job is the user's call, since this
  skill never deploys.
- **Read the ticket status back** and report it. Jira's automation moves the
  ticket from the pipeline; this step does not, and proposes no transition.
  When Step 2 found open items and the automation moved the ticket to done
  anyway, flag it in the recap: the remaining slices are still open.
- **Template-owned files.** In a project created from unicore-template
  (`.unicore.json`, or `scripts/husky/readme-checks.js` for a v3 project),
  intersect the MR's changed files with the template's `owned` globs —
  `skills/upstream-to-unicore` Step 1 says where to read them. When any match,
  name those files in the recap and propose `skills/upstream-to-unicore` as a
  harvest of this MR. Propose only; the harvest runs on the user's go.
- **Security fix that stopped short of production.** When the MR merged into a
  branch other than production (`main`, or `master` when there is none), its
  title, description or ticket names an advisory (`GHSA-`, `CVE-`, "advisory",
  "security"), and its merge or squash commit is not an ancestor of
  `origin/<production>`, the fix still has to ship. Propose a board follow-up
  `<PROJECT> release !<iid>: <what> naar productie` as
  `references/mr-board-followups.md` describes, finding it first so a second
  run adds nothing. Propose only, together with the cleanup approval below;
  `skills/release` closes it. A hotfix MR that targets production is
  `skills/dependency-hotfix`'s and needs nothing here.
- Ask once for cleanup approval, then treat the worktree and source branch as
  one batch. A cleanup is incomplete when the worktree is gone but the stale
  local branch remains:
  1. Inspect a linked worktree with `git -C <path> status --short`. Never
     remove, reset, or stash a dirty worktree; report the local work instead.
  2. Remove a clean linked worktree first with
     `git worktree remove <path>`.
  3. Delete the local source branch. For a merge commit, prove it is merged
     yourself: the local head equals the merged MR/PR source-head SHA and
     `git merge-base --is-ancestor <local> <remote>/<default>` succeeds; then
     use `git branch -D`. Do not let `git branch -d` decide: it checks the
     branch's upstream, or without one the current `HEAD`, not the default
     branch, so a checkout that sits on another session's branch refuses a
     fully merged one. For a squash merge, first verify that
     the current local branch head still equals the merged MR/PR source-head
     SHA, then use `git branch -D`. When the two differ, the forge may have
     rewritten the branch just before merging (GitLab's **Rebase** button, or
     a rebase-before-merge setting), so the SHAs can never match. Compare the
     content instead: `git range-diff <local>^..<local> <squash>^..<squash>`.
     A difference in the commit message and in context lines only is the same
     change, and `git branch -D` is safe. Any changed `+`/`-` line — or a
     local branch of more than one commit, which range-diff cannot pair with
     one squash — is local work the merge may not carry: report it and keep
     the branch. Do not decide with `git patch-id`: context lines count
     toward it, so an identical change rebased onto a moved base gets a new
     id.
  4. Delete the remote source branch if it survived the merge and the cleanup
     approval included it.
  5. Verify that both the worktree entry and local branch are absent.
     Skip either only when the user explicitly says to keep it.

## Step 6 — Degrade honestly

No tracker available (no `jira` CLI and no connector, no ticket key, or the
lookup fails):
still do the cleanup, and report the "How to test this"
comment as **drafted but undelivered** — include the draft in the recap so it
can be pasted by hand. Never skip the draft just because posting is
impossible.

## Step 7 — Retrospective check

End by checking whether this run needed intervention (corrections, re-steering,
failed steps needing a workaround). If it did, hand off to
`skills/improve-skill` before closing out.

## Recap

Report in one block: MR + merge commit, the ticket's standing (`3/3 items merged — ticket complete` or `2/3 — waiting on
<item>`), comment posted (URL) / drafted-undelivered / deferred to the last
slice, the deploy read-back (queued / refused, with the response / no deploy
job), ticket status as read back, template-owned files touched (with the
upstream proposal), a board follow-up for a security fix that is not on
production yet (proposed, added, or "mr-board not available"),
branch/worktree cleanup, anything skipped and why.

## Constraints

- One MR per invocation.
- Never post the product-owner comment while another item for the same ticket is
  still open — a half-shipped capability tested as if it were finished costs more
  trust than a late comment.
- Never deploy, trigger releases, or generate release notes
  (`skills/close-sprint` owns the sprint level).
- Never transition a ticket unless the user asked for it and gave a go on the
  key and target status; never post comments without the approval described
  above.
- The deploy read-back in Step 5 reads what the deploy job and the platform
  report; it does not test the deployed site. Keep the structure open for a
  future "verify on staging/production" step (Deploy-health gate) — do not
  build it now.
