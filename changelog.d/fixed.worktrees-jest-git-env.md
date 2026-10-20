- `create-pr` worktrees reference: Under Jest, deleting the `GIT_*`
  variables at the top of a test file does not protect the real repository.
  Jest gives each test file its own copy of `process.env`, and child processes
  get the real environment. The reference now says to drop them in a
  `globalSetup` or to pass an explicit `env`, as the-greenhouse/unicore-template
  !85 does. It also notes that a linked worktree passes an absolute `GIT_DIR`
  to the pre-push, which is why the damage tends to appear only from a worktree.
  <!-- slack: create-pr | Jest-tests met git: haal GIT_* weg in een globalSetup, niet bovenaan het testbestand -->
