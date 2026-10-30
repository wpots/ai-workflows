- `worktrees.md` no longer says typegen works through a symlinked
  `node_modules`: `next typegen` fails there, so the generated types are copied
  from the main checkout. It now also states that `npm --prefix <worktree> exec`
  keeps the caller's cwd (run the binary from the worktree with a `spawnSync`
  `cwd`, or use `npm run`), and that after a force-push the main checkout
  diverges and is reset only on the user's go, after a clean `git status` and a
  check that no local-only commit is lost.
  <!-- slack: create-pr | Worktrees: typegen faalt via de symlink, npm exec --prefix houdt de cwd, reset main checkout na go -->
