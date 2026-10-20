- `skills/create-pr/references/worktrees.md` drops the hook's `GIT_*`
  variables with `Reflect.deleteProperty`, because `delete process.env[key]`
  fails `@typescript-eslint/no-dynamic-delete` in projects on
  `@greenberry/linting-config`. For Jest it now says to build an explicit
  `env` as a `{ ...process.env }` copy: a `Object.fromEntries(…)` filter fails
  the type check in a Next project, where `NODE_ENV` is required on
  `ProcessEnv`.
