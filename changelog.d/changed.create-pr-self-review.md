- `skills/create-pr` reviews the branch diff with `skills/code-review` once
  before the first push (pre-flight step 6). A `[correctness]` or `[security]`
  finding stops the flow until it is fixed or explicitly waived; a waiver goes
  into the MR description with its reason. Findings with any other lens never
  stop it and are listed with their `file:line` in the MR description and the
  recap. A branch `skills/work-backlog` already reviewed in the same session is
  not reviewed twice. `commands/create-pr.md` folds its architecture pass into
  the same self-review.
  <!-- slack: create-pr reviewt de diff vóór de push; correctness en security blokkeren, de rest komt in de MR -->
