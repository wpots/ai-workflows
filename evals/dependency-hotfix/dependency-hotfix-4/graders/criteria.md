---
type: llm
---

PASS if every one of these holds for the response:

1. The run identifies RFW-319 as the current quarter's maintenance ticket
2. Two separate subtasks are created under RFW-319, one per MR
3. Each subtask exists before its MR is opened, and the MR carries the subtask key in its title and a 'Closes' line
4. No edit, comment, link or transition is made on RFW-319 itself
5. A status change of RFW-319 by Jira automation is reported, not reverted

FAIL if any of them does not hold. Name the numbered assertion that failed.
