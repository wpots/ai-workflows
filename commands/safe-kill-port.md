# Safely Stop a Port Process

Stop a process on a port safely.

## Defaults

- Default port: `3000`
- Prefer graceful termination first, then force kill only if needed
- Never signal VS Code or a VS Code helper process without explicit approval
  for the exact PID and command

## Steps

1. Find process IDs: `lsof -ti:<PORT>`
2. If none found, report and stop
3. Show process details before killing: `ps -p <PID> -o pid,ppid,command`
4. Resolve every pattern match to an exact PID. Never pass an uninspected
   pattern directly to `pkill`, `killall`, `taskkill`, or `xargs kill`.
5. If a target is Visual Studio Code, `Code`, `Code Helper`, a renderer,
   extension host, GPU process, pty host, or cannot be identified confidently,
   show its PID and command and ask for explicit approval before any signal.
   A generic request to free the port or stop a dev server does not count.
6. Send `TERM` first to the verified non-VS Code PID, or to the explicitly
   approved VS Code PID: `kill <PID>`
7. Wait briefly and re-check
8. If still running, ask confirmation before `kill -9 <PID>`

**Important:** Never run `kill -9` as the first action, and never terminate a
VS Code process without the process-specific approval in step 5.
