- `upstream-to-unicore`: Step 5 names the hook checks to run by hand in the
  template worktree (`lint` and `lint:styles` with their fixes, the preset
  type-check, `test` from pre-push) and says to skip
  `scripts/husky/index.js`, whose clean-history and README checks fail
  inside the template itself.
