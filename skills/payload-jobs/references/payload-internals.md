# Payload jobs internals — verified on 3.85

Where each fact the skill relies on lives in `node_modules`, so it can be
re-verified on another version in a minute. Paths are relative to the project
root. Line numbers drift; the symbol names and comments quoted here do not.

## Election

- `payload/dist/index.js`, `_initializeCrons()`: one `Cron` per `autoRun` entry,
  created with `protect: true` — that only prevents overlap **within this
  process**. The tick body, in order:
  1. `handleSchedules({ allQueues, queue })` when `jobs.scheduling` is on and the
     entry does not set `disableScheduling`;
  2. the `_internal_jobSystemGlobals.shouldAutoRun` guard;
  3. `config.jobs.shouldAutoRun(payload)` — a `false` return calls
     `jobAutorunCron.stop()` and returns;
  4. `payload.jobs.run({ allQueues, limit, queue, silent })`.

  So scheduling happens on every instance's first tick before the election can
  stop it, and `stop()` is permanent for the life of the process.
- Crons start in every process that initialises Payload except `next build`,
  so a CLI script run through `payload run` hosts its own autoRun cron too.

## The claim

- `payload/dist/queues/operations/runJobs/index.js`: the `and` filter is
  `completedAt !exists`, `hasError != true`, `processing == false`, `waitUntil`
  absent or in the past, and `queue == <queue>` unless `allQueues`. The matched
  rows are then written to `processing: true` through `updateJobs(...)` with
  `disableTransaction: true`. The comment above that call reads: "ensure we set
  job to processing: true as early as possible to reduce the chance of the same
  job being picked up by another worker".
- `@payloadcms/drizzle/dist/updateJobs.js`: a `findMany` with the same `where`
  and `limit`, then one `upsertRow({ id: job.id, operation: "update" })` per
  row. No `FOR UPDATE`, no `SKIP LOCKED`, and the update is not conditional on
  `processing` still being `false`.
- `payload/dist/queues/operations/runJobs/runJob/index.js`:
  `totalTried: (job.totalTried ?? 0) + 1` is written when the attempt is
  recorded. `processing: true` together with `totalTried: 0` therefore means the
  process died between pickup and the first recorded attempt — not an
  application error, which would have been caught and stamped.
- Payload does not retry by default: `retries: undefined` on a task means no
  retries (`queues/config/types/taskTypes.d.ts`).

## Why an orphan blocks scheduling

- `payload/dist/queues/operations/handleSchedules/countRunnableOrActiveJobsForQueue.js`:
  counts rows for the task slug and queue where `completedAt` does not exist and
  `error` does not exist. `processing` is not part of the filter. The default
  `beforeSchedule` skips scheduling when that count is above zero.
- The default `afterSchedule` still advances `lastScheduledRun` in the
  `payload-jobs-stats` global on a skip, so the global keeps looking healthy.

## The HTTP endpoints

- `payload/dist/queues/endpoints/run.js`: `GET <routes.api>/payload-jobs/run`.
  `const accessFn = jobsConfig.access?.run ?? (() => true)`. Query params:
  `queue`, `allQueues`, `limit`, `disableScheduling`, `silent`. When
  `jobs.scheduling` is on it calls `handleSchedules` first, then `runJobs` with
  `overrideAccess: true`. The comment explains the verb: GET so Vercel Cron can
  call it.
- `payload/dist/queues/endpoints/handleSchedules.js`:
  `GET …/payload-jobs/handle-schedules`, same access default.
- `payload/dist/queues/localAPI.js`: `run`, `handleSchedules`, `queue` and
  `cancel` default `overrideAccess` to `true` (`args?.overrideAccess !== false`),
  so a strict `access.run` never touches the project's own runner or the
  `payload jobs:run` CLI.
- `@payloadcms/ui/dist` and `@payloadcms/next/dist` contain no caller of these
  endpoints (`rg "payload-jobs/run"` over both is empty), so closing them costs
  the admin UI nothing.

## Scheduling flags

- `payload/dist/config/sanitize.js`: `jobs.enabled` when tasks or workflows
  exist; `jobs.scheduling = true` and `jobs.stats = true`, plus the
  `payload-jobs-stats` global, as soon as any task or workflow has a `schedule`.

## Re-verification recipe

```
rg -n "shouldAutoRun|handleSchedules|\.stop\(\)" node_modules/payload/dist/index.js
rg -n "reduce the chance|disableTransaction" node_modules/payload/dist/queues/operations/runJobs/index.js
rg -n "findMany|upsertRow" node_modules/@payloadcms/drizzle/dist/updateJobs.js
rg -n "totalTried" node_modules/payload/dist/queues/operations/runJobs/runJob/index.js
rg -n "completedAt|error" node_modules/payload/dist/queues/operations/handleSchedules/countRunnableOrActiveJobsForQueue.js
rg -n "access\?\.run" node_modules/payload/dist/queues/endpoints/*.js
rg -n "overrideAccess" node_modules/payload/dist/queues/localAPI.js
rg -n "scheduling = true" node_modules/payload/dist/config/sanitize.js
```

If any of these stops matching, re-read that file before the skill asserts the
corresponding fact. The upstream fix that would retire most of this document is
small — `SELECT … FOR UPDATE SKIP LOCKED` in the claim, or
`UPDATE … SET processing = true WHERE id = $1 AND processing = false RETURNING` —
and worth raising if a hard guarantee is ever needed.
