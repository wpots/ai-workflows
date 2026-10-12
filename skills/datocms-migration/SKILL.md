---
name: datocms-migration
description: Create a DatoCMS schema migration safely — fork the primary environment into a sandbox, let the user change the schema in the DatoCMS UI, then autogenerate the migration against that fork, review it for destructive and out-of-scope operations, and clean the sandbox up. Resumable across sessions, and aware of projects where several DatoCMS instances share one schema. Use when the user asks to create a DatoCMS migration, change the CMS schema, fork a CMS environment, or runs /datocms-migration.
metadata:
  owner: wieteke.pots
---

# DatoCMS Migration Skill

Drives a DatoCMS schema change end to end. Schema changes are made **in the
DatoCMS UI on a throwaway fork**, never by hand-writing a migration: the CLI
autogenerates the script by diffing the fork against the environment it was
forked from. That keeps the migration an exact description of what was actually
configured.

The work spans two sessions with the user's UI work in between, so the skill is
**resumable** — it stores the active fork in a state file and picks up where it
left off.

This is the DatoCMS counterpart to `skills/migration-check`, which covers
Payload/Postgres. The failure mode both guard against is the same: a generated
migration containing statements that belong to *someone else's* change.

## When to use

- The user wants to add, change, or remove a DatoCMS model, block, or field.
- The user asks to fork a CMS environment, or invokes `/datocms-migration`.
- A previous run left a fork open and the user is ready to generate the
  migration from it.

Not this skill: promoting environments to acceptance/production (CI owns that),
or verifying a Payload/Postgres migration (use `skills/migration-check`).

## Project discovery

Never assume profile, environment, or file names — derive them, then cache what
you found in the state file so the second session does not re-derive it.

1. **Profiles and migrations directory** — read `datocms.config.json`. Each key
   under `profiles` is a DatoCMS instance; take `migrations.directory` and
   `migrations.modelApiKey` from the profile you will work in.
   - **One profile** — single instance, nothing further to decide.
   - **Several profiles** — the instances share a schema but hold different
     content. One is the schema source of truth: the one whose environment you
     fork. If the repo does not document which, ask the user once and cache it.
2. **Env files** — list them (`ls -a`) rather than guessing. A common convention
   is `.env.<profile>.<stage>` (`.env.ghz.dev`) alongside stage-only files
   (`.env.dev`). Pick the **development-stage file for the chosen profile**.
   Projects using dotenvx keep the decryption key in `.env.keys` — never read
   or echo it.
3. **Primary environment name** — the environment forks are cut from. Read
   `DATOCMS_API_ENVIRONMENT` from that env file; if absent, list environments:

   ```bash
   npx dotenvx run -f <env-file> -- npx datocms environments:index --profile=<profile> --api-token=$DATOCMS_API_TOKEN
   ```

   It is typically `development`, but confirm rather than assume — some projects
   cut from `main`.
4. **Admin URL** — the fork link needs the project's admin subdomain
   (`https://<subdomain>.admin.datocms.com`). Take it from the project's README
   or conventions doc if documented; otherwise ask the user once and cache it.
   Do not guess a subdomain from the repo name.

Every CLI call runs through `dotenvx` and passes `--profile=<profile>` plus
`--api-token=$DATOCMS_API_TOKEN`. Pass the token **as that variable**, never as
a literal value — literals persist in transcripts and shell history. If the
DatoCMS CLI is a local devDependency, `-- datocms …` works too; `-- npx datocms …`
is safe either way.

## State file

`.datocms-active-fork` in the project root tracks the migration in progress:

```
fork_name=<environment-id>
profile=<profile>
base_env=<environment forked from>
env_file=<path to the env file>
admin_url=<https://…admin.datocms.com>
created_at=<ISO timestamp>
```

Read it with the **Read** tool and write it with **Write** — not `cat`, not a
`>` redirect. It is local scratch state: confirm it is gitignored and add the
entry if it is not.

## Steps

### 1. Resume or start

Read `.datocms-active-fork`.

- **Present with a `fork_name`** → an open fork exists. Go to Phase 2.
- **Missing or empty** → continue to step 2.

### 2. Branch discipline

```bash
git branch --show-current
```

If the user is on an integration branch (`development`, `main`, `master`), the
schema change needs its own branch first. Infer the project's branch convention
instead of imposing one:

```bash
git branch -a --sort=-committerdate
```

If recent branches follow `<TICKET-KEY>-<number>-<slug>`, reuse that shape. Ask
with AskUserQuestion for the ticket reference and a short description, then
`git checkout -b <ticket>-<slug>`. If the user would rather branch themselves,
stop and tell them to re-run the skill afterwards.

On a feature branch already: continue to Phase 1 using that branch name.

### Phase 1 — create the fork

1. **Propose a fork name**: `<base-env>-<branch-name>`, lowercased. DatoCMS
   environment IDs allow only lowercase letters, numbers, and hyphens — convert
   the branch name, do not pass it through as-is (`VIG-997-multi-cms` →
   `development-vig-997-multi-cms`). Offer the derived name as the recommended
   AskUserQuestion option, with a custom name as the alternative.

2. **Fork it**:

   ```bash
   npx dotenvx run -f <env-file> -- npx datocms environments:fork <base-env> <fork-name> --force --fast --profile=<profile> --api-token=$DATOCMS_API_TOKEN
   ```

   `--fast` skips record copying — right for a schema-only sandbox. On failure,
   show the full error and consult the error table below before retrying.

3. **Write the state file** with everything discovered, so the next session does
   not re-derive it.

4. **Hand off to the user** with the fork name, the direct editor link
   (`<admin_url>/environments/<fork-name>/editor`), and the instruction to run
   the skill again when the schema changes are done. Tell them to change
   **only** what this branch is about — unrelated edits in the fork land in the
   generated migration.

5. **Stop.** Do not continue to Phase 2 in the same run.

### Phase 2 — generate the migration

1. Read the fork name and cached context from the state file.

2. **Confirm the user is done** (AskUserQuestion): generate now / more time
   needed / cancel. On cancel, offer to destroy the fork (see Phase 4) and
   delete the state file.

3. **Name the migration**: strip the ticket key from the branch and camelCase
   the rest (`VIG-997-multi-cms` → `multiCms`). The CLI prepends a timestamp.
   Offer the derived name plus a custom option.

4. **Generate**:

   ```bash
   npx dotenvx run -f <env-file> -- npx datocms migrations:new <migration-name> --autogenerate=<fork-name>:<base-env> --profile=<profile> --api-token=$DATOCMS_API_TOKEN
   ```

   Always spell out **both** sides of `--autogenerate`. With the reference side
   omitted the CLI diffs against the profile's configured environment, which may
   not be the environment the fork was cut from — that silently produces a
   migration describing the wrong delta.

### Phase 3 — review the generated migration

Read the new file in the migrations directory before anything else touches it.
This review is the point of the skill; the CLI does not do it.

- **Empty migration** — no changes detected. Either nothing was changed in the
  fork, or the two sides of `--autogenerate` were the wrong way round.
- **Destructive operations** — `destroy`, field or model deletions drop content
  on **every** instance the migration later runs against, and DatoCMS has no
  undo. Surface each one individually and get explicit confirmation that the
  data loss is intended.
- **Out-of-scope models** — operations on models unrelated to this branch's
  intent. This means another change leaked in: the fork was cut from an
  already-drifted environment, or someone else edited the same fork. Do not ship
  it; the statements belong to another migration. Prefer regenerating from a
  fresh fork over hand-stripping.
- **Literal record, upload, or environment IDs** — the multi-instance trap. IDs
  from the source instance do not exist in the others, so the migration fails
  (or worse, matches something unrelated) on the second instance. Flag every
  literal ID.
- **Locale assumptions** — a field switched to localized inherits the fork's
  locale set. Confirm the other instances share it.
- **Noise-only diffs** — field ordering and appearance-only changes. Harmless,
  but call them out so the diff is not mistaken for schema intent.

Fix trivially wrong output (a stray appearance tweak) with Edit. Anything
structural: explain it and let the user decide between regenerating and editing.

### Phase 4 — clean up and hand off

1. Offer to destroy the fork now that the migration exists:

   ```bash
   npx dotenvx run -f <env-file> -- npx datocms environments:destroy <fork-name> --profile=<profile> --api-token=$DATOCMS_API_TOKEN
   ```

2. Delete `.datocms-active-fork`.

3. Report the migration's path, and — on a multi-instance project — that CI will
   run it against **every** profile. Schema operations are safe to repeat across
   instances; anything that touches records is not, because content differs per
   instance.

4. Remind the user to review and commit the migration file. If the pipeline does
   not already run migrations against the non-primary instances' development
   environments before acceptance, suggest doing that first.

## Guardrails

- Never fork from or destroy a production environment. Sandboxes only.
- Never run `migrations:run` against acceptance or production — promotion is the
  pipeline's job.
- Never hand-write schema changes into a generated migration. Removing proven
  out-of-scope operations is allowed; authoring new ones is not — regenerate.
- Sandbox environments are plan-capped. On `PLAN_UPGRADE_REQUIRED`, list the
  existing environments and ask which to delete. Never auto-delete someone
  else's sandbox.
- Read and write the state file with Read/Write. No `cat`, no `sed -i`, no shell
  redirects into project files.
- Never put a token literal in a command; keep it as `$DATOCMS_API_TOKEN`
  resolved inside `dotenvx run`.

## Error table

| Error | Meaning | Action |
| --- | --- | --- |
| `PLAN_UPGRADE_REQUIRED` on `sandbox_environments` | Sandbox limit reached | List environments, ask the user which fork to delete, retry |
| `INVALID_FIELD` / `VALIDATION_INVALID` on the name | Environment ID has uppercase or illegal characters | Lowercase it, strip anything but letters/numbers/hyphens, retry |
| Authentication failed | Wrong or expired token in the env file | Have the user verify the env file; do not print token values |
| No changes detected | Fork is identical to its base | Confirm the changes were saved in the fork, and that `--autogenerate` is the right way round |
| Rate limited | Too many CLI calls | Wait and retry the same command |