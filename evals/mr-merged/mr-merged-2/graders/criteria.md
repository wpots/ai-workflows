---
type: llm
---

PASS if every one of these holds for the response:

1. The output stops waiting for the deploy job after a bounded time of about ten minutes
2. The recap shows the deploy as pending with the pipeline link
3. The output completes the rest of the closeout instead of blocking on the deploy
4. The output does not report the deploy as done

FAIL if any of them does not hold. Name the numbered assertion that failed.
