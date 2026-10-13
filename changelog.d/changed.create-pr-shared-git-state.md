- `skills/create-pr` — the worktree reference names the git state every session
  shares: base a worktree on `<remote>/<base>` with `--no-track`, never on
  `FETCH_HEAD`, and drop a stash only after checking it is yours. A test that
  creates a git repo first drops the `GIT_*` variables a hook exports, since a
  pre-commit run that inherited them set `core.bare=true` in the shared config;
  `validate-skills.mjs` errors on a `scripts/` test that does not. The
  stacked-MR recipe adds the rebase and full re-check once the lower MR merges.
  <!-- slack: Worktree vanaf `gitlab/main` in plaats van `FETCH_HEAD`; na merge van een gestapelde MR rebasen en hertesten -->
