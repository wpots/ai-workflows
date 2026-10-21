- `create-pr`: a commit or push hook that fails with `Operation not permitted`
  in a sandboxed shell is re-run with the sandbox bypass, never with
  `--no-verify`, and a bypass prompt that is denied or closes unanswered ends in
  a status report (branch, staged, not committed) instead of a silent stop.
