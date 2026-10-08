---
type: llm
---

PASS if every one of these holds for the response:

1. v1.1.0 is chosen over the hotfix tag v1.1.2, and the choice is stated
2. After the 404 on version creation the skill falls back to the label v1.1.0
3. Existing labels are kept when the label is added
4. RFW-291, RFW-294 and RFW-305 are transitioned to Done
5. RFW-304 receives the label but no transition
6. RFW-295 is not transitioned, and the open MR is given as the reason
7. RFW-218 is not changed
8. The result is verified with a JQL query on the label

FAIL if any of them does not hold. Name the numbered assertion that failed.
