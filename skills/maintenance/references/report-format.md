# Maintenance report format

Write `docs/maintenance/maintenance-<YYYY-MM-DD>.md` as the current maintenance
overview. Target 800–1,200 words; keep the main report under 1,500. Link to
existing BLIs, MRs and detailed evidence instead of repeating their contents.
Use this order:

1. **Scope and verdicts** — inventory date, last update, environments actually
   checked, one inventory paragraph and one compact verdict row per lane
   (`ok` · `attention` · `urgent`). Date observations that were not rechecked.
   While a critical runs on production (lane A), the verdicts end with one
   line, `Next step: /greenberry:dependency-hotfix for <package>, … (you)`.
   Every such package goes on that one line: one hotfix run moves them
   together.
2. **Progress — required** — one table that owns the follow-up status:

   | Done | Step / owner                      | State and dated evidence            | Next action / gate         |
   | ---- | --------------------------------- | ----------------------------------- | -------------------------- |
   | ☑    | Inventory / development           | Completed on <date>; baseline below | —                          |
   | ☐    | Security patches / development    | In review: <MR>                     | Merge, then verify release |
   | ☐    | Production verification / hosting | Unverified                          | Confirm running version    |

   Tick a row only when its named step is verified. Split implementation,
   checks, merge and dv/acc/prd verification when their states differ; an open
   MR is not a completed fix or deployment. Every open row has an owner and
   a concrete next action; use `blocked`, `manual` or `parked` where applicable.

3. **Priority findings** — urgent → high → medium → low. Keep each finding to
   evidence, impact and remedy (including owner), without repeating the progress
   table. A declared check that CI never runs (lane E) is `high` for `build`
   when the host builds on deploy and `medium` otherwise; Storybook is never one.
4. **Verification** — compact quality/deployment and credential tables with
   dated results, limitations and deltas against the baseline. Credential rows
   retain variable × environment × status × verified-on; fingerprints only.
   Include healthy checks as well as unknowns. Add lane H's delivery-metrics
   table and delta; unmeasurable fields stay `n/a` with a reason.
5. **Manual and parked work** — group dashboard checks and lower-priority
   findings by owner; link existing items and identify proposed duplicates.

After each authorized follow-up, update the same progress rows and latest
verification results. Preserve the original dated baseline and the measured
delta, then replace superseded status text. Keep investigation transcripts,
intermediate decisions, repeated check runs and full implementation histories
out of the main report; retain their useful evidence in linked MRs/BLIs. Every
finding still has a home: active, fixed with evidence, or explicitly parked.
