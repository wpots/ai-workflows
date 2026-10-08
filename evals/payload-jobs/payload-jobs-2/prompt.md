---
tags: [payload-jobs, needs-scaffold]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "Chooses the platform-cron model, not autoRun election, and explains why: handleSchedules runs before the shouldAutoRun check, so scheduled tasks race at boot across instances. Proposes a cron entry inside a narrow nightly window, a wrapper that exits 0 on every INSTANCE_NUMBER except 0 and warns-but-runs when it is absent, a runner script that releases stalled runs, then handles schedules, then runs the queue in one Payload process, retries with backoff on every task, jobs.access.run set, an alignment test between the cron file and the constants, and one heartbeat per task per environment. Asks for the user's go before writing code and reminds that a new task slug needs a migration the user runs."
---

We have four nightly Payload tasks with a `schedule` (03:00-04:00 UTC) on a Clever Cloud app with 2-6 instances and vertical autoscaling. Set up the job runner for us.
