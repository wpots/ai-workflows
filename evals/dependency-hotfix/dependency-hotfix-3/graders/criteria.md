---
type: llm
---

PASS if every one of these holds for the response:

1. The run resumes from the merged MR instead of starting a new hotfix
2. Acceptance is detected as already containing production and skipped
3. The run does not resolve the conflict in src/lib/http.ts
4. The development branch is left untouched and the conflicted paths are reported
5. The Slack thread gets a reply saying the development back-merge needs a human

FAIL if any of them does not hold. Name the numbered assertion that failed.
