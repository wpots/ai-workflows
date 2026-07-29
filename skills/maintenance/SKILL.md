---
name: maintenance
description: Run a periodic project maintenance sweep — dependency and vulnerability status, runtime/platform EOL, credential and API-key currency (including Prepr CMS tokens), quality baseline, repo and CI hygiene, migrations, backups, and doc drift — landing one prioritized report plus backlog-ready follow-ups. Read-only by default; fixes only after approval. Use when the user asks for project maintenance, onderhoud, a monthly or periodic health check, or to verify that API keys and env config are still current.
---

# Project Maintenance Sweep

The recurring "is this project still healthy" pass. It diagnoses across every
lane that rots silently — dependencies, runtime versions, credentials, quality
baseline, CI, data, docs — and lands **one ranked report** so the user can
decide what to fix.

Skill-only — no command-runbook fallback. Default cadence: monthly, or before
picking a project back up after a quiet period.

This skill is an **orchestrator**. It never re-implements a lane that already
has its own skill; it runs that skill in inventory mode and folds the result
into the report.

## Contract (read first)

1. **Read-only by default.** The sweep diagnoses. Every fix is a separate,
   explicitly approved step (see [Fixes](#fixes)).
2. **Never print, log, or commit a secret value.** Verify a secret by *using*
   it and reading the status code; compare secrets across environments by
   fingerprint (sha256 first 8 chars, or `first4…last4`), never by value.
3. **Never rotate, revoke, or create a credential.** That happens in the
   vendor dashboard, by the user. This skill reports and asks.
4. **Delegate, don't duplicate:**
   - dependencies + vulnerabilities → `skills/npm-maintenance/SKILL.md`
   - quality pipeline → `skills/run-checks/SKILL.md`
   - perf / CI cost / dependency weight → `skills/sustainable-review/SKILL.md`
   - accessibility → `skills/wcag-audit/SKILL.md`
   - pending migration safety → `skills/migration-check/SKILL.md`
   - findings that need tracking → `skills/backlog/SKILL.md`
5. **One report per run**, at `docs/maintenance/maintenance-<YYYY-MM-DD>.md`.
   No finding is silently dropped — it is fixed, backlogged, or explicitly
   parked.
6. **Verified means probed.** "The variable is present in `.env`" is not
   verification of a credential. Either it answered a live request or it is
   marked *unverified — manual check*.

## Inputs to confirm

Ask only for what can't be inferred.

- **Scope** — full sweep (default) or named lanes (`deps`, `runtime`,
  `credentials`, `quality`, `repo`, `data`, `docs`).
- **Environments in scope** — local only (default), or also acceptance /
  production. Probing acceptance or production credentials touches live
  services, so it must be an explicit choice.
- **Mode** — report-only (default) or report + apply safe fixes after review.
- **Backlog threshold** — default: anything expired/broken, any high or
  critical vulnerability, and any EOL inside 6 months. Lower-severity items
  are parked in the report unless the user wants everything tracked.
- **Previous report** — if `docs/maintenance/` already has one, read the most
  recent so the sweep reports *deltas*, not a fresh wall of text.

## 0. Inventory the project

Do this first; every lane below refers back to it, and it goes in the report.

- **Package manager** from the lockfile; **runtime pin** from `.nvmrc`,
  `.node-version`, Volta, `engines`, `packageManager`.
- **Framework and major versions** (Next, React, Payload, …), **database**,
  **hosting** (`clevercloud/`, Vercel, Docker), **CI** (`.gitlab-ci.yml`).
- **Secret system** — plain `.env` files vs `@dotenvx/dotenvx` (look for
  `scripts/dotenvx-loader.sh`, `.env.keys`, `encrypted:` values). Record which
  `.env.*` files exist and which environment each maps to (the loader script
  is the source of truth for precedence, not guesswork).
- **External services**, derived from dependencies *and* env var names: CMS
  (Prepr, Payload), mail/SMTP, object storage, maps/geocoding, analytics,
  error tracking, auth, payment.
- **Project scripts** worth using in later lanes (`type-check`, `test`,
  `build`, `migrate:status`, `db:backup:*`, `job:*`, codegen).

## Lanes

### A. Dependencies and vulnerabilities

Run `skills/npm-maintenance/SKILL.md` in **inventory only** mode — outdated +
audit, no updates. Record:

- direct dependencies behind a major, with the current → latest jump;
- high/critical vulnerabilities: package, path, whether a fix exists upstream;
- deprecated or unmaintained packages (last publish > 18 months, deprecation
  notices);
- lockfile ↔ `package.json` drift (a frozen/immutable install must succeed);
- whether an automated updater (Renovate, Dependabot) is configured and
  actually opening MRs.

### B. Runtime and platform EOL

- The runtime pin must agree across **four** places: local pin (`.nvmrc`), CI
  image, hosting runtime config, and `engines`. Any mismatch is a finding —
  this is the classic "works locally, breaks in CI" root cause.
- EOL horizon for Node, the database engine, and the framework major. Flag
  anything going EOL inside 6 months, with the date.
- Docker base image tags pinned and current (`docker-compose*.yml`,
  `Dockerfile`).
- Hosting build configuration still matches the pinned runtime and build
  command.

### C. Credentials and API-key currency

The lane that most often turns into an incident. Procedure per credential:

1. **Enumerate.** Build a matrix of *variable × environment × status*. Sources:
   `.env.example` (the documented contract), every `.env.<env>` in scope, CI
   variables (`glab variable list`), hosting env vars, and any credential
   mentioned in `README.md`/`docs/`.
2. **Drift.** Variables in `.env.example` missing from an environment file (or
   present in an env file but undocumented) are findings. So is a variable
   whose fingerprint is *identical* across environments where it must differ
   (production vs preview tokens), or *different* where it must match.
3. **Probe liveness.** Use the credential in a minimal read-only request and
   read only the status code. Write the probe to the scratchpad with the Write
   tool and run it via the project's env loader:
   `npx dotenvx run -f .env.<env> -- node <scratchpad>/probe-<service>.mjs`.
   Never inline the secret in a command, and never `echo` it.
4. **Classify** each credential: `live` · `revoked/expired (401/403)` ·
   `wrong scope` · `service unreachable` · `not verifiable — manual dashboard
   check`. Record the date it was verified; that date is the baseline the next
   sweep compares against.
5. **Rotation hygiene.** Flag credentials past the project's rotation window,
   held by someone who left the team, or present in git history
   (`git log -S <var-name> --oneline`). Report; never rotate.

#### Prepr CMS (when detected)

**Detect** via `prepr.config.ts`, `config/prepr.*`, `src/vendor/prepr/`,
references to `graphql.prepr.io`, a `codegen.config.ts` pointing at the Prepr
schema, or env vars matching `PREPR*`. Typical variables:
`PREPRIO_TOKEN` (published scope), `PREPRIO_TOKEN_PREVIEW` (preview scope),
`PREPR_WEBHOOK_REVALIDATE_SECRET`.

Checks:

1. **Token liveness.** In Prepr's GraphQL API the token *is* the path segment:
   `POST https://graphql.prepr.io/<token>`. `200` with a `data` object → live.
   `401`/`403` → revoked or expired; treat as **urgent**, because the next
   deploy renders empty or 500s. `404` → wrong or truncated token.
2. **Scope.** The preview token must return draft content, the published token
   must not. Query the same model with both and compare item counts — equal
   counts on a project that demonstrably has drafts means the "preview" token
   is really a published token.
3. **Per environment.** Probe once per env file in scope, plus the CI and
   hosting copies. A token that works locally proves nothing about production.
4. **Schema freshness.** Run the project's codegen against the live schema in
   a scratch copy and diff the generated output. A non-empty diff means the
   CMS model has moved ahead of the repo → report it and backlog the regen.
   Never silently commit regenerated types as part of a sweep.
5. **Asset host.** `cdnHostname` in `prepr.config.ts` and the Next image
   remote patterns must still match the Prepr environment's file host,
   otherwise images 404 in production only.
6. **Webhook secret.** Not probeable. Manual check item: in Prepr → Webhooks,
   confirm the revalidate webhook exists, targets the current deploy URL, and
   its secret matches `PREPR_WEBHOOK_REVALIDATE_SECRET` (compare fingerprints).
7. **Expiry.** Prepr access tokens are managed per environment in the
   dashboard and carry no expiry in the API response — liveness is the only
   automated signal. Ask the user to confirm the token list and last rotation
   date in Prepr → Settings → Access tokens, and record the confirmed date in
   the report.

Probe script — write it with the Write tool, never as a Bash heredoc:

```js
// probe-prepr.mjs — token comes from the environment and is never printed
const token = process.env.PREPRIO_TOKEN;
if (!token) {
  console.log("MISSING: PREPRIO_TOKEN not set for this environment");
  process.exit(1);
}
const res = await fetch(`https://graphql.prepr.io/${token}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ query: "{ __typename }" }),
});
const body = (await res.text()).slice(0, 300).replaceAll(token, "<redacted>");
console.log(`status=${res.status} body=${body}`);
```

> Sandbox note: `graphql.prepr.io` is not on the default sandbox network
> allowlist, so the first probe fails with a network error. Either add the host
> to the sandbox allowlist or run that one command unsandboxed — and state in
> the report which of the two you did.

### D. Quality baseline

- **One** full pass via `skills/run-checks/SKILL.md`, at the sweep boundary —
  not per lane.
- Debt counters, compared with the previous report: skipped / `.only` tests,
  `@ts-expect-error`, `eslint-disable`, `any`, `TODO`/`FIXME`, coverage delta.
  Trend matters more than absolute numbers.
- Unused files, exports, and dependencies via a one-off `dlx`-style run
  (knip, depcheck). Never add such a tool to the project's `package.json` for
  a sweep.

### E. Repo and CI hygiene

- Stale branches: merged remotes still present, branches with no commits in
  90 days (`git branch -r --merged`, `git for-each-ref --sort=committerdate`).
- Open MRs older than a sprint, and long-lived drafts (`glab mr list`).
- Default-branch pipeline status and failing scheduled pipelines
  (`glab ci list`, `glab schedule list`).
- Working-tree cruft: untracked files that should be ignored, large files in
  history, `.gitignore` gaps, secrets committed by accident.

### F. Data, migrations, and jobs

- Pending migrations per environment, read-only. Never run `migrate`; if a
  generated migration is pending, hand off to
  `skills/migration-check/SKILL.md`.
- Backup freshness: which backup scripts exist, when one last ran, and whether
  a restore has ever been tested. An untested backup is a finding.
- Scheduled and queued jobs (`job:*` scripts, nightly queues): last successful
  run and error rate.

### G. Docs and workflow drift

- `README.md`, `CONVENTIONS.md`, `AI-WORKFLOWS.md`, project `CLAUDE.md` vs
  reality: scripts that no longer exist, wrong node version, missing env vars.
- `.env.example` is the contract lane C checks against — fix drift there first.
- ai-workflows sync status: project adapters behind the upstream repo.

## Report

Write `docs/maintenance/maintenance-<YYYY-MM-DD>.md`:

- **Verdict per lane** — `ok` · `attention` · `urgent`, one line each, so the
  whole sweep is readable in ten seconds.
- **Inventory** from step 0.
- **Credential matrix** — variable × environment × status × verified-on.
  Fingerprints only, never values.
- **Findings**, ranked urgent → high → medium → low. Per finding: lane,
  evidence (command output, `file:line`, status code), impact, fix, owner.
- **Verified current** — what was probed and found healthy, with dates. This
  is what makes the next sweep a delta instead of a rerun.
- **Manual checks for the user** — dashboard-only items (vendor token lists,
  webhooks, DNS/cert expiry).
- **Parked** — findings below the backlog threshold, listed explicitly.

Then hand findings at or above the threshold to `skills/backlog/SKILL.md` so
they land as real BLIs.

## Fixes

Only after the user approves, and in this order:

1. doc and `.env.example` drift (no runtime risk);
2. safe dependency patches — via `skills/npm-maintenance/SKILL.md`, not by hand;
3. config alignment (runtime pins, image patterns, CI).

Each code-touching fix gets its own branch and MR. Never bundle a credential
rotation with code changes, and never fix mid-sweep — the report must still
describe the repo it was written about.

## Constraints

- Never print, log, or commit a secret value; fingerprints only.
- Never rotate, revoke, or create credentials, and never edit CI or hosting
  environment variables.
- Never run anything that mutates a remote environment (`migrate`, `db:push*`,
  deploys, seeds).
- Never probe acceptance or production credentials unless that environment was
  explicitly put in scope.
- Never call a credential current without a successful probe or an explicit
  user confirmation.
- Never regenerate CMS or database types as part of the sweep — report drift.

## Anti-patterns

- ❌ Treating `npm audit` output as the whole sweep.
- ❌ Concluding "the API key is fine" because the variable exists.
- ❌ Assuming a working local token means production works.
- ❌ A silent codegen regen that hides a CMS model change.
- ❌ Forty undifferentiated findings with no ranking, owners, or parked list.
- ❌ Fixing during the sweep so the report no longer matches the repo.

## Example prompt

> "Run the monthly maintenance sweep — include acceptance and production, and
> check whether the Prepr tokens are still valid."
