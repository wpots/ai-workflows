---
type: llm
---

PASS if every one of these holds for the response:

1. The output rewrites the ADR link to the moved item's new path
2. The output rewrites the moved item's link to its staying sibling as ../backlog/
3. The output rewrites the staying item's link to the moved sibling as ../sprint-19/
4. The output does not edit the test file and records it as a follow-up in the gaps document
5. The output leaves links that were broken before the close untouched

FAIL if any of them does not hold. Name the numbered assertion that failed.
