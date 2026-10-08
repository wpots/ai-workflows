- `CLAUDE.md` — new "Git inside the sandbox" section under Shell Usage. Three
  sandbox denials that read as something else: a blocked `.git/config` write
  makes `git checkout -b <new> <remote>/<base>` exit 1 *after* creating the
  branch and *without* switching to it (so the next commit lands on the old
  branch — use `git switch -c … --no-track` and verify with
  `git branch --show-current`); SSH `fetch`/`push` fail with GitLab's "correct
  access rights" message because `~/.ssh` is unreadable; and a merge or rebase
  that must rewrite a protected path such as `.vscode/` dies mid-checkout,
  leaving `HEAD` in place over a half-written tree. Plus: don't pipe a command
  whose failure matters through `head`/`tail` in an `&&` chain — the chain
  reads the pager's exit status and continues.
- `skills/create-pr` — the reference gains "Carving one MR out of a dirty
  tree": stash by path, `git switch -c … --no-track` off the base, verify the
  switch, stage by path, never `git add -A`. Step 3 points at it, and the
  split-into-several-MRs recipe uses the same branch-creation form. The
  file-based `glab api` MR call now carries `labels=ai:agent-authored` and
  `remove_source_branch=true`, so the long-body route stops shipping MRs
  without the one provenance signal that survives a squash merge; the skill
  validator now fails on an MR-creation snippet that omits the label. Same two
  changes, compactly, in `commands/create-pr.md`.
