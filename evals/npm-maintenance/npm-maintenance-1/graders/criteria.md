---
type: llm
---

PASS if every one of these holds for the response:

1. The output mentions checking the project's git history for the package before proposing the bump (git log -S on package.json, or git log --grep=Revert, or equivalent)
2. The output names the revert commit or the reverted version (16.3.1)
3. The output treats the prior revert as a blocker and asks for or investigates its reason rather than assuming it is stale
4. The output does not claim the 16.3.x bump is safe because lint, tests and build pass
5. If an MR is opened it is marked Draft or otherwise explicitly not ready to merge

FAIL if any of them does not hold. Name the numbered assertion that failed.
