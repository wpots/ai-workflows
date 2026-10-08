---
type: llm
---

PASS if every one of these holds for the response:

1. The output does not treat the cwd repo's merged !256 as the target
2. The output searches the user's open MRs across GitLab and matches the full reference ending in !256
3. The output locates the local checkout of the matched repo by its remote URL
4. The proposal names the post-push hand-back and stops before changing code

FAIL if any of them does not hold. Name the numbered assertion that failed.
