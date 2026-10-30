- A repo without sprints can file delivered backlog items by quarter: when a
  `docs/<yyyy>-q<n>/` folder exists, the `done` commit in `work-backlog` moves
  the item into the current quarter's folder, as a sprint project files it in
  `docs/sprint-<N>/` (`rules/backlog.md`). `close-sprint` and `compact-sprint`
  handle such a repo as support mode by calendar quarter
  (`docs/<yyyy>-q<n>-changelog.md`, tag `<yyyy>-q<n>-bli-archive`, only
  quarters ≤ Q−2 compacted), and `mr-merged` reads the quarter folders for
  ticket completeness.
