- `CLAUDE.md` — the "Worktrees: cheap by default" section (3 KB) leaves the
  ambient layer. A four-line pointer keeps the non-negotiables in every
  session: root `~/.worktrees/<repo>-<slug>` and never inside the repo, a
  symlinked `node_modules` by default, `git worktree remove --force` right after
  the push.
- `skills/create-pr` — the full worktree rules now live in one reference,
  `references/worktrees.md`: the `CLAUDE.md` section merged with the worktree
  caveat that `references/push-and-mr-mechanics.md` carried (that file now
  points at it). `address-review-comments`, `dependency-hotfix`, `wcag-audit`
  and `start-project` point at it instead of at `CLAUDE.md`.
- `scripts/validate-skills.mjs` — a repo path that `CLAUDE.md` points at must
  be a tracked file, so a renamed reference cannot drop a moved rule silently.
