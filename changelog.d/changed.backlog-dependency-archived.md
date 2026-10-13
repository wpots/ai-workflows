- `skills/work-backlog` — a `Depends on:` link whose file is gone from
  `docs/backlog/` on the default branch counts as satisfied when an archive
  step took it: `skills/close-sprint` moving it into a sprint or support
  folder, or a release cut removing it. The commit that took it is the
  evidence; a link to a file that never existed stays unmet. Before, such a
  dependency had no `Status` to read, so its dependents were never eligible.
