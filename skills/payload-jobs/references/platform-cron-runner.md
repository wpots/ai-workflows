# Reference: platform cron + single-instance runner

The model for projects whose tasks carry a `schedule` and that run on more than
one instance, or on a single instance that every deploy replaces. Lifted from
the RefugeeWork website (Payload 3.85, Clever Cloud, September 2026) and
generalised; the queue is called `nightly` here because that is what it was.

```
platform cron (every 15 min inside the job window, every instance)
  → scripts/run-nightly-cron.sh        exits 0 unless INSTANCE_NUMBER is 0 or absent
    → npm run job:run-nightly          payload run scripts/payload/run-nightly.ts
      → runNightlyQueue()              release stalled runs → handleSchedules → run
        → task handlers                each idempotent, each with retries, each pinging its own heartbeat
```

Payload `autoRun` is **not** used. Adding a job is a task with a `schedule`; the
cron entry never changes.

## 1. Cron entry and constants

Keep the schedule and the command in one constants file and assert the platform
file against it (see the test at the end).

`clevercloud/cron.json`:

```json
["*/15 2-5 * * * $ROOT/scripts/run-nightly-cron.sh"]
```

`src/constants/cronjobs.ts`:

```ts
/** Queue that nightly maintenance/retention jobs are scheduled onto. */
export const NIGHTLY_QUEUE = "nightly";

/**
 * Poll window for the platform cron (5-field cron, UTC on Clever Cloud). Must
 * match `clevercloud/cron.json`. All jobs are scheduled inside it; the leading
 * hour is margin for early pickup, the trailing margin lets a failed job finish
 * its retries. A job scheduled outside the window needs the window widened.
 */
export const CLEVER_CLOUD_NIGHTLY_POLL_CRON = "*/15 2-5 * * *";

/** Full platform cron entry (command after the schedule expression). */
export const CLEVER_CLOUD_NIGHTLY_CRON_COMMAND = "$ROOT/scripts/run-nightly-cron.sh";

/** Per-task slugs and 6-field Payload crons: `second minute hour day month weekday`. */
export const PURGE_PRE_ACTIVATION_USERS_SLUG = "purgePreActivationUsers";
export const PRE_ACTIVATION_PURGE_CRON = "0 0 3 * * *";
```

Clever Cloud's `$ROOT` is the absolute application root. Around-the-clock
polling (`*/15 * * * *`) meant 96 runtime boots a day for a queue that was empty
92 times, and every observed upscale followed a poll within two minutes — the
narrowed window is not cosmetic.

## 2. The wrapper (election)

`scripts/run-nightly-cron.sh`, executable, login shell so the platform
environment is loaded, application root derived from its own location so it
does not depend on `APP_HOME`:

```bash
#!/bin/bash -l
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
app_root="$(cd "$script_dir/.." && pwd)"

echo "[nightly-cron] INSTANCE_NUMBER=${INSTANCE_NUMBER:-<unset>} APP_HOME=${APP_HOME:-<unset>} NODE_ENV=${NODE_ENV:-<unset>} NEXT_PUBLIC_ENVIRONMENT=${NEXT_PUBLIC_ENVIRONMENT:-<unset>}" >&2

if [ -z "${INSTANCE_NUMBER:-}" ]; then
  echo "[nightly-cron] WARN: INSTANCE_NUMBER unset — assuming single instance" >&2
elif [ "$INSTANCE_NUMBER" != "0" ]; then
  echo "[nightly-cron] instance $INSTANCE_NUMBER — skipping" >&2
  exit 0
fi

cd "$app_root"
echo "[nightly-cron] starting nightly runner from $app_root" >&2

if npm run job:run-nightly; then
  echo "[nightly-cron] nightly runner completed successfully" >&2
else
  status=$?
  echo "[nightly-cron] ERROR: nightly runner failed with exit code $status" >&2
  exit "$status"
fi
```

Fail-open on a missing `INSTANCE_NUMBER` is deliberate: a silent skip would stop
every job the day the platform stops injecting the variable. Note that
"completed successfully" only proves the exit code was `0`, which it is when
nothing was due.

## 3. The runner (recovery → schedule → run)

`package.json`:

```json
"job:run-nightly": "./scripts/dotenvx-loader.sh -- payload run scripts/payload/run-nightly.ts"
```

`scripts/payload/run-nightly.ts` — executed via `payload run`, which loads the
Payload config through Payload's own loader; a throw rejects the import, exits
non-zero, and the wrapper reports it:

```ts
import { getAppPayload } from "@/vendor/payload/getAppPayload.ts";
import { runNightlyQueue } from "@/vendor/payload/jobs/runNightlyQueue.ts";

const payload = await getAppPayload();

await runNightlyQueue({ payload });
```

`src/vendor/payload/jobs/runNightlyQueue.ts`:

```ts
import type { Payload } from "payload";

import { NIGHTLY_QUEUE } from "@/constants/cronjobs.ts";

import { releaseStalledJobRuns } from "./releaseStalledJobRuns.ts";

export interface RunNightlyQueueArgs {
  payload: Payload;
}

export interface RunNightlyQueueResult {
  released: number;
}

/**
 * One pass over the nightly queue: recover, schedule, run — in that order.
 *
 * Replaces `payload jobs:run --queue nightly --handle-schedules`, which does
 * only the last two steps. Recovery sits here, in the runner, and not inside a
 * task: an orphaned record blocks its own task slug, so a recovery hung on a
 * nightly task stops running the moment that task is the one that stalls.
 *
 * The order is load-bearing: releasing first lets `handleSchedules` stop
 * counting the orphan as active and queue the next run, and `run` then picks
 * up both in this same pass. Everything happens in one Payload process, so the
 * poll pays for no second runtime boot.
 *
 * A failing recovery is logged and stepped over: repair work must never be what
 * stops tonight's jobs from running.
 */
export async function runNightlyQueue({
  payload,
}: RunNightlyQueueArgs): Promise<RunNightlyQueueResult> {
  let released = 0;
  try {
    ({ released } = await releaseStalledJobRuns({ payload }));
  } catch (error) {
    payload.logger.error({
      err: error,
      msg: "Stalled-run recovery failed — continuing with schedules and run",
      reason: "stalled-job-run-recovery-failed",
    });
  }

  await payload.jobs.handleSchedules({ queue: NIGHTLY_QUEUE });
  await payload.jobs.run({ queue: NIGHTLY_QUEUE });

  return { released };
}
```

`src/vendor/payload/jobs/releaseStalledJobRuns.ts`:

```ts
import type { Payload, Where } from "payload";

export const STALLED_JOB_THRESHOLD_MINUTES = 30;

export interface ReleaseStalledJobRunsArgs {
  now?: Date;
  payload: Payload;
  thresholdMinutes?: number;
}

export interface ReleaseStalledJobRunsResult {
  released: number;
}

/**
 * Releases job records orphaned by a killed worker process so the runner can
 * retry them. An empty `completedAt` alone is the normal waiting state (each
 * job is queued roughly a day ahead), so the filter must stay on
 * `processing: true`. The age threshold keeps a job that is genuinely running
 * out of scope: comfortably above the longest real run, far below the cadence.
 */
export async function releaseStalledJobRuns({
  now = new Date(),
  payload,
  thresholdMinutes = STALLED_JOB_THRESHOLD_MINUTES,
}: ReleaseStalledJobRunsArgs): Promise<ReleaseStalledJobRunsResult> {
  const cutoff = new Date(now.getTime() - thresholdMinutes * 60_000).toISOString();
  const where: Where = {
    and: [
      { processing: { equals: true } },
      { completedAt: { exists: false } },
      { updatedAt: { less_than: cutoff } },
    ],
  };

  const stalled = await payload.find({
    collection: "payload-jobs",
    overrideAccess: true,
    pagination: false,
    where,
  });
  if (stalled.docs.length === 0) {
    return { released: 0 };
  }

  const stalledSinceById = new Map(stalled.docs.map((doc) => [doc.id, doc.updatedAt]));

  // A record the runner picked up between the two queries no longer matches
  // (pickup refreshes `updatedAt`), so re-applying the criteria never releases
  // a genuinely running job.
  const result = await payload.update({
    collection: "payload-jobs",
    data: { processing: false },
    overrideAccess: true,
    where,
  });

  for (const doc of result.docs) {
    const stalledSince = stalledSinceById.get(doc.id) ?? null;
    payload.logger.warn({
      ageMinutes: stalledSince ? Math.round((now.getTime() - Date.parse(stalledSince)) / 60_000) : null,
      jobId: doc.id,
      msg: "Released stalled job run — its process died mid-run; the runner will retry it",
      reason: "stalled-job-run-released",
      stalledSince,
      taskSlug: doc.taskSlug ?? null,
    });
  }
  for (const failure of result.errors) {
    payload.logger.error({
      jobId: failure.id,
      message: failure.message,
      msg: "Failed to release a stalled job run",
      reason: "stalled-job-run-release-failed",
    });
  }

  return { released: result.docs.length };
}
```

Unit-test it against a mocked `payload`: an old `processing: true` row is
released, a young one is left alone, completed and errored rows are untouched,
and a failing `update` is logged, not thrown.

## 4. Tasks: schedule, retries, heartbeat

`src/vendor/payload/jobs/nightlyTaskRetries.ts`:

```ts
import type { TaskConfig } from "payload";

type TaskRetryConfig = Exclude<TaskConfig["retries"], number | undefined>;

/** Shared by all nightly tasks; every task adopting it must stay idempotent per night. */
export const NIGHTLY_TASK_RETRIES: TaskRetryConfig = {
  attempts: 3,
  backoff: { delay: 60_000, type: "exponential" },
};
```

Task shape — a thin wrapper around a pure, unit-tested core function:

```ts
export const purgePreActivationUsersTask: TaskConfig<{
  input: Record<string, never>;
  output: PurgePreActivationUsersResult;
}> = {
  slug: PURGE_PRE_ACTIVATION_USERS_SLUG,
  label: "Purge pre-activation users (TTL)",
  handler: async ({ req }) => {
    const output = await purgePreActivationUsers({ payload: req.payload, req, ttlDays: PRE_ACTIVATION_USER_TTL_DAYS });
    await purgeCompletedJobHistory({ payload: req.payload }); // retention housekeeping may ride along; recovery may not
    await pingNightlyJobHeartbeat(PURGE_PRE_ACTIVATION_USERS_SLUG, env.NEXT_PUBLIC_ENVIRONMENT);
    return { output };
  },
  retries: NIGHTLY_TASK_RETRIES,
  schedule: [{ cron: PRE_ACTIVATION_PURGE_CRON, queue: NIGHTLY_QUEUE }],
};
```

The heartbeat is one UptimeRobot (or equivalent) monitor per task per deployed
environment, pinged only after successful work, never shared between tasks — one
healthy job would otherwise hide another job's outage. Development has none.

## 5. The jobs config

```ts
export const jobsConfig: JobsConfig = {
  access: {
    // The project runs its jobs through the Local API (`payload run`), which
    // ignores this. Payload's own default is `() => true`; without this line
    // anyone who can reach the app can hit GET <api>/payload-jobs/run.
    run: () => false,
  },
  deleteJobOnComplete: false, // keep history in the admin; bound it with a retention purge (90 days)
  jobsCollectionOverrides: ({ defaultJobsCollection }) => ({
    ...defaultJobsCollection,
    admin: {
      ...defaultJobsCollection.admin,
      defaultColumns: ["taskSlug", "queue", "completedAt", "hasError", "totalTried", "createdAt"],
      hidden: false,
      useAsTitle: "taskSlug",
    },
    defaultSort: "-createdAt",
  }),
  tasks: [purgePreActivationUsersTask /* … */],
};
```

## 6. The alignment test

`scripts/run-nightly-cron.test.ts` (Jest, runs the real wrapper with a fake
`npm` on `PATH`):

```ts
it("keeps clevercloud/cron.json aligned with the cron constants", () => {
  const cronEntries: unknown = JSON.parse(readFileSync(resolve(PROJECT_ROOT, "clevercloud/cron.json"), "utf8"));
  expect(cronEntries).toEqual([`${CLEVER_CLOUD_NIGHTLY_POLL_CRON} ${CLEVER_CLOUD_NIGHTLY_CRON_COMMAND}`]);
});

it("skips the nightly job on every instance except instance zero", () => {
  const result = spawnSync("/bin/bash", [RUNNER], {
    encoding: "utf8",
    env: { INSTANCE_NUMBER: "1", NODE_ENV: "production", PATH: `${fakeNpmDir}:/usr/bin:/bin` },
  });
  expect(result.status).toBe(0);
  expect(result.stderr).toContain("instance 1 — skipping");
  expect(result.stdout).not.toContain("[fake-npm]");
});

it("runs the nightly job when INSTANCE_NUMBER is absent", () => { /* WARN line + fake npm called */ });
it("logs and propagates a nightly runner failure", () => { /* fake npm exits 23 → status 23 */ });
```

Also assert the wrapper's shebang is `#!/bin/bash -l` and that the file is
executable — both have broken silently before.

## 7. Operational notes for the project spec

Put these in the project's `docs/specs/scheduled-jobs.md` next to the job table:

- **Forcing a run.** `job:run-nightly` forces nothing: `handleSchedules` queues
  only what the cron says is due, derived from `lastScheduledRun`. A fresh
  environment queues nothing. Give every job an on-demand `job:<name>` script
  that calls its core function directly.
- **Instance replacement hits any long-running process**, not only jobs.
  Manual exports, migrations, seeds and backfills over SSH: connect to instance
  0 (a downscale removes the highest-numbered instances first), detach with
  `nohup <command> > /tmp/<name>.log 2>&1 &`, and for work that must not die
  pin the instance count (min = max) for the duration.
- **Recording the autoscaling decision.** Say explicitly whether vertical
  scaling stays on with instance replacement accepted as a risk (the recovery
  above being the safety net), or whether the size is pinned. Do not let either
  setting change silently.
- **Incident runbook**: heartbeat late → admin jobs filtered on the slug →
  stuck row fingerprint → platform activity for the kill → release and re-run on
  instance 0 → confirm a new scheduled row appears the next night.
