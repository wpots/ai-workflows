---
name: migration-check
description: "Statically verify a freshly generated Payload/Postgres migration for snapshot-drift bugs BEFORE it is committed or run — duplicate/phantom object creation, a regressed baseline snapshot from parallel branches, and cross-feature statements. Read-only: never runs migrate. Use right after generating a migration file, when a migration fails with \"already exists\", or as a create-pr pre-flight when the diff touches migrations."
metadata:
  owner: wieteke.pots
---

# Migration Check Skill

Verifies a newly generated database migration **without running it**. It catches
the class of bug where a migration, generated on a branch whose baseline
snapshot is stale, contains statements that belong to *another* feature — the
classic symptom being `npm run migrate` failing with
`column/relation/type "…" already exists`.

This skill is **read-only**. It NEVER runs `migrate`, `migrate:create`,
`migrate:status`, `migrate:fresh`, or `migrate:reset` — the user owns all
migration commands. It only reads files, greps, `git`, and (optionally)
runs read-only `information_schema` SELECTs against the local dev DB.

## When to use

- Immediately after the user generates a migration (`migrate:create`), before
  committing it.
- When `migrate` fails with an `already exists` (or `does not exist`) error.
- As a create-pr pre-flight when the branch diff adds/edits files under the
  Payload `migrations/` directory.

## Background: why this bug happens

Payload generates a migration by diffing the current schema (config) against the
**most recent migration's `.json` snapshot**. When two features are developed on
parallel branches:

- Branch A adds column X (migration `A`, snapshot `A.json` contains X).
- Branch B forks from `development` **before** A merges, generates migration `B`.
  `B.json` is B's end-state snapshot — and it does **not** contain X.
- Both merge. Order on `development` is now `A` then `B`, but `B.json` (the
  latest snapshot) has silently **regressed** X.
- The next migration `C`, generated against `B.json`, sees X as "missing" and
  emits `ADD COLUMN X` — a **phantom** statement. On any DB where `A` already
  ran, `C` fails: `column X already exists`.

The tell: a migration's `up()` contains a statement for an object that is not
part of the change it was named for.

## Steps

### 1. Identify the migration under test

- The newest file(s) in the migrations directory (highest timestamp prefix), or
  the untracked/modified `*.ts` + `*.json` in `git status` under `migrations/`.
- Record: the new migration `N` (`.ts` + `.json`), the **previous** migration
  `P` (the one before it in `index.ts` order — this is the baseline `N` was
  diffed against), and the ordered list of all earlier migrations.
- Locate the migrations dir from the Postgres adapter config (commonly
  `src/vendor/payload/migrations/` in this repo). Confirm `push: false` — if
  `push: true`, migrations are not used and this skill does not apply.

### 2. Extract the objects `N` creates/adds

From `N`'s `up()` SQL, collect every created/added identifier:

- `CREATE TABLE "x"` / `CREATE TABLE IF NOT EXISTS "x"`
- `CREATE TYPE "public"."x"`
- `ALTER TABLE "t" ADD COLUMN "c"`
- `CREATE INDEX "i"` / `CREATE UNIQUE INDEX "i"`

Also collect what it drops (`DROP TABLE`, `DROP COLUMN`, `DROP TYPE`) for the
reverse check.

### 3. Duplicate-object check (catches the failure directly)

For each created/added identifier in `N`, grep the `up()` of **every earlier**
migration for the same identifier (`CREATE TABLE "x"`, `ADD COLUMN "c"`, etc.).

- Any earlier migration that already **creates/adds** the same object → **FAIL**:
  `N` will error with `already exists` on a DB that ran that earlier migration.
- Report each offending statement with the earlier migration that already owns
  it. This is the phantom set to strip.

```
# example
grep -l 'ADD COLUMN "_verificationtokenexpiresat"' <migrations>/*.ts
grep -l 'CREATE TABLE "some_table"'                 <migrations>/*.ts
```

### 4. Snapshot-regression check (catches the root cause)

Compare snapshots to prove whether the baseline `P.json` is stale:

- For each phantom identifier from step 3, `grep -c` it across the ordered
  `*.json` snapshots. The signature of drift: **present in an earlier snapshot,
  absent in the baseline `P.json`, present again in `N.json`** — i.e. it
  disappeared then reappeared. That means `P` regressed it (a parallel-branch
  snapshot), which is why `N`'s diff re-added it.
- More generally, flag any table/column/type that exists in migration `K`'s
  snapshot but is missing from a later snapshot without an intervening
  `DROP` — a silent regression that will bite the *next* migration too.

### 5. Live dry-run against the local DB (optional, definitive)

Only if a local dev DB is reachable and sits at the **pre-`N`** state
(`N` not yet applied). All queries are **read-only** — no `BEGIN`/write, no
`migrate`.

- Find the DB container/connection (e.g. the local Postgres from
  `docker compose`). Confirm `N` is NOT in `payload_migrations` (still pending).
- For each object `N` creates/adds, ask `information_schema` whether it already
  exists:

```sql
-- column already there? -> N's ADD COLUMN will fail
SELECT 1 FROM information_schema.columns
 WHERE table_name = '<t>' AND column_name = '<c>';
-- table already there?
SELECT 1 FROM information_schema.tables WHERE table_name = '<x>';
-- enum type already there?
SELECT 1 FROM pg_type WHERE typname = '<enum>';
```

Any hit = the statement will fail when the user runs `migrate`.

### 6. Cross-feature scope heuristic

Compare the identifiers `N` touches against `N`'s `--name` / intent. Statements
touching tables unrelated to the feature (e.g. a `users` column change inside a
"page_not_found" migration) are a strong warning even if step 3/5 did not fire.

### 7. Report and remediate (do NOT run migrate)

Produce a verdict:

- **PASS** — no phantom statements, baseline snapshot consistent. Safe for the
  user to run `migrate`.
- **FAIL** — list each phantom statement, the earlier migration/snapshot that
  proves it, and the remediation. Two remediations, in order of preference:
  1. **Strip the phantom statements** from `N`'s `up()` (and their mirror in
     `down()`). The end-state snapshot `N.json` is already correct (it reflects
     the true final schema), so removing the phantom `up()`/`down()` lines makes
     `N` runnable **and** self-heals the chain: later migrations diff against the
     correct `N.json`. This is a file edit (allowed) — apply it via the
     Edit/Write tools, never via `sed`/`printf`.
  2. If the baseline `P.json` itself is regressed and more migrations will be
     generated before merge, recommend the user **regenerates `N`** after the
     branch is rebased so `P` is the truly-latest, accurate snapshot. Note that
     regenerating against a still-stale `P.json` reproduces the same phantom —
     regeneration alone is not a fix.
- After a strip-fix, re-run steps 3–5 to confirm the phantom is gone. Tell the
  user to run `migrate` themselves (back up the local DB first — see the
  `local-db-backup` skill).

## Guardrails

- Never run any `payload migrate*` command or npm migration script. Diagnosis is
  entirely static + read-only SELECTs.
- Never hand-create a migration or its `.json` snapshot. Editing an existing
  CLI-generated migration to remove proven-phantom statements is allowed; do it
  with Edit/Write and leave the end-state `.json` untouched (it is correct).
- If unsure whether a statement is phantom, prefer reporting over editing — a
  false strip can drop a real change.
