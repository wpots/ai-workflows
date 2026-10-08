---
type: llm
---

PASS if every one of these holds for the response:

1. The output checks for untracked files in docs/backlog/ or other sessions' worktrees before creating a file
2. The output does not create a new backlog file for a scope that already exists as an untracked item
3. The output updates the existing item additively rather than rewriting it
4. The output leaves the other session's uncommitted work uncommitted and says so
5. The output names which parts it added and which already existed

FAIL if any of them does not hold. Name the numbered assertion that failed.
