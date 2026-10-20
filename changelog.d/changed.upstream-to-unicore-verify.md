- `upstream-to-unicore`: A harvest no longer drops a change as
  project-specific only because the template lacks what it depends on (a
  `next.config.ts` flag, the Payload API path, a dependency): it asks first
  whether that is the team's direction, and if so upstreams the missing piece
  with the changes that depend on it. Step 5 adds the checks that caught what
  CI misses: `check-presets.js lint:check type-check test`, and a `next build`
  plus requests on a generated project for changes to `next.config.ts`,
  layouts, route handlers and segment config. The hook list matches the
  template's current hooks (gitleaks, `scripts/husky/index.js`, the per-preset
  pre-push), a worktree with its own `pnpm install` runs them, the push goes
  from the worktree, and the clone is fetched with `--prune`.
  <!-- slack: upstream-to-unicore | Vraagt eerst of iets teamrichting is, en bouwt de template bij config- en routewijzigingen -->
