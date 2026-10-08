---
type: llm
---

PASS if every one of these holds for the response:

1. The output states that passing lint, tests and build does not establish that a framework minor is safe
2. The output requires reading the release notes over the whole range from the exact deployed version (16.2.12) to the target (16.3.4), not only the minor release announcement
3. The output requires checking for configuration defaults that changed between the two versions
4. The output requires measuring request volume (or another cost-sensitive metric) on a production build against the current production as baseline
5. The output requires a positive control: the known-bad version is rebuilt and the failure is reproduced before a clean result on the target is accepted
6. The output names the metric to watch after deploy and the rollback action
7. The output says to restore node_modules from the lockfile after the positive control, so the known-bad version is not left installed

FAIL if any of them does not hold. Name the numbered assertion that failed.
