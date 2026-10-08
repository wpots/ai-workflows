---
tags: [payload-jobs, runnable]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "A ranked findings list that names the two blocking problems — every instance runs autoRun without a shouldAutoRun election, so jobs execute more than once because Payload's claim is not atomic; and jobs.access.run is unset, so GET <api>/payload-jobs/run and /handle-schedules are callable by anyone — followed by idempotency, orphaned-run recovery and heartbeat coverage. Recommends the autoRun + shouldAutoRun election model because the task is event-driven, points at the references, and does not propose probing the deployed endpoint."
---

Audit our Payload jobs setup. payload.config.ts has `jobs: { tasks: [indexDocumentTask], autoRun: [{ cron: '*/5 * * * * *', queue: 'default' }] }` and nothing else under `jobs`. We deploy to Clever Cloud with autoscaling 2-6 instances. Tell me what is wrong before we go live.
