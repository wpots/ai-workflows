---
type: llm
---

PASS if every one of these holds for the response:

1. The output reads the deploy job's log rather than relying on its passed status
2. The output checks the platform for a deployment of the merge commit
3. The recap flags the refused deploy with a warning and quotes the hook's response
4. The output does not retry the deploy job or trigger a deploy itself

FAIL if any of them does not hold. Name the numbered assertion that failed.
