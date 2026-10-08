---
type: llm
---

PASS if every one of these holds for the response:

1. The output reads the named reference implementation before sending exploratory requests to the API
2. The output records what the reference requests per field, not only what its page looks like
3. The output verifies the reference's field and parameter choices against the API rather than adopting them as the specification
4. The output reports at least one reference choice as verified or rejected, with the measurement

FAIL if any of them does not hold. Name the numbered assertion that failed.
