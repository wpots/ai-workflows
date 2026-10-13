- `skills/create-pr` (and its fallback `commands/create-pr.md`) gets a routing-eval
  step in the pre-flight, next to the migration check. When the repository has
  routing eval cases and the branch adds a skill, changes a skill's `name`,
  `description` or `when_to_use`, or changes a routing case, the suite runs
  before the first push and the MR description carries one result line
  (`Routing evals: 10/10 pass ($1.81, 2026-10-13)`). A failing case stops the MR
  until it passes or the user accepts it; a run that cannot happen says
  `not run — <reason>` instead of a pass. The trigger test, the command and the
  result lines live in `evals/README.md` ("Before a skill MR"); the upstream MR
  rule (`skills/upstream-rules/references/upstream-mr.md`, which
  `skills/improve-skill` reads) points at the same section. In every other
  repository the step does nothing.
