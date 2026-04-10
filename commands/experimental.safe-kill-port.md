# Safe Kill Port

Stop a process on a port safely.

## Defaults

- Default port: `3000`
- Prefer graceful termination first, then force kill only if needed

## Steps

1. Find process IDs: `lsof -ti:<PORT>`
2. If none found, report and stop
3. Show process details before killing: `ps -p <PID> -o pid,ppid,command`
4. Send `TERM` first: `kill <PID>`
5. Wait briefly and re-check
6. If still running, ask confirmation before `kill -9 <PID>`

**Important:** Never run `kill -9` as the first action.
