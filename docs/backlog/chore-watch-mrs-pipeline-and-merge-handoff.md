# Chore: watch-mrs Pipeline Awareness and Merge Hand-off

## Status

in-progress

Readiness pass 2026-07-29. Depends on feat-mr-merged so the merge hand-off
references a tracked skill. ACs 4 and 5 are already true in the committed
skill (auto-merge opt-in per invocation; bash/emptiness guardrails) — verify
and tick rather than re-implement. Reference `skills/pipeline-triage` without
the `.md` extension until that skill exists (`validate-skills.mjs` errors on
backticked paths that are not tracked files). Bump
`.claude-plugin/plugin.json` + `CHANGELOG.md` if the plugin release rule has
landed.

## Priority

high

## Summary

`skills/watch-mrs` currently reports `detailed_merge_status` transitions and stops
there. Make it track pipeline state in its own right and hand off: a failed pipeline
goes to `skills/pipeline-triage`, a merge goes to `skills/mr-merged`. The loop stays
thin — it detects, the skills act.

## User Story

As a developer watching my MRs, I want to be told which job failed and be offered the
triage immediately, and I want the post-merge closeout to start on its own, so that
watching an MR produces action instead of a notification I have to interpret.

## Acceptance Criteria

- [ ] The watcher tracks pipeline status separately from merge status, in the existing
      per-MR state directory (alongside `seen_notes.txt`), so a pipeline transition is
      reported once and not re-reported every cycle.
- [ ] On a failed pipeline the notification names the failing job (and stage), not
      just "failed", and offers `skills/pipeline-triage` for that MR.
- [ ] On merge the watcher hands off to `skills/mr-merged` and then drops the MR from
      the active watch list.
- [ ] Auto-merge behaviour is unchanged: still opt-in per invocation, never inherited
      from a previous session.
- [ ] The script keeps using `bash` explicitly and keeps guarding `glab`/`jq` output
      against emptiness; the `merge_status` naming caveat (zsh reserves `status`)
      stays documented.
- [ ] The skill body states that hand-offs are proposals surfaced to the user, not
      silent autonomous fixes.

## Technical Notes

`detailed_merge_status` already folds approval, pipeline result, conflicts and draft
state into one field, which is why the current loop is cheap. Pipeline detail needs a
second read (`.head_pipeline` on the MR, or the pipeline jobs endpoint) — only fetch
it when the merge status indicates a CI problem, so the poll stays light.

State lives in `~/.claude/state/mr-watch/<repo-slug>/<mr-id>/`; add one file for the
last seen pipeline id + status rather than overloading the existing merge-status file.

Both hand-off targets are separate backlog items; until they exist, the notification
plus a clear next step is the acceptable interim behaviour.

## Out of Scope

- Making the watcher survive session end (documented limitation: no durable GitLab
  connector for cloud runs).
- Watching pipelines outside merge requests.

## Related

- [../../skills/watch-mrs/SKILL.md](../../skills/watch-mrs/SKILL.md)
- [feat-pipeline-triage.md](feat-pipeline-triage.md)
- Depends on: [feat-mr-merged.md](feat-mr-merged.md)
- [../pipeline-map.md](../pipeline-map.md)
