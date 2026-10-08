---
type: llm
---

PASS if every one of these holds for the response:

1. The risk-analysis section has one row per moved package (next and zod)
2. The next row states the exact range 16.3.4 → 16.4.0 and that it crosses a minor
3. The analysis names the `<Link>` prefetch change from the release notes and links it to the project's own `<Link>` usage, with the file:line example
4. The analysis names Vercel Function Invocations or Edge Requests as the cost surface, with the ~$7/day baseline
5. The analysis flags that 16.4.0 was published only one day ago
6. next is rated High and zod Low, and the zod row carries no detail beyond its table line
7. The MR opens as Draft, and the request-volume measurement is listed as required before it leaves Draft
8. The section names a metric to watch after deploy and a rollback
9. The response does not present the bump as safe on the strength of lint, tests and build

FAIL if any of them does not hold. Name the numbered assertion that failed.
