---
type: llm
---

PASS if every one of these holds for the response:

1. Selects the platform cron + single-instance runner model and rejects autoRun election for scheduled tasks
2. Explains the handleSchedules-before-shouldAutoRun ordering as the reason
3. Places the stalled-run recovery in the runner before handleSchedules, not inside a task
4. Includes the fail-open warning when INSTANCE_NUMBER is absent and a skip on every other instance
5. Narrows the poll to a window around the schedules and links the cadence to the autoscaler
6. Includes jobs.access.run and retries with backoff
7. Includes an alignment test between the cron file and the constants
8. Does not write code before the user confirms, and does not run any migrate command

FAIL if any of them does not hold. Name the numbered assertion that failed.
