---
type: llm
---

PASS if every one of these holds for the response:

1. The notes are written to docs/releases/sprint-15.md
2. The body contains no ticket keys, commit SHAs, or MR numbers; keys appear only in the appendix table
3. The notes contain a 'Waar staat het' section that names production and the environment the two unshipped items are on
4. The two items missing from origin/main are not listed as live on production
5. The security item is phrased as an outcome and does not mention keys or tokens in logs
6. The CI item is not a body line of its own; it is folded into one maintenance line or reported as dropped
7. The reply contains a paste-ready block without the appendix
8. The run ends with a review pause and does not post to Jira, Slack, or mail
9. The output is written in Dutch

FAIL if any of them does not hold. Name the numbered assertion that failed.
