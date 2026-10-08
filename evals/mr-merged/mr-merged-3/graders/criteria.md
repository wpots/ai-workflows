---
type: llm
---

PASS if every one of these holds for the response:

1. The output does not treat the git branch -d refusal as unmerged work
2. The output does not check out another branch in the shared checkout
3. The output proves the branch is merged by comparing its head with the merged source SHA and running git merge-base --is-ancestor against the default branch
4. The output deletes the branch with git branch -D and verifies it is absent

FAIL if any of them does not hold. Name the numbered assertion that failed.
