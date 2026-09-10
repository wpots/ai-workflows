# Reference: `autoRun` with instance election

The model for projects whose tasks are **event-driven only** — queued by hooks
(index a document on publish, send a mail, purge a cache), no `schedule` on any
task — and that run on more than one instance. Lifted from
`greenberrynl/experiments/payload-with-semantic-search` (Payload 3.x, Clever
Cloud, September 2026).

Why it fits that case and not scheduled tasks: with no `schedule`,
`jobs.scheduling` stays off, so the `handleSchedules` call that Payload makes
*before* the `shouldAutoRun` check is a no-op on every instance. Add one task
with a `schedule` and every instance schedules once at boot before its cron
stops — the check-then-insert race the platform-cron model exists to avoid.

## 1. Read the instance ordinal through the validated env

`src/env.ts` (t3-env + Zod, or whatever the project validates with):

```ts
server: {
  /**
   * Ordinal of this instance, injected by Clever Cloud as `0`, `1`, … and fixed
   * for the instance's lifetime. Elects exactly one job runner. Optional
   * because it only exists on Clever Cloud; locally and in the CLI it is absent
   * and the single process runs its own jobs.
   */
  INSTANCE_NUMBER: z.string().optional(),
},
runtimeEnv: {
  INSTANCE_NUMBER: process.env.INSTANCE_NUMBER,
},
```

Add it to the env documentation with "injected by the platform, do not set by
hand".

## 2. The jobs block

```ts
jobs: {
  tasks: [indexDocumentTask, removeFromIndexTask],
  // Run queued jobs in-process in every environment: no platform cron, no
  // worker process. Publish a page, wait a moment, it is indexed.
  autoRun: [{ cron: "*/5 * * * * *", limit: 10, queue: "default" }],
  /**
   * Elect exactly one job runner across an auto-scaled deployment.
   *
   * Every instance boots this cron, and Payload's job claim is not atomic
   * (plain select, update by id, no transaction), so two instances ticking
   * together would both run the same jobs. Returning `false` makes Payload call
   * `cron.stop()` — permanently, which is right here: `INSTANCE_NUMBER` never
   * changes for a running instance, so nodes 1..n stop on their first tick.
   * Polling cost stays constant as the app scales out.
   */
  shouldAutoRun: () => env.INSTANCE_NUMBER === undefined || env.INSTANCE_NUMBER === "0",
  access: {
    /**
     * Payload's JSDoc claims this defaults to "all logged-in users"; the
     * implementation is `jobsConfig.access?.run ?? (() => true)`. With autoRun
     * handling execution nothing external needs the endpoint. If a platform
     * cron ever replaces autoRun, this is where the CRON_SECRET check belongs.
     */
    run: ({ req }) => Boolean(req.user),
  },
},
```

`Boolean(req.user)` keeps a manual trigger for a logged-in admin; `() => false`
is the stricter choice when nobody needs that. Either is fine; unset is not.

## 3. Verify the election per instance

`src/scripts/checkJobRunnerElection.ts`, wired as `npm run check:job-runner`
(`payload run src/scripts/checkJobRunnerElection.ts`). Run it on each instance
over SSH after a deploy; exit code `1` when the endpoint is open:

```ts
import { getPayload } from "payload";

import { env } from "@env";
import config from "@payload-config";

const payload = await getPayload({ config });
const jobs = payload.config.jobs;
// Read through the validated env module — the same source the predicate uses.
const instanceNumber = env.INSTANCE_NUMBER;

const wouldRun =
  typeof jobs.shouldAutoRun === "function" ? await jobs.shouldAutoRun(payload) : true;
const autoRunEntries = Array.isArray(jobs.autoRun) ? jobs.autoRun : [];

payload.logger.info(`[job-runner] INSTANCE_NUMBER=${instanceNumber ?? "(unset — local or CLI)"}`);
payload.logger.info(`[job-runner] autoRun crons configured: ${autoRunEntries.map((entry) => entry.cron).join(", ") || "none"}`);
payload.logger.info(
  wouldRun
    ? "[job-runner] THIS instance is the runner — it will drain the queue"
    : "[job-runner] this instance is NOT the runner — its cron stops on first tick",
);

const anonymousMayRun =
  typeof jobs.access?.run === "function"
    ? await jobs.access.run({ req: { user: null } as Parameters<NonNullable<NonNullable<typeof jobs.access>["run"]>>[0]["req"] })
    : true;

if (anonymousMayRun) {
  payload.logger.error("[job-runner] FAIL /admin/api/payload-jobs/run is open to anonymous callers");
  await payload.destroy();
  process.exit(1);
}

payload.logger.info("[job-runner] run endpoint correctly denies anonymous callers");
await payload.destroy();
```

## 4. Caveats that stay

- **Deploy overlap.** A zero-downtime deploy briefly runs the old and the new
  instance 0 side by side, so a job can double-run in that window. Harmless
  only when every task is idempotent — a keyed `ON CONFLICT` upsert, a handler
  that re-derives desired state from the live document. That is a property of
  the tasks, not a guarantee from Payload; keep any new task idempotent.
- **Orphaned rows still happen.** A replaced instance 0 leaves `processing:
  true` rows behind exactly as in the cron model. For event-driven tasks the
  cost is one lost job (a re-publish queues a new one); if that is not
  acceptable, add the release step from `platform-cron-runner.md` — inside
  `shouldAutoRun` on the elected instance is the only pre-run hook autoRun
  offers.
- **No scheduled tasks, ever, without revisiting Step 1 of the skill.**
  `disableScheduling: true` on the autoRun entry stops the boot race but also
  stops scheduling; at that point you are building the cron model anyway.
- **CLI processes host the cron too.** `payload run <script>` on a machine
  without `INSTANCE_NUMBER` starts the 5-second cron and drains the queue while
  the script runs. Usually welcome (seeding), occasionally surprising.
