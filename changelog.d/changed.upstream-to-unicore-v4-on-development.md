- `upstream-to-unicore`: v4 replaced v3 on the template's `development`
  (unicore-template!77), so `development` is the target and v3 is the frozen
  tag `v3.0.0`. A v3 project's base is estimated against that tag instead of
  `development`, and Step 5 says the template's hooks do not run in the
  worktree and names the per-preset type-check to run by hand.
