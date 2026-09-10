---
name: payload-jobs
description: Audit or set up Payload's jobs queue for hosting with more than one instance (Clever Cloud autoscaling and similar) — one elected runner, a closed run endpoint, recovery of runs killed mid-flight, idempotent tasks, poll cadence versus the autoscaler, heartbeat coverage. Read-only audit by default; scaffolds the runner after approval. Use when a project adds Payload tasks or autoRun, when jobs run twice or never run, when a nightly job or export silently stopped without an error, when INSTANCE_NUMBER, shouldAutoRun, jobs:run or payload-jobs/run come up, or when the maintenance sweep flags the jobs lane.
---

# Payload Jobs Skill

Payload's jobs queue assumes one worker process and a trusting network. On a
host that runs more than one instance — or replaces its single instance on
every deploy — the project has to supply three things Payload does not:
**election** (exactly one runner), **recovery** (a run killed mid-flight is
released), and **access** (the run endpoint is not public). This skill checks
for those three, names the failure each one prevents, and scaffolds the missing
piece from a reference implementation when the user asks for it.

Policy lives in `rules/payload.md` § Jobs Queue; this skill is the procedure.

## When to use

- A project adds its first Payload `task`, `workflow`, or `autoRun` entry.
- Jobs run twice, or a job ran on an instance it should not have.
- A scheduled job "stopped" with no error anywhere: the export is stale, the
  admin shows no new rows for one task slug, the heartbeat monitor is late.
- Lane F of `skills/maintenance` flags the jobs lane and hands off here.
- Hardening before a pentest: the jobs endpoints are part of the public surface.

## Contract (read first)

- **Read-only by default.** The audit reads config, code, `git`, and the jobs
  collection through the admin UI or a read-only query. It writes code only in
  setup mode, after the user's go, and then runs the project's own checks
  (`skills/run-checks`) before anything is pushed.
- **Never probe a deployed environment's run endpoint** to prove it is open:
  that call executes due jobs and schedules new ones. Prove it from the config
  and a unit test instead.
- **Never run `migrate*`.** A new task slug changes the `payload_jobs` enum;
  say that a migration is needed and stop there (`rules/payload.md`).
- Payload internals change. The facts below were verified on **Payload 3.85**;
  on another major, or a minor that smells different, re-verify with
  `references/payload-internals.md` before asserting them.

## What Payload actually does (verified on 3.85)

| Fact | Consequence |
| --- | --- |
| The job claim is a plain `findMany` followed by an `UPDATE … WHERE id` per row, outside a transaction; no `FOR UPDATE`, no compare-and-swap. Payload's own comment: mark `processing: true` early "to reduce the chance" of another worker taking the job. | Two runners polling together execute the same job. Election is the only protection; "the queue locks rows" is false. |
| `shouldAutoRun` returning `false` calls `cron.stop()`, permanently for that process. | Right for a per-instance constant such as `INSTANCE_NUMBER`; wrong for anything that should flip back. |
| In the autoRun tick, `handleSchedules` runs **before** the `shouldAutoRun` check. | Every instance schedules once at boot before its cron stops. With tasks that carry a `schedule`, that is a check-then-insert race across instances. |
| `jobs.access.run` defaults to `() => true` in the code, although its JSDoc says "logged-in users". Both `GET <api>/payload-jobs/run` and `/handle-schedules` use it. | Unset means anyone who can reach the app runs due jobs and triggers scheduling, choosing `allQueues`, `queue` and `limit`. |
| The Local API (`payload.jobs.run`, `payload.jobs.handleSchedules`) and the `payload jobs:run` CLI default to `overrideAccess: true`. The admin UI never calls the endpoints. | Denying `access.run` costs the project's own runner and the admin nothing. |
| `runJobs` picks rows with `processing: false`; `totalTried` is incremented only once an attempt is recorded. The scheduler counts rows with no `completedAt` **and** no `error` as active, regardless of `processing`. | A run killed between pickup and completion leaves `processing: true`, `totalTried: 0`, no error. It is never retried, and no new run of that task slug is ever queued. Silently, per slug. |
| `jobs.scheduling` turns on as soon as any task has a `schedule`, which also adds the `payload-jobs-stats` global. `handleSchedules` queues only what the cron says is due, derived from `lastScheduledRun`, and advances `lastScheduledRun` even on a skip. | On a fresh environment nothing is queued; `jobs:run --handle-schedules` is not a "run now". The stats global looks healthy while a slug is blocked. |

## Step 0 — Inventory

Record these before judging anything:

- **Hosting and instances.** `clevercloud/` directory, Dockerfile, Vercel
  config; autoscaling on or off; whether vertical scaling replaces instances
  (Clever Cloud: it does); whether the platform injects an instance ordinal
  (`INSTANCE_NUMBER` on Clever Cloud).
- **Tasks.** Every `TaskConfig` and `WorkflowConfig`: slug, queue, `schedule`
  present or not, `retries`, whether the handler survives a second run.
- **Trigger.** `autoRun` entries and `shouldAutoRun`; a platform cron entry and
  its wrapper; `job:*` npm scripts; or nothing at all.
- **Access.** `jobs.access.run`; the REST prefix (`routes.api`); whether a
  proxy or basic auth shields that prefix per environment (production usually
  has neither).
- **Observability.** `deleteJobOnComplete`, history retention, one heartbeat
  monitor per task per environment, structured logs.

## Step 1 — Pick the runner model

| Tasks | Instances | Model |
| --- | --- | --- |
| Event-driven only (queued by hooks, no `schedule`) | 1 | `autoRun` in-process. Done. |
| Event-driven only | more than 1 | `autoRun` + `shouldAutoRun` election on the instance ordinal — `references/autorun-election.md`. |
| Any task with a `schedule` | more than 1, or a single instance that deploys replace | Platform cron guarded on instance 0, running a script that recovers, schedules, then runs — `references/platform-cron-runner.md`. |

Scheduled tasks do not fit autoRun election: `handleSchedules` runs before the
election check, so every instance schedules once at boot, and cron ticks are
wall-clock aligned, so a deploy makes them collide. `disableScheduling: true`
removes the race but then nothing schedules, which is the platform-cron model
with extra steps.

## Step 2 — Required elements

Check each; every missing one is a finding. In setup mode each has a fix in the
references.

1. **Election.** Exactly one instance runs jobs. Cron model: the wrapper exits
   `0` on every `INSTANCE_NUMBER` other than `0`, and runs fail-open with a
   warning when the variable is absent (a silent skip would stop every job the
   day the platform stops injecting it). autoRun model: `shouldAutoRun` returns
   `false` unless the ordinal is `0` or absent.
2. **Access.** `jobs.access.run` is set: `() => false` when the project's own
   runner uses the Local API or CLI (most do), a secret-bearer check only when a
   platform cron must call the HTTP endpoint. A unit test asserts an anonymous
   request is denied.
3. **Recovery in the runner.** Before schedules are handled, rows with
   `processing: true`, no `completedAt`, and `updatedAt` older than a threshold
   comfortably above the longest real run (30 minutes is typical) go back to
   `processing: false`, each release logged at warn level with job id, task
   slug and age. Never widen the filter to "not completed": an empty
   `completedAt` is the normal waiting state of a job queued a day ahead. Never
   hang the recovery on a task of the same queue: the night that task is the
   one killed, nothing recovers anything.
4. **Retries and idempotency.** Every task sets `retries` with backoff, and the
   handler tolerates a re-run for the same night or the same document (upserts
   keyed on the day or the id; scrubs that are no-ops the second time). A
   zero-downtime deploy runs old and new instance 0 together; election does not
   cover that window, idempotency does.
5. **Alignment test.** The platform cron entry and the constants in code are
   asserted equal in a unit test, so the poll window and the command cannot
   drift apart (`references/platform-cron-runner.md` ships one).
6. **Heartbeat per task per environment.** A dead-man's-switch monitor the task
   pings only after successful work; acceptance and production on different
   endpoints; a task that skips for missing config does not ping.
7. **Migration awareness.** Adding a task slug is an enum change on Postgres.
   Recommend piggybacking housekeeping on an existing task; when a new slug is
   unavoidable, name the migration and hand it to the user.

## Step 3 — Poll cadence versus the autoscaler

Every external poll (`payload jobs:run`, `payload run <script>`) boots a full
Payload runtime, roughly twelve seconds of CPU on a small instance. Polling
around the clock for a queue that is empty most of the day is what fed the
autoscaler in the incident below. Narrow the poll to the window the schedules
need, with margin for early pickup and the retry tail, and keep window and
schedules in one constants file so the alignment test guards both. autoRun
avoids the boot entirely, which is its one real advantage; weigh it against the
scheduling race from Step 1.

## Step 4 — Diagnose "it stopped, and there is no error"

1. Compare artefacts across environments first (object-storage timestamps, the
   last export file). Acceptance fresh and production stale on the same code
   means state, not code.
2. In the admin jobs collection, filter on the task slug. The tell is a row at
   `processing: true`, `totalTried: 0`, no `completedAt`, no error, **and no
   newer row for that slug**, while sibling slugs keep getting a new row every
   day. Never read an empty `completedAt` alone as a symptom.
3. Cron `CMD`/`CMDEND` lines prove the shell ran, not that Payload ran; a
   wrapper that logs "completed successfully" only checked an exit code that is
   `0` when nothing was due.
4. Find the kill: platform activity log (Clever Cloud: `npx clever-tools
   activity --show-all`, short retention), runtime metrics with the deployments
   overlay, memory to rule out OOM.
5. Immediate recovery, operational and outside any MR: uncheck `processing` on
   the stuck row in the admin, then run the project's runner once on instance 0
   over SSH. Re-running does not backfill the missed nights; say so.

## Step 5 — Report and apply

Findings ranked by consequence: public endpoint and missing election first,
then recovery, then idempotency, heartbeat, cadence. Each finding names the
file, the failure it allows, and the reference fix. Backlog-ready items go
through `skills/backlog`. Apply fixes only after the user's go, one MR per
concern, checks green before the push.

## Example — one real incident, September 2026

A production statistics export stopped for 24 days with no alert, while
acceptance ran every night on the same code. Cause chain: a 15-minute cron poll
booted a Payload runtime 96 times a day; each boot spiked CPU; every observed
upscale followed a poll within two minutes; vertical autoscaling replaced the
instances and killed the export mid-run at 04:00 UTC. The row stayed
`processing: true` with `totalTried: 0`; Payload never retried it and never
scheduled a new one. A first fix hung the recovery on the 03:00 task; two nights
later that task was itself killed, so nothing recovered the export when it died
again. The final shape, carried by `references/platform-cron-runner.md`:
recovery moved into the runner (release → schedule → run), the poll narrowed to
02:00–05:45 UTC, every task got retries, and the run endpoint, found open during
the same audit, was closed.

## Red flags

| You are about to say | What is actually true |
| --- | --- |
| "We only have one instance, election is overkill." | Every deploy replaces that instance. The orphaned-row failure needs no second instance, and the day autoscaling is switched on nothing reminds anyone. |
| "The queue locks rows, so double execution cannot happen." | It does not. Plain select, update by id, no transaction. |
| "`access.run` defaults to logged-in users, the JSDoc says so." | The code says `?? (() => true)`. Read the code, not the comment. |
| "Hang the reaper on the nightly task, it is already there." | A task cannot recover the queue it is stuck in. Runner or nothing. |
| "A row without `completedAt` is stuck." | Jobs are queued a day ahead; only `processing: true` separates an orphan from a waiting row. |
| "Just hit the run endpoint on acceptance to check it is closed." | That call runs due jobs and schedules new ones. Prove it with a test. |
