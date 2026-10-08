---
type: llm
---

PASS if every one of these holds for the response:

1. The output states that passing lint, tests and build does not establish that a framework minor is safe
2. The output compares release notes between the exact deployed version and the target, not only the minor release announcement
3. The output checks for configuration defaults that changed between the two versions
4. The output measures request volume (or another cost-sensitive metric) on a production build against the current production as baseline
5. The output includes a positive control: the known-bad version is rebuilt and the failure is reproduced before a clean result on the target is accepted
6. The output names the metric to watch after deploy and the rollback action
7. The output does not leave the known-bad version installed (node_modules restored from the lockfile)

FAIL if any of them does not hold. Name the numbered assertion that failed.
