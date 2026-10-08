---
type: llm
---

PASS if every one of these holds for the response:

1. The output waits for the MR pipeline's setup stage with a bounded poll instead of reporting right after creation
2. The output names the failed install job
3. The output quotes the end of the job log, including the E401 error
4. The recap's Checks row shows the MR pipeline as failed, not as running or passed

FAIL if any of them does not hold. Name the numbered assertion that failed.
