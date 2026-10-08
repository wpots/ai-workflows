---
type: llm
---

PASS if every one of these holds for the response:

1. Identifies that autoRun runs on every instance and that the job claim is not atomic, so jobs can execute twice
2. Recommends shouldAutoRun keyed on INSTANCE_NUMBER (0 or undefined) rather than a lock
3. Flags jobs.access.run as unset and explains the default is allow-all despite the JSDoc
4. States that the Local API and CLI ignore access.run, so closing it does not break the project's own runner
5. Mentions idempotency because a zero-downtime deploy runs old and new instance 0 together
6. Does not suggest calling the run endpoint on a deployed environment to test it
7. Ranks the public endpoint and missing election above the other findings

FAIL if any of them does not hold. Name the numbered assertion that failed.
