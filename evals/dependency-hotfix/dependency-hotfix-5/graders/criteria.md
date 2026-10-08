---
type: llm
---

PASS if every one of these holds for the response:

1. The response analyses the range to development's version (16.3.6) as well as the range to the lowest fix (16.2.15)
2. The 16.2.12 → 16.3.6 range is rated High, citing the `<Link>` prefetch change, the project's usage and the Vercel cost surface
3. The target version is 16.2.15, not 16.3.6, and the reason is stated
4. The plan has a Risk line, and the MR description is said to include the risk-analysis block
5. The back-merge keeps development's higher next version rather than downgrading it
6. The hotfix proceeds to a single go on the plan instead of waiting on a measurement

FAIL if any of them does not hold. Name the numbered assertion that failed.
