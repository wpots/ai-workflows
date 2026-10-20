---
name: watch-mrs
description: Watch one or more of your open GitLab merge requests for new reviewer comments, merge-readiness (approval, pipeline, conflicts), and pipeline failures — naming the failing job and offering triage — optionally auto-merging once a MR becomes mergeable and handing off to the mr-merged closeout after a merge. Runs as a session-scoped background loop (Monitor + fallback heartbeat) built on `glab`. Use when the user asks to watch/monitor an MR, get notified on approval or new comments, or auto-merge when ready.
metadata:
  owner: wieteke.pots
---

# Watch MRs Skill

Sets up a recurring background check on one or more GitLab MRs and notifies on
change — new comments, merge-status transitions, and (opt-in) an automatic
merge once a MR becomes mergeable. This is a loop-building skill: it produces
a running `Monitor` task, not a one-shot answer.

## Inputs to confirm before starting

Only ask what isn't already given in the user's request.

- **Repo scope**: current repo only (default — infer from `git remote get-url
  origin`), or an explicit list of other repos. Never silently expand to "all
  repos the user has open MRs in" — that blast radius must be an explicit,
  confirmed choice (use `AskUserQuestion` and show the actual list of open
  MRs per repo via
  `glab api "merge_requests?scope=created_by_me&state=opened&per_page=50"`
  filtered/grouped by `project_id`).
- **MR scope**: specific MR id(s), or "all my open MRs in this repo."
- **Poll interval**: default 5 minutes (300s) unless told otherwise.
- **Auto-merge**: default **off** (watch + notify only). If the user asks for
  auto-merge, confirm in one `AskUserQuestion` round:
  - merge method (squash vs merge commit vs rebase)
  - delete source branch after merge (yes/no)
  - whether to skip the final confirmation before merging, or notify and wait
  Auto-merge is opt-in per invocation — never assume it from a prior session.

## Implementation

1. Resolve the repo slug in both forms: URL-encoded (`owner%2Fgroup%2Frepo`,
   for `glab api` paths) and slash form (`owner/group/repo`, for `glab mr
   merge --repo`).
2. Resolve the MR id list (explicit ids, or fetch via the `scope=created_by_me`
   query above and filter to the confirmed project).
3. Write a bash watcher script to a **stable location outside any ephemeral
   scratchpad** — `~/.claude/state/mr-watch/<repo-slug>/watch.sh` — so state
   (which comments were already seen, last known merge status) survives
   across sessions and re-invocations don't re-notify old items. Keep one
   state subdirectory per MR id. Under a Claude Code sandbox, a `Monitor`
   command has no bypass, and `~/.claude/state` fails with
   `Operation not permitted`. Probe it with `touch` first, and fall back to
   `/tmp/claude/mr-watch/<repo-slug>/`. The sandbox can write there, and the
   state survives sessions until a reboot.
4. Script logic, per poll cycle, per watched MR:
   - Fetch notes: `glab api projects/<enc-repo>/merge_requests/<id>/notes`;
     diff non-system note ids against `seen_notes.txt`; echo one line per new
     note (author + body). Guard every `glab`/`jq` call against empty output
     (`[ -n "$json" ]`) so a transient API hiccup doesn't kill the loop.
   - Fetch the MR: `glab api projects/<enc-repo>/merge_requests/<id>`; read
     `.detailed_merge_status`; echo on transition (`prev -> new`) — this field
     alone captures approval, pipeline result, conflicts and draft state.
     Skip `unchecked` and `checking`: GitLab sets them on every open MR each
     time the target branch moves and settles back on the old value minutes
     later. Neither store nor report them — only a settled status is a
     transition.
   - **Pipeline state, tracked separately**: keep `pipeline.txt` (last seen
     pipeline id + status) in the MR's state subdirectory, alongside
     `seen_notes.txt` — do not overload the merge-status file. Only when
     `.detailed_merge_status` indicates a CI problem (e.g. `ci_must_pass`,
     `ci_still_running` after a failure was seen), fetch the detail:
     `.head_pipeline.id`/`.status` from the MR payload, and on `failed` the
     jobs endpoint
     (`glab api projects/<enc-repo>/pipelines/<pipeline-id>/jobs`) filtered to
     `.status == "failed"`. Echo one line per pipeline transition — pipeline id
     + status change, and for failures the **failing job name and stage** —
     never re-report a pipeline id + status pair already in `pipeline.txt`.
     Keep the poll light: no pipeline fetch while CI is green.
   - If auto-merge is enabled and status is `mergeable`: run
     `glab mr merge <id> --repo <repo-slash> [--squash|--rebase]
     [--remove-source-branch] --yes`, echo the result, drop the MR from the
     active watch list. If auto-merge is off, just report `mergeable` and keep
     watching (nothing left to notify on unless someone re-opens/changes it).
   - If the MR comes back with `.state == "merged"` (someone else merged it),
     echo that and drop the MR from the active watch list — the hand-off below
     still applies.
   - **Use `bash` explicitly** (`#!/usr/bin/env bash`, or invoke the file via
     `bash path/to/watch.sh` from Monitor) — never assume the default shell.
     `status` is a reserved read-only variable in zsh and crashes the script
     silently if used as a variable name; this bit us once, use `merge_status`
     instead. macOS ships bash 3.2: no `mapfile`/`readarray` and no
     associative arrays — read the id list with `ids="$(cat active.txt)"` and
     `for iid in $ids`.
   - **Never edit the script while it runs**: bash reads a script as it
     executes, so a mid-run edit makes it run half-old, half-new lines. Stop
     the task, edit, start it again — the state files keep it from
     re-notifying.
5. Start the script with the `Monitor` tool: `persistent: true`, a specific
   `description` (repo + MR ids), no `timeout_ms` override needed. Under a
   sandbox, list `gitlab.com` in the Monitor's `allowed_domains`: `glab` runs
   there without a bypass once its host is declared. Where
   `Monitor` has no `persistent` option it expires after at most 30 minutes:
   re-arm it on the expiry notice. When only one event matters (the merge), a
   `run_in_background` Bash script that polls and exits on that event has no
   such cap and wakes the session once.
6. Arm a `ScheduleWakeup` fallback heartbeat (1200–1800s) with `prompt` set to
   re-invoke this skill with the same resolved args (repo, MR ids, interval,
   auto-merge config) — this is a safety net only; the Monitor is the real
   wake signal. Re-arm it after every `<task-notification>` from the Monitor,
   per the standard dynamic-loop pattern.
7. On each notification, relay only what changed — one short line per event
   (new comment / status transition / pipeline transition / merge result).
   Don't restate unrelated baseline info the user already saw.

## Hand-offs

Hand-offs are **proposals surfaced to the user, not silent autonomous fixes**:
the loop detects, the skills act — and only after the user (or the invocation's
explicit configuration) says go.

- **Failed pipeline** → report the failing job and stage, and offer two next
  steps. One is reproducing the failure locally with `skills/run-checks`. The
  other, on GitLab with Duo, is the **Fix pipeline with Duo** button on the
  failing pipeline, which proposes a fix or opens an MR.
- **`requested_changes` that outlives its thread** → GitLab keeps a reviewer's
  "requested changes" until that reviewer approves or someone bypasses it,
  also after the thread is resolved and the reviewer (GitLab Duo included)
  reports the finding fixed. Report it as the remaining merge blocker and
  offer to re-request that review; bypassing stays the user's call.
- **Merged** (auto-merge or observed external merge) → offer the post-merge
  closeout via `skills/mr-merged` (ticket status read-back, "How to test this" comment,
  branch/worktree cleanup), then drop the MR from the active watch list either
  way.

## Constraints

- Never expand repo or MR scope beyond what was explicitly confirmed.
- Auto-merge is opt-in per invocation, never a silent default carried over
  from a previous session or a different MR.
- This is a **session-scoped** loop: the Monitor and the heartbeat both stop
  when the session ends. It is not a durable cross-session cloud schedule —
  as of 2026-07, there is no GitLab connector for claude.ai remote-trigger
  routines, so `glab` auth (local config/SSH-key based) isn't available in a
  cloud sandbox. If the user asks for "keeps running after I close my
  laptop," say so plainly rather than building something that will silently
  fail on auth.
- To stop watching: `TaskStop` the Monitor task, and stop the heartbeat by
  simply not calling `ScheduleWakeup` again.

## Output

A running Monitor task (report its task id) watching the confirmed MRs, plus
a confirmation of: repo/MR scope, poll interval, and the current auto-merge
configuration.
