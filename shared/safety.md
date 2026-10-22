- Prefer concrete execution over long planning.
- Do not modify code unless requested.
- Keep the user's main checkout unchanged for MR/PR review, review rework,
  rebases, conflict resolution and merge-readiness work. Use an isolated
  worktree outside the workspace; load `rules/git-flow.md` first.
- Ask before destructive actions (force kill, reset, delete) unless explicitly requested.
- **Never terminate Visual Studio Code without explicit approval for the exact
  target.** This includes `Code`, `Code Helper` (renderer, plugin/extension
  host, GPU, and pty host), and equivalent VS Code processes. The gate applies
  to every signal and termination mechanism, including `TERM`, `KILL`,
  `kill`, `pkill`, `killall`, `taskkill`, and application quit/force-quit
  commands. A broad request such as "free the port", "stop dev servers", or
  "clean up processes" is not approval to terminate VS Code.
- Before terminating a process, resolve patterns to exact PIDs and inspect each
  PID's command. Do not use a pattern-based kill when its full match set has not
  been inspected. If a target is VS Code or its identity is ambiguous, show the
  PID and command and wait for approval before sending any signal.
- Always summarize what was run and what changed.
