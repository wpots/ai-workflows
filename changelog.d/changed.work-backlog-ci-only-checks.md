- `work-backlog`: Checks that only run in CI are verified on the MR
  pipeline. The run opens the MR as a draft, with the close-out already
  pushed, and blocks in the foreground until the pipeline on the final head
  finishes. It marks the MR ready only when that pipeline is green, and never
  hands back while a pipeline runs, because a background wait dies with a
  subagent's run. A one-off transient job failure gets one `glab ci retry`, not
  retry code. A criterion left unticked in the MR keeps the item
  `in-progress`. A `draft` field is ignored when the MR is created through the
  API, so the title carries the `Draft: ` prefix instead. An MR that reports
  `need_rebase` on a fast-forward project is rebased server-side. Two new eval
  cases cover the done-status and the pipeline wait.
- `watch-mrs`: Where `Monitor` has no `persistent` option, it expires after 30
  minutes and is re-armed. A single event is watched with a background script
  that exits on it.
- `service-cli`: The glab reference names the harmless `operation not
  permitted` config-write warning that glab prints inside the sandbox.
- Ambient `CLAUDE.md`: `git push -u` fails on recording the upstream inside
  the sandbox; push without `-u`.
