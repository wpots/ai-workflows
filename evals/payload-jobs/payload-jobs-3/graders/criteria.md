---
type: llm
---

PASS if every one of these holds for the response:

1. Identifies the processing true / totalTried 0 / no completedAt / no error fingerprint
2. Explains that the row blocks both its own retry and all future scheduling for that task slug
3. Explains why only that slug is affected while other jobs keep running
4. States that cron CMD/CMDEND lines and a successful wrapper exit prove nothing about Payload having run a job
5. Warns that an empty completedAt alone is the normal waiting state and not the symptom
6. Suggests looking at the platform activity or metrics for an instance replacement around the job time
7. Gives the immediate manual recovery and notes that missed data is not backfilled by re-running
8. Recommends moving recovery into the runner and adding retries rather than a one-off fix

FAIL if any of them does not hold. Name the numbered assertion that failed.
