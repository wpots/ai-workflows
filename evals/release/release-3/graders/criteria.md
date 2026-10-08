---
type: llm
---

PASS if every one of these holds for the response:

1. The skill looks for docs/release-process.md and a runbook pointer in CONVENTIONS.md
2. No branch, tag, mail draft or tracker write is created
3. The skill asks which branch deploys production and whether releases are versioned
4. The skill offers to record the answer in docs/release-process.md

FAIL if any of them does not hold. Name the numbered assertion that failed.
