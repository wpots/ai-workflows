---
tags: [payload-jobs, runnable]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "A diagnosis that starts from the acceptance-vs-production difference (state, not code), sends the user to the admin jobs collection filtered on the export's task slug, and names the fingerprint: a row at processing true with totalTried 0, no completedAt and no error, and no newer row for that slug. Explains that Payload never retries such a row and that the scheduler counts it as active, so no new run is queued for that slug while sibling slugs continue. Notes that CMD/CMDEND and a 'completed successfully' wrapper line prove nothing, points at the platform activity log for an instance replacement as the likely kill, gives the immediate recovery (uncheck processing, run the runner once on instance 0), says the missed nights are not backfilled, and recommends the structural fix: recovery in the runner plus retries."
---

Our nightly stats export on production hasn't written a file since three weeks ago. There are no errors in the logs, the cron shows CMD/CMDEND every 15 minutes, and the other nightly jobs are fine. Acceptance is fine too. What happened?
