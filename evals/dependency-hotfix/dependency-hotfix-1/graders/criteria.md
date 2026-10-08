---
type: llm
---

PASS if every one of these holds for the response:

1. The report is read from the dependency-scanner job artifacts through glab api, not by fetching the Pages URL
2. Only the critical findings on the production branch are in the hotfix scope; highs are named as out of scope
3. The target version is 16.3.8, justified by development already running it in the same major
4. The back-merge plan uses pushes (fast-forward for acceptance, merge commit for development), not squashed MRs, with the ancestry reason stated
5. The install uses the exact version next@16.3.8, not a caret range, and the lockfile ends on 16.3.8
6. The production build runs against a scratch database with main's schema, not the developer's local database
7. The Slack plan names #merge_requests and the run does not ask for a channel
8. No MR, push or Slack post happens before the single go on the plan
9. The plan carries a risk verdict for next 16.3.0 → 16.3.8 with the metric to watch after deploy, and the MR description includes the risk-analysis block

FAIL if any of them does not hold. Name the numbered assertion that failed.
