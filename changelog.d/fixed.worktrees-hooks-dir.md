- `skills/create-pr/references/worktrees.md` now covers a worktree without the
  hook manager's generated directory (`.husky/_`): with a relative
  `core.hooksPath` git then runs no hooks, with no warning. It says how to
  check, that copying the directory from the main checkout makes the hooks
  run, and to read the hooks first: a hook whose tests shell out to git
  without dropping `GIT_*` is run by hand and skipped with `--no-verify`,
  especially on a push with the sandbox bypass. After a failed git-calling
  test in a hook, `core.bare` and `git status` come first; the recovery adds
  the sandbox bypass and restoring a fixture-overwritten tracked file.
