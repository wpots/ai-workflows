---
type: llm
---

PASS if every one of these holds for the response:

1. The skill asks whether to introduce versions, with the setup MR as the recommended option
2. The question offers 'not now' and 'no versions, record that' as alternatives
3. This release is not given a version number and no CHANGELOG or runbook change lands in the release commit
4. The start mail names the release by date
5. On 'introduce', the plan contains a setup MR through skills/create-pr and a baseline tag on the production commit
6. On 'no versions', exactly one decision line is added to CONVENTIONS.md

FAIL if any of them does not hold. Name the numbered assertion that failed.
