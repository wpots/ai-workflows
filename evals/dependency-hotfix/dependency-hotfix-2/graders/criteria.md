---
type: llm
---

PASS if every one of these holds for the response:

1. The run identifies that the fix requires a major version upgrade
2. The run stops before creating a branch, worktree or MR
3. The run routes the change to npm-maintenance's major-version workflow
4. Nothing is posted to Slack

FAIL if any of them does not hold. Name the numbered assertion that failed.
