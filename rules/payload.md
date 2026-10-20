# Payload Rules

Apply these rules when adding, refactoring, or reviewing Payload CMS schemas,
queries, hooks, admin components, jobs, or Payload-backed content blocks.

Load `rules/content-blocks.md` as well when the task involves frontend block
modules.

## Schema Placement

- follow the project's existing Payload folder structure instead of inventing a
  parallel schema layout
- keep block schemas, collection schemas, and shared field helpers in the
  established Payload schema areas for the repo
- shared field definitions and helpers belong in the existing schema helper
  areas instead of being duplicated inline

In repos like this one, common locations are `src/payload/schemas/blocks/**`
and `src/payload/schemas/collections/**`.

## Payload Blocks

For every new Payload block:

- create the schema in the project's block-schema area
- export it from the local block-schema barrel when the repo uses one
- add it to every relevant `layoutBlocks` array or shared page-collection
  config that should allow the block
- run `npm run generate:types` after schema changes so generated Payload types
  stay current

Payload provides `blockType` on block items. Preserve that discriminator through
the frontend transform layer and expose it to the rendered block component.

## Type Boundaries

- treat generated Payload document types as transport types
- map Payload data through `Transform*.ts` helpers before passing it into
  presentation components
- do not hand-maintain unions that are already derivable from generated Payload
  types when the generated types can be the source of truth

## Architecture

- keep `getPayload()` calls, collection queries, and other Payload
  infrastructure concerns out of presentational components
- prefer transforming Payload transport data into trusted module or component
  props before rendering
- keep schema definitions, hooks, and admin concerns within Payload areas rather
  than spreading them through unrelated frontend folders

## Auth

Applies to every project whose auth collection signs users in outside the
admin panel (verified with Payload 3.90).

- a session issued outside `payload.login()` — auto-login after e-mail
  activation, a magic link, an invite redemption — is built from Payload's
  helpers (`jwtSign`, `getFieldsToSign`, `generatePayloadCookie`,
  `addSessionToUser`) and bypasses the login operation, so no `beforeLogin` or
  `afterLogin` hook runs. Run the auth collection's login hooks from that
  helper the way the login operation does, or whatever they maintain (a
  last-login stamp, an audit trail) silently stops for that path
- `resetPassword` runs the same login hooks without the `_verified` check that
  `login` applies, so a reset counts as a login for an account that cannot log
  in. A hook that records a login guards on `_verified === true` itself
- before trusting a hook-maintained timestamp as an "active user" or dormancy
  signal (stats, automatic anonymisation), list every path that signs a user
  in and confirm each one runs the hook exactly as a real login does

## Jobs Queue

Applies to every project that registers Payload `tasks` or `workflows`. The
audit procedure, the verified Payload internals, and both reference runners
live in `skills/payload-jobs/SKILL.md`.

- elect exactly one runner when the app runs on more than one instance: a
  platform cron guarded on `INSTANCE_NUMBER=0`, or `autoRun` with a
  `shouldAutoRun` that returns `false` on every other instance. Never enable
  `autoRun` on a multi-instance deployment without that guard — Payload claims
  a job with a plain select followed by an update per id, so two runners take
  the same job
- election only removes the routine duplicate; every task must stay
  idempotent, because a zero-downtime deploy runs the old and the new elected
  instance side by side
- set `jobs.access.run` explicitly. Left unset, Payload lets anyone who can
  reach the app call `GET <api>/payload-jobs/run` and `/handle-schedules`;
  deny it unless a platform cron needs the endpoint, and then gate it on a
  secret
- put orphaned-run recovery in the runner, before schedules are handled, never
  inside a task on the queue it repairs. A run killed mid-flight leaves
  `processing: true` with `totalTried: 0`, is never retried, and blocks all
  future scheduling of its task slug until something releases it
- a new task slug changes the `payload_jobs` enum on Postgres, so it needs a
  migration; hang small housekeeping on an existing task instead
- weigh the poll cadence against the hosting autoscaler — every external poll
  boots a full Payload runtime, and the load spike can trigger the very
  instance replacement that kills the jobs

## Migrations

- agents must never run migration CLI commands (`migrate`, `migrate:create`,
  `migrate:status`, `migrate:fresh`, `migrate:reset`, or any `payload migrate*`
  variant) — the user applies migrations manually; tell them what to run after
  schema changes. `templates/project-claude-settings.json` ships a PreToolUse
  hook that hard-denies `migrate:fresh`/`migrate:create` invocations as a
  deterministic backstop (it ignores mere mentions in grep/cat/echo)
- if the schema change lives on a branch checked out in a git worktree, check
  that branch out in the project's main working directory as soon as a
  migration is needed, and remove the now-unneeded worktree — migrations run
  against the real local dev database from the main checkout, not a worktree

## Generated Artifacts

- treat generated Payload types and special-case generated files as generated
  code
- do not hand-edit generated outputs unless the project has an explicit
  exception
- when generated types drift from schema reality, regenerate them instead of
  patching downstream types around the mismatch
