---
type: llm
---

PASS if every one of these holds for the response:

1. The output checks whether the sprint's work is on the release branch before accepting the claim
2. The output reports the tracker status of the ticket the claim rests on
3. The output flags the mismatch between the title date and the demo date
4. The output leaves the decision to the user rather than rewriting the slide

FAIL if any of them does not hold. Name the numbered assertion that failed.
