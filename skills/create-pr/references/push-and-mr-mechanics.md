# Push & MR Mechanics — Reference

Deep-dive pitfalls for `create-pr` step 7. Read this file when any of these
apply: the branch lives in a git worktree, the generated description is longer
than a paragraph, or `glab` is driven from outside the repo directory.

## Worktree caveat

If the branch is checked out in a git worktree (`git worktree list` shows it
under e.g. `.worktrees/<name>`), the commit/push hooks and the test runner
usually do **not** work there unmodified, so verify manually before pushing:

- A fresh worktree has **no `node_modules`** of its own, so hooks and
  `npm test` that resolve `./node_modules/…` fail. Provide them first —
  symlink the main checkout (`ln -s ../../node_modules node_modules`) or run
  `npm ci` in the worktree.
- Test runners often **ignore `.worktrees/`** (e.g. jest
  `testPathIgnorePatterns` / `modulePathIgnorePatterns`), so a normal run finds
  **0 tests**. Override those patterns when running natively from the worktree,
  e.g. `npm test -- --testPathIgnorePatterns=/node_modules/ --modulePathIgnorePatterns=/__none__/ --coverage=false`.

Do **not** assume the hook only runs lint/type-check/test — read the actual
hook file(s) (e.g. `.husky/pre-push`, `.husky/pre-commit`) and run **every**
command listed there, verbatim, in the worktree. Some projects wire in extra
steps (migration checks, `drizzle-kit check`, storybook build, etc.) that are
easy to miss if you go from memory instead of the file. Run the full
repo-wide command each hook step invokes (e.g. `npm run lint:check`), not a
git-diff-scoped subset — a partial run can pass while the real command still
fails. Do this immediately before pushing, on the exact commit being pushed
(a later commit added after "looks green" is unverified). If any command
fails, stop and fix it — `--no-verify` skips only the hook process that
cannot execute in a worktree, never the checks it would have run.

## Long descriptions go via a file, not inline

A multi-paragraph body passed inline (`--body`/`--description`) is fragile:
shell quoting breaks easily, and very large single arguments can crash agent
permission flows mid-command. Write the generated body to a temp file first,
then:

- **GitHub**: `gh pr create … --body-file <file>`.
- **GitLab**: `glab mr create` has no body-file flag — create the MR in one
  API call with the body read from the file:

  ```bash
  glab api "projects/<url-encoded-project-path>/merge_requests" \
    --method POST \
    --field "source_branch=<branch>" --field "target_branch=<base>" \
    --field "title=<title>" --field "description=@<file>"
  ```

  (`--field key=@file` reads the value from the file.) Verify the response
  echoes a non-trivial description before reporting the URL.

## Driving the repo from another directory

When running e.g. from a worktree via `git -C`: `glab mr create` resolves its
repo context from the current directory's git remotes and fails even with
`--repo` when the cwd points at a different host's repo. The `glab api` call
above has no cwd dependency — prefer it. Related pitfall: when git uses glab
as its HTTPS credential helper, an expired glab OAuth token breaks
`git push`/`fetch` too (`could not read Username`) — `glab auth login` fixes
both.
