---
name: maintenance
description: Run a periodic project maintenance sweep — dependency and vulnerability status, runtime/platform EOL, credential and API-key currency (Prepr CMS content tokens, GitLab/deploy token expiry), quality baseline, repo and CI hygiene, migrations, backups, and doc drift — landing one prioritized report plus backlog-ready follow-ups. Read-only by default; fixes only after approval. Use when the user asks for project maintenance, onderhoud, a monthly or periodic health check, or to verify that API keys and env config are still current.
---

# Project Maintenance Sweep

The recurring "is this project still healthy" pass. It diagnoses across every
lane that rots silently — dependencies, runtime versions, credentials, quality
baseline, CI, data, docs — and lands **one ranked report** so the user can
decide what to fix.

Skill-only — no command-runbook fallback.

This skill is an **orchestrator**. It never re-implements a lane that already
has its own skill; it runs that skill in inventory mode and folds the result
into the report.

**Cadence is manual, deliberately.** Run it monthly, or before picking a
project back up after a quiet period. There is no cron or scheduled variant:
the sweep needs a human to act on the report, and an unattended sweep just
produces reports nobody reads. Continuity comes from the previous report — the
sweep reads it and reports *deltas*, which is what makes a monthly rhythm cheap
without automating it.

## Contract (read first)

1. **Read-only by default.** The sweep diagnoses. Every fix is a separate,
   explicitly approved step (see [Fixes](#fixes)).
2. **Never print, log, or commit a secret value.** Verify a secret by *using*
   it and reading the status code; compare secrets across environments by
   fingerprint (sha256 first 8 chars, or `first4…last4`), never by value.
3. **Never rotate, revoke, or create a credential.** That happens in the
   vendor dashboard, by the user. This skill reports and asks.
4. **Delegate, don't duplicate:**
   - dependencies + vulnerabilities → `skills/npm-maintenance/SKILL.md`,
     specifically its **Inventory mode** (report-only; no updates, no audit fix)
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

Run the **Inventory mode** of `skills/npm-maintenance/SKILL.md` — outdated +
audit, no updates, no `audit fix`. Record:

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
3. **Probe liveness.** Use the credential in a minimal **read-only** request and
   read only the status code. Write the probe to the scratchpad with the Write
   tool, and load the secret through the project's own env mechanism so it never
   appears in a command:
   - dotenvx projects: `npx dotenvx run -f .env.<env> -- node <scratchpad>/probe-<service>.mjs`
   - plain `.env` projects: `node --env-file=<abs-path>/.env <scratchpad>/probe-<service>.mjs`

   Never inline a secret in a command, never `echo` it, and redact it out of any
   response body you print (`text.replaceAll(token, "<redacted>")`) — error
   pages echo credentials back surprisingly often.

   **Not everything may be probed.** A credential whose only endpoint *does*
   something — deploy hooks and build triggers (`VERCEL_BUILD_TRIGGER_*`,
   `NETLIFY_*` build hooks), webhook URLs, queue producers — is verified by
   presence and fingerprint plus a manual dashboard check. Firing it is a
   deploy, not a probe.
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
schema, or env vars matching `PREPR*`.

**Never assume variable names.** Across Greenberry projects the same token
appears as `PREPRIO_TOKEN`, `PREPR_ACCESS_TOKEN`, or
`PREPR_GRAPHQL_ACCESS_TOKEN`, and its preview twin as `PREPRIO_TOKEN_PREVIEW`,
`PREPR_PREVIEW_TOKEN`, or `PREPR_GRAPHQL_PREVIEW_ACCESS_TOKEN`. Discover every
`PREPR*` variable, then classify by **role** — and only probe the two roles that
belong to the GraphQL API:

| Role | Name pattern | GraphQL probe? |
| --- | --- | --- |
| Content token, published scope | `*TOKEN*` / `*ACCESS_TOKEN*` without `PREVIEW` | yes |
| Content token, preview scope | same, with `PREVIEW` | yes |
| Tracking/events token | `*TRACKING_TOKEN*`, often `NEXT_PUBLIC_` | **no** — different API (`tracking.prepr.io`); probing it against GraphQL yields a false "revoked" |
| Webhook secret | `*WEBHOOK*SECRET*` | no — not a token at all |
| API base URL | `PREPR_API_BASE_URL` | no — config, but must match the probed host |

A cheap sanity check before probing: Prepr GraphQL access tokens are prefixed
`ac_` (67 chars in the projects checked). A `PREPR*` variable whose value does
not start with `ac_` is almost certainly not a content token — check the prefix,
never print the value.

Checks:

1. **Token liveness.** In Prepr's GraphQL API the token *is* the path segment:
   `POST https://graphql.prepr.io/<token>` with `{ __typename }`. `200` with a
   `data` object → live. `401`/`403` → revoked or expired; treat as **urgent**,
   because the next deploy renders empty or 500s. `404` → wrong or truncated
   token.
2. **Scope.** Verified recipe — the published and preview tokens expose an
   **identical schema** (same query fields), so scope is only visible in the
   *data*:
   - introspect once (`{ __schema { queryType { fields { name } } } }`; plain
     access tokens are allowed to introspect);
   - attempt `{ <Field> { total } }` per candidate and keep the ones that answer.
     Plural names lie: in one real project `Redirects` and `CareersVacancies`
     are singletons that error with `Cannot query field "total"`. Skip those.
     Do **not** pass `limit:` — several collections reject it.
   - compare `total` per collection across both tokens. Need **≥3** usable
     collections before drawing a conclusion.
   - **Any** delta means the scopes genuinely differ. Direction is *not* the
     signal: in a real project preview was higher for most collections
     (drafts) but *lower* for others (`Locations` 564 published vs 558 preview),
     so "preview must be bigger" is wrong.
   - **All** totals identical across every collection is the finding: the two
     variables probably hold the same-scope token, so preview/draft rendering
     is silently broken.
3. **Per environment.** Probe once per env file in scope, plus the CI and
   hosting copies. A token that works locally proves nothing about production.
4. **Schema freshness.** Introspection works with the project's own token, so
   run the project's codegen against the live schema in a scratch copy and diff
   the generated output. A non-empty diff means the CMS model has moved ahead of
   the repo → report it and backlog the regen. Never silently commit
   regenerated types as part of a sweep.
5. **Asset host.** `cdnHostname` in `prepr.config.ts` and the Next image
   remote patterns must still match the Prepr environment's file host,
   otherwise images 404 in production only.
6. **Webhook secret.** Not probeable. Manual check item: in Prepr → Webhooks,
   confirm the revalidate webhook exists, targets the current deploy URL, and
   its secret matches the webhook-secret variable (compare fingerprints).
7. **Expiry.** Prepr access tokens are managed per environment in the dashboard
   and carry **no expiry field in the API response** — liveness is the only
   automated signal. Ask the user to confirm the token list and last rotation
   date in Prepr → Settings → Access tokens, and record the confirmed date in
   the report as the baseline for the next sweep.

Probe script — write it with the Write tool, never as a Bash heredoc. Take the
variable names from discovery instead of hardcoding them:

```js
// probe-prepr.mjs — tokens come from the environment and are never printed
const [pubVar, prevVar] = process.argv.slice(2); // e.g. PREPRIO_TOKEN PREPRIO_TOKEN_PREVIEW
const tokens = { published: process.env[pubVar], preview: process.env[prevVar] };
const secrets = Object.values(tokens).filter(Boolean);
const redact = (t) => secrets.reduce((acc, s) => acc.replaceAll(s, "<redacted>"), t);

async function gql(token, query) {
  const res = await fetch(`https://graphql.prepr.io/${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const text = await res.text();
  try {
    return { status: res.status, json: JSON.parse(text) };
  } catch {
    return { status: res.status, body: redact(text).slice(0, 200) };
  }
}

const totals = {};
for (const [role, token] of Object.entries(tokens)) {
  if (!token) {
    console.log(`${role}: MISSING in this env file`);
    continue;
  }
  console.log(`${role}: ${token.slice(0, 4)}…${token.slice(-4)} prefix_ok=${token.startsWith("ac_")}`);
  const live = await gql(token, "{ __typename }");
  console.log(`  liveness status=${live.status} ${live.json ? "data ok" : live.body}`);
  if (live.status !== 200) continue;

  const intro = await gql(token, "{ __schema { queryType { fields { name } } } }");
  const fields = (intro.json?.data?.__schema?.queryType?.fields ?? []).map((f) => f.name);
  totals[role] = {};
  for (const name of fields.filter((f) => /^[A-Z]/.test(f) && !/^(Similar_|Popular_|PeopleAlsoViewed_)/.test(f))) {
    const r = await gql(token, `{ ${name} { total } }`);
    const total = r.json?.data?.[name]?.total;
    if (typeof total === "number") totals[role][name] = total; // singletons error out; skipped
  }
  console.log(`  usable collections: ${Object.keys(totals[role]).length}`);
}

const shared = Object.keys(totals.published ?? {}).filter((k) => k in (totals.preview ?? {}));
const deltas = shared.filter((k) => totals.published[k] !== totals.preview[k]);
console.log(
  shared.length < 3
    ? `scope: INCONCLUSIVE (${shared.length} shared collections, need 3)`
    : `scope: ${deltas.length ? `OK — ${deltas.length}/${shared.length} differ` : "SUSPECT — every total identical, likely same scope twice"}`,
);
```

> Sandbox note: `graphql.prepr.io` is not on the default sandbox network
> allowlist, so the first probe fails with a network error. Either add the host
> to `.claude/settings.json` in the **target project** (a sandbox network
> allowlist entry — not in ai-workflows, and not shipped by the project template,
> since it only applies to Prepr projects) or run that one command unsandboxed.
> State in the report which of the two you did.

#### Repo, CI, and deploy tokens (when detected)

The only credentials in the stack with a **machine-readable expiry** — so this
is where a sweep buys the most, and where the failure is a hard deadline rather
than a slow rot.

1. **The user's own GitLab PAT** — `glab api personal_access_tokens/self`
   returns `name`, `scopes`, `expires_at`, `active`, `revoked`, `last_used_at`.
   Report the days remaining; flag under 30 days as high (GitLab caps PAT
   lifetime, so this *will* fire on schedule and takes CI, `glab`, and any
   token-based clone down with it).
2. **PATs living in env vars** (observed: `COMPONENT_LIBRARY_REPO_TOKEN`, used
   to clone a private component library during install/build). Probe read-only
   with the token as a `PRIVATE-TOKEN` header against `/user`, and read its
   expiry from `personal_access_tokens/self` with that same token. An expiring
   one breaks `npm install` in CI, which reads as a dependency failure and
   costs a debugging session.
3. **Project and group tokens** — `glab api projects/<enc-slug>/access_tokens`
   and `glab api projects/<enc-slug>/deploy_tokens` (both carry `expires_at`;
   an empty array is a valid answer, not an error).
4. **CI variables** — `glab variable list --repo <slug>` lists names, protection
   and masking, never values. Check: every secret the app needs at build time is
   present, masked, and scoped to the right environment; nothing lingers that
   the code no longer reads (a stale secret is still a leak surface).
5. **Deploy hooks and build triggers** — presence and fingerprint only. Never
   fire them; see the "not everything may be probed" rule above.

#### Analytics, maps, and other browser-exposed keys

`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_GOOGLE_GTM_ID`, analytics IDs.
These are shipped to the browser, so treat them as configuration, not secrets —
but they still break, and differently:

- **Do not probe.** A key restricted by HTTP referrer answers fine from a dev
  machine while failing in production, and every call may be billable. A green
  probe here would be actively misleading.
- **Check instead:** the key exists per environment and differs where it should
  (a production Maps key in an acceptance build inflates the production quota);
  it is not committed to git; it is documented in `.env.example`.
- **Manual dashboard items:** referrer/API restrictions still match the current
  domains, billing is active, and quota headroom is sane. Record the date the
  user confirmed these — this lane is confirmation-based by design, and the
  report must say so rather than implying a probe happened.

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
- Merge-settings drift against `rules/git-flow.md`:
  `node <ai-workflows>/scripts/gitlab-merge-settings.mjs --repo .`
  (read-only). Resolve `<ai-workflows>` to `<skill base directory>/../../`
  first — the installed plugin version the harness printed when this skill
  loaded; never a glob over the cache, where old versions linger — and to a
  `~/Web/ai-workflows/` checkout second. Neither exists → `unknown`, naming both
  paths. Any deviation is a finding — a project that lost `ff`,
  squash-always, or the pipeline gate silently changes what history and review
  guarantee. Fixing it needs `--apply` plus an explicit go, never inside the
  sweep.

### F. Data, migrations, and jobs

- Pending migrations per environment, read-only. Never run `migrate`; if a
  generated migration is pending, hand off to
  `skills/migration-check/SKILL.md`.
- Backup freshness: which backup scripts exist, when one last ran, and whether
  a restore has ever been tested. An untested backup is a finding.
- Scheduled and queued jobs (`job:*` scripts, nightly queues): last successful
  run per task slug and error rate, plus the three failures that leave no
  error anywhere — a row stuck at `processing: true` with `totalTried: 0`
  (killed mid-run; it blocks its own task slug's schedule until released), a
  heartbeat monitor that is paused or missing for a task or environment, and
  `jobs.access.run` left unset (the run endpoint is then public). On a host
  with more than one instance, also confirm exactly one instance runs the
  jobs. Hand the deep audit and any fix to `skills/payload-jobs/SKILL.md`.

### G. Docs and workflow drift

- `README.md`, `CONVENTIONS.md`, `AI-WORKFLOWS.md`, project `CLAUDE.md` vs
  reality: scripts that no longer exist, wrong node version, missing env vars.
- `.env.example` is the contract lane C checks against — fix drift there first.
- ai-workflows sync status: project adapters behind the upstream repo.

### H. Delivery metrics

- Run `node <ai-workflows>/scripts/delivery-metrics.mjs --repo . --since
  <first day of the previous sweep's month>` — read-only (git log + glab
  api), `<ai-workflows>` resolved as in lane E. It reports merged MRs, median hours from MR created to merged,
  agent-authored share, and revert count.
- Read the **label** share (`ai:agent-authored` on the MR) as the metric; the
  commit-trailer share is secondary and undercounts every squashed MR
  (`rules/git-flow.md`). A 0% label share next to a high trailer share means
  the label is not being applied — report it as `n/a` plus that finding, not as
  a collapse in agent usage.
- Paste the table into the report and state the **delta vs the previous
  sweep** — the trend is the finding, not the absolute number. A rising
  revert count or collapsing agent share is an `attention` verdict.
- Intervention rate (how often an agent run needed human correction) is not
  measurable from git; record `n/a` until session telemetry exists.

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
- **Delivery metrics** — the lane H table plus the delta against the previous
  sweep's numbers.
- **Manual checks for the user** — dashboard-only items (vendor token lists,
  webhooks, DNS/cert expiry).
- **Parked** — findings below the backlog threshold, listed explicitly.

### Backlog handoff — propose, then confirm

The sweep never creates backlog items on its own. For findings at or above the
threshold, end the report with a **proposed BLI list**: one line per item
(title + severity + the finding it comes from), plus an explicit note for any
finding that looks like it duplicates an item from an earlier sweep or an
existing `docs/backlog/` entry. The user picks which ones to create; only then
hand those to `skills/backlog/SKILL.md`.

Rationale: a monthly sweep re-finds the same slow rot every run. Auto-creating
above a threshold fills the backlog with near-duplicates that then need manual
pruning — more work than confirming a short list once.

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
- Never trigger a deploy hook, build trigger, or webhook "to test it" — that is
  a deploy. Presence and fingerprint only.
- Never probe a browser-exposed key (Maps, analytics): the result is misleading
  and the call may be billable.
- Never create backlog items without the user confirming the proposed list.
- Never regenerate CMS or database types as part of the sweep — report drift.

## Anti-patterns

- ❌ Treating `npm audit` output as the whole sweep.
- ❌ Concluding "the API key is fine" because the variable exists.
- ❌ Assuming a working local token means production works.
- ❌ Probing every `PREPR*` variable against the GraphQL endpoint — the tracking
  token and the webhook secret belong to other APIs and will read as "revoked".
- ❌ Calling the preview/published scope check conclusive on one collection, or
  concluding from the *direction* of the delta rather than its presence.
- ❌ A silent codegen regen that hides a CMS model change.
- ❌ Forty undifferentiated findings with no ranking, owners, or parked list.
- ❌ Fixing during the sweep so the report no longer matches the repo.

## Example prompt

> "Run the monthly maintenance sweep — include acceptance and production, and
> check whether the Prepr tokens are still valid."
