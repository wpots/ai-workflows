---
name: mr-merged
description: Post-merge closeout for a merged MR/PR — move the sprint-board item to done, draft a "How to test this" comment for the product owner and post it to the ticket after approval, propose the ticket transition, and clean up the branch and worktree. Use when an MR/PR has just merged ("MR merged", "post-merge", "afgerond na merge"), when watch-mrs reports a merge, or when the user asks to close out a merged change.
---

# MR Merged — Post-merge Closeout

Merging is where most workflows stop; everything after it usually depends on
someone remembering. This skill owns that tail: board, product-owner handoff,
ticket, and cleanup — one pass, nothing silent.

Works standalone (someone else merged it) and as the hand-off target when
`skills/watch-mrs` reports a merge.

## Tracker write — safety

This skill contains the repo's second sanctioned tracker write (after
`skills/jira-ticket`): one "How to test this" comment on the ticket.

- **Show the comment for approval and only post after an explicit go.** Never
  post silently.
- Ticket transitions are proposed, never executed, unless the user explicitly
  says otherwise in this session.
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

## Step 2 — Sprint board

Follow the `skills/sprint-board` opt-in rule: update the board **only when
`docs/board/` already exists** in the project — move the item `In Review →
Done`. Never create the board from this skill; if the project has no board,
skip and note it in the recap.

## Step 3 — Draft "How to test this"

Aimed at a non-developer, derived from the MR description and diff — never
invented:

- **What changed** — one or two sentences, feature language, no file paths.
- **Where to see it** — URL or navigation path in the product.
- **What to click / do** — concrete steps in order.
- **What to expect** — the observable result per step.
- **Not included** — what this change explicitly does not do, so the PO does
  not test scope that never shipped.

Write it in the tracker's working language, matching the project's existing
tickets — not the language of the chat session. If the diff gives no
user-observable behaviour (pure refactor, CI, tooling), say so in the comment
draft instead of inventing steps ("no user-facing change; verify by …").

## Step 4 — Post after approval

Show the draft. After the go: resolve the `cloudId` via
`getAccessibleAtlassianResources` (instance ids drift — discover at runtime,
never hardcode; see the gotchas in `skills/jira-ticket`) and post with
`addCommentToJiraIssue`. Report the posted comment URL in the recap.

## Step 5 — Propose the transition and clean up

- Look up the ticket's current status and propose the next transition (e.g.
  to review/done) — as a suggestion in the recap, not an action.
- Ask, then delete the merged source branch (local + remote if it survived
  the merge) and prune any worktree used for it
  (`git worktree remove <path>`). Skip silently held-back branches only when
  the user says to keep them.

## Step 6 — Degrade honestly

No tracker available (no MCP connection, no ticket key, or the lookup fails):
still do the board update and cleanup, and report the "How to test this"
comment as **drafted but undelivered** — include the draft in the recap so it
can be pasted by hand. Never skip the draft just because posting is
impossible.

## Step 7 — Retrospective check

End by checking whether this run needed intervention (corrections, re-steering,
failed steps needing a workaround). If it did, hand off to
`skills/improve-skill` before closing out.

## Recap

Report in one block: MR + merge commit, board transition (or "no board"),
comment posted (URL) / drafted-undelivered, proposed ticket transition,
branch/worktree cleanup, anything skipped and why.

## Constraints

- One MR per invocation.
- Never deploy, trigger releases, or generate release notes
  (`skills/close-sprint` owns the sprint level).
- Never transition tickets or post comments without the approval described
  above.
- Keep the structure open for a future "verify on staging/production" step
  (Deploy-health gate) — do not build it now.
