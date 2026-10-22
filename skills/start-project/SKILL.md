---
name: start-project
description: The single entry point for a project — verifies the repository was created the Greenberry way (GitLab "Create from template" inside the client group, with an explicit recorded waiver when it is a PoC), makes sure the AI-workflow config exists, collects the design and service resources up front, writes docs/project-brief.md, docs/project-spec.md and docs/architecture.md, then hands the journeys to skills/user-journeys and the first sliced work to skills/backlog. Works on a fresh template clone and as a retrofit on an existing project. Use when a project starts or is being set up ("nieuw project", "project opzetten", "init project", "setup project", "project kickoff", "project brief", "project spec"), or when an existing project never wrote these documents down.
metadata:
  owner: wieteke.pots
---

# Start A Project

The one entry point for a project. Six lanes plus a first run, in order — each
one checks before it builds, so a lane that is already done costs a sentence
instead of a rerun.

| Lane | Question it answers | Output |
| --- | --- | --- |
| 0 · Repository | does the repo exist, was it created the Greenberry way, and what has the template changed since? | a verified repo, or the exact steps — plus a recorded waiver when it is a PoC, and the template MRs to port |
| 1 · Config | is ai-workflows set up in it? | `CONVENTIONS.md` + tool adapters, via `skills/setup-ai-workflows/SKILL.md` |
| 1b · First run | does it run the way a developer starts it on day one? | a pass/fail table per step; each failure a finding with its fix route |
| 2 · Resources | what already exists: designs, CMS, hosting, tracker, accounts? | a resource table every later lane reads from |
| 3 · Intent | why, for whom, what does this release do, how is it structured? | `docs/project-brief.md`, `docs/project-spec.md`, `docs/architecture.md` |
| 4 · Journeys | how does a user actually walk through it? | `docs/journeys/*`, via `skills/user-journeys/SKILL.md` |
| 5 · Plan | what is the first properly sized work? | backlog items + tickets, via `skills/backlog/SKILL.md` |

Run all of them at a kickoff. On a retrofit, run the lanes that are missing and
**say which you skip and why** — a skipped lane nobody named is how a project
ends up without an architecture doc for a year.

State the plan (which lanes will run) in one block before starting.

---

## The boundary that keeps these documents from drifting

Six surfaces carry project context. Each fact has exactly one home.

| Surface | Owns | Example |
| --- | --- | --- |
| `docs/project-brief.md` | why the product exists, for whom, what success is | "employers must reach candidates without an intermediary" |
| `docs/project-spec.md` | the product rules of this release | "vacancies are public without an account" |
| `docs/journeys/<slug>.md` | how a user walks one journey, step by step | "step 3 validates the KvK number; the empty state shows …" |
| `docs/architecture.md` | intent + rationale of the structure | "`src/vendor/` is Infrastructure because the vendor coupling is deliberate" |
| `CONVENTIONS.md` | detected facts, as they are today | "Next.js 16, Payload 3, `npm run type-check`" |
| `CONVENTIONS.md` § Tooling | where the project's services are, and who can see each | "`#jansen-greenberry` (`C0AAA111`) is shared with the client and is the release channel" |
| `rules/` | patterns to follow while coding | "pages never fetch; loaders do" |

Consequences to honour:

- A path appears in `docs/architecture.md` **with its layer and the reason**.
  `CONVENTIONS.md` lists what the tree looks like now and links there for the why.
- When the intended mapping changes, it changes in `docs/architecture.md` first,
  as a decision-log entry. `CONVENTIONS.md` is regenerated from the tree.
- Never copy a decision into two documents. Link instead.

---

## Lane 0 — Repository

Two questions before anything else:

1. **Production project or PoC/spike?** This decides whether the template method
   is required. Ask it explicitly; never infer it from the repo's size or age.
2. **Which client?** Greenberry projects live in the client's group, e.g.
   `greenberrynl/amsterdam-en-partners/iamsterdam-website`. When the client group
   does not exist yet, creating it is the first step.

### The Greenberry way

A production repo is created through GitLab's **Create from template** flow, from
the `Project templates` group into the client's group — the steps and screenshots
live in Notion: <https://app.notion.com/p/0682fe5062b84b5d9f5e5c1e049d06f7>.
That is a UI flow, so **never create a production project from the CLI**: it
skips the template, and the lineage below can then never be proven.

**Before the flow, the template must hold no MRs and no issues.** Create from
template runs GitLab Import/Export, which copies every MR and issue of the
template into the new project. The copies keep their numbers, so they also
use up the project's first MR numbers: with 49 copied MRs, the first real MR
becomes `!50`. Deleting the copies before the project's first own MR gives the
number back. trimbos-website did that and its first own MR got `!1`. Once the
project has an own MR, assume the number is gone; that case is untested. The
template's tags come along too: trimbos-website started with 26 (`v3.0.0`,
`UNI-*`, `archive/*`), and to the release skill `v3.0.0` reads as the
project's own latest version. So check the template first. All three counts
must be `0`:

```bash
glab api "projects/greenberrynl%2Fproject-templates%2Funicore-template/merge_requests?state=all" | jq length
glab api "projects/greenberrynl%2Fproject-templates%2Funicore-template/issues?state=all" | jq length
glab api "projects/greenberrynl%2Fproject-templates%2Funicore-template/repository/tags?per_page=100" | jq length
```

If any count is above `0`, stop and propose deleting those items from the
template. Deleting cannot be undone, so the user approves it first. Only then
create the project.

Resolve the GitLab remote **by URL, not by remote name** (`git remote -v`), then
check:

| # | Check | How |
| --- | --- | --- |
| 1 | repo exists and sits at `greenberrynl/<client>/<project>` | `git remote -v`, `glab repo view <path>` |
| 2 | created from the template — its lineage is recorded | `.unicore.json` exists (written by the template's setup, v4) and its `template.commit` exists in the template: `glab api "projects/greenberrynl%2Fthe-greenhouse%2Funicore-template/repository/commits/<commit>"`. No record → a v3 project or a skipped setup: fall back to a file fingerprint (`scripts/husky/readme-checks.js`, CI config, tooling config, `.nvmrc`, folder skeleton) and record that lineage could not be proven. A merge-base finds nothing: the template's `readme-checks` hook makes every project replace the template history before its first commit |
| 2b | the template has not moved on without the project | [Template delta](#template-delta-check-2b) below. Each template MR since `template.commit` that the project still lacks is a **deviation** until it has a row in the ports list |
| 3 | default branch and visibility match the Greenberry defaults | `glab api "projects/<url-encoded-path>"` |
| 3a | no MRs, issues or tags copied from the template | `glab api "projects/<path>/merge_requests?state=all"` and `.../issues?state=all`, compare each `created_at` with the project's own `created_at`; `.../repository/tags?per_page=100`, compare each tag's `commit.created_at` the same way. Anything older than the project was imported from the template, so report it as a **deviation**. If the project has no own MR yet, propose deleting the copies, after approval, and the first own MR still gets `!1`. If it already has an own MR, the number is taken. Propose deleting the tags too, after approval; a clone keeps a deleted tag until `git fetch --prune --prune-tags`. In every case, delete the items from the template too, so the next project starts clean |
| 3b | merge settings match `rules/git-flow.md` | `node <ai-workflows>/scripts/gitlab-merge-settings.mjs --project <path>` — read-only; reports `ff` + squash-always, the squash commit template, delete-source-branch, and the pipeline/discussion gates. Paste its table into the lane report. Resolving `<ai-workflows>`: see below |
| 4 | protected branches and approval rules exist | `glab api "projects/<path>/protected_branches"`, `.../approval_rules`. `main`, `acceptance` and `development` are each protected with `allow_force_push: false`. The template copy leaves `main` unprotected so the history can be replaced, and nothing protects it after that: an unprotected `main` once the history is replaced is a **deviation** |
| 5 | the CI/CD variables the pipeline needs are present | `glab api "projects/<path>/variables"` — **names only, never print values** |
| 5b | CI and hooks follow the current baseline | `.gitlab-ci.yml` includes the `greenberrynl/config/ci-components` components at a release; a release candidate or a SHA is a **deviation**, fixed by pinning to the release once it is out. `node_version` in that include, `.nvmrc` and `engines.node` name the same version: the `verify` job rejects a range that admits another major. `.husky/pre-commit` runs `gitleaks` first; `.husky/pre-push` runs `lint:check`, `type-check` and `test`. "Prevent outdated deployment jobs" and "Allow rollback" are on: `ci_forward_deployment_enabled` and `ci_forward_deployment_rollback_allowed` are `true` in `glab api "projects/<path>"` |
| 5c | secrets are set up, and gitleaks came first | Check 5b's gitleaks step was in place before the first secret was committed. Every `.env.<env>` holds only dotenvx-encrypted values (`KEY="encrypted:…"`), and `.env.keys` is gitignored. When `.env.keys.tpl` exists, the 1Password item it names exists: `op item get <item> --vault <vault> >/dev/null`, exit status only. A deploy job's `DOTENV_PRIVATE_KEY_<ENV>` is in check 5's variable names |
| 6 | tracker and chat integrations wired | Jira: `glab api "projects/<path>/integrations/jira-cloud-app"` is `active`. Greenberry connects Jira through the GitLab for Jira Cloud app on the `greenberrynl` group, so `inherited: true` is expected, and an inactive per-project `integrations/jira` is **not** a deviation. Chat: `.../integrations/slack` |
| 7 | the kickoff items the repo cannot answer: Jira project set up (standard kickoff stories imported), hosting environment chosen and contracted, CMS contract agreed | ask; record each as known or unknown |

Report one table — check · **ok / deviation / unknown** · what fixes it. Unknown
is a real answer; a guess is not.

**Resolving `<ai-workflows>`.** The scripts ship with the plugin; a
`~/Web/ai-workflows/` checkout exists only for developers who cloned the repo.
Use the first that exists:

1. `<skill base directory>/../../scripts/` — the harness prints the base
   directory when the skill loads (`…/plugins/cache/ai-workflows/greenberry/<version>/skills/start-project`),
   so this is the installed version exactly. Do not glob the cache: old
   versions linger there, and a glob returns all of them.
2. `~/Web/ai-workflows/scripts/` — a local checkout, and the only option on
   tools that do not load skills from the plugin.

Neither exists → report the check as **unknown** and name both paths tried. Never
edit a script under the plugin cache: it is replaced on update.

### Template delta (check 2b)

A project made from `development` starts on a line that keeps moving:
trimbos-website took five template MRs in its first two days. List the
template MRs merged or open since `template.commit`, decide per MR whether the
project has the change, needs a port or is not affected, and write the ports
to `docs/todo/unicore-template-ports.md`. Each port lands as its own MR, not in
the kickoff. The commands and the file's format are in
[references/template-delta.md](references/template-delta.md); read it before
running the check.

### Fixing deviations

- Nothing here changes silently. A setting a CLI can fix is proposed as the exact
  command and applied only after an explicit go. For check 3b that command is
  the same script with `--apply` — it PUTs only the deviating fields.
- Steps only a person can do (create the client group, run the template flow,
  chase a hosting contract) are handed over as a numbered list with the Notion
  link.
- Repo does not exist yet → stop the lane. The template flow is the next human
  action, and the remaining lanes wait for the clone.

### The PoC escape

A PoC or spike may skip the template method — deliberately, never accidentally:

- skip checks 2–6 (3a, 3b and 5b included); keep the minimum (repo exists, default branch, visibility,
  licence, and a README that says it is a PoC) and check 5c: a PoC leaks a
  committed secret just as well
- **record the waiver**, or it quietly becomes a production project:
  `Project type: PoC — template method waived` in `docs/project-brief.md`, plus a
  decision-log entry in `docs/architecture.md` with who decided, when, why, and
  what must happen if it productionises
- say in the recap that the waiver is recorded, and where

---

## Lane 1 — Config

Check whether the project is set up for AI-assisted work: `CONVENTIONS.md`,
`AI-WORKFLOWS.md`, the tool adapters, and the synced `rules/`.

- missing or stale → run `skills/setup-ai-workflows/SKILL.md` now, so the later
  lanes already work against the project's own conventions
- present → say so, note what looks stale, move on

On a fresh clone `docs/architecture.md` does not exist yet, so that run detects
the layer mapping itself. After lane 3 writes the architecture doc, **offer the
refresh**: `CONVENTIONS.md` should link the intended mapping instead of carrying
a second, re-derived copy of it.

---

## Lane 1b — First run

Lanes 0 and 1 read the repository; this lane runs it, the way a developer does
on day one. On trimbos-website four of the first thirteen commits fixed this
path, each found by accident during other work: the tests failed without CMS
env, the database had no start script and a wrong example URL, the Payload CLI
read the encrypted env as plain text and lost port 5432 to another project's
container, and a pre-push from a linked worktree set `core.bare=true` in the
shared `.git/config`.

Check the prerequisites (Docker, gitleaks, the 1Password CLI, a free database
port), then run the path with the scripts `package.json` defines: install from
the lockfile, `.env.keys`, `test` without CMS env, `db:up` — **ask first**, it
starts a container — with the migrations, `lint:check`, `type-check`, `build`,
and the hook commands. The full list and the report format are in
[references/first-run.md](references/first-run.md); read it before running the
lane. A pass you did not see is not a pass.

**Every failure is a finding, not a fix.** Check whether the failing file is
template-owned (the `owned` globs of check 2b):

- template-owned → a template fix through `skills/upstream-to-unicore`, plus a
  row in the ports list of check 2b; when an open template MR already fixes
  it, name that MR
- project-owned → an item through `skills/backlog`

The kickoff goes on with lane 2; the fixes land as their own MRs. On a
retrofit, run this lane when nobody has run a fresh clone since the last
template port, and skip it, saying so, when the team runs this path daily.

---

## Lane 2 — Resources

The cheapest lane, and the one that prevents the most rework: every document,
journey, and component spec after this point is written from these answers. Ask
once, as a table, and ask before writing anything.

| Area | What to collect |
| --- | --- |
| Design | Figma file and prototype links per surface, the design-system/library file, where tokens come from, who owns them, what is still unfinished; per file whether it is a concept or signed off, and whether it has variables with roles, modes and mobile sizes — tokens taken from a concept are proposals until sign-off |
| Content | CMS and which instance/environment, content-contract status, migration source (an existing site?) and its data classification (a production dump stays local, never in the repo or a test fixture), who writes the content |
| Tracker | project key and board ids (through the `jira` CLI, `skills/service-cli`), sprint cadence, whether the standard kickoff stories were imported, and whether the machine's `jira` default is another project: then every command needs `-p <KEY>` and sprint commands a per-project config |
| Chat | channels with their ids; which one is shared with the client (the release skill posts there) and which is internal |
| Hosting | chosen environment(s), contract status, who deploys, domains, preview URLs |
| Integrations | analytics, consent, search, mail, auth, payments — and **who owns each credential** |
| Brand & legal | brand guide, accessibility target, privacy/DPIA constraints, languages |
| Access | test accounts per role, staging URLs, VPN, repo access for the team |

Rules for this lane:

- **Never invent a link or a credential owner.** No answer → an open question
  with a name attached.
- A design link is worth asking for twice. Journeys and component specs written
  without the frames get rewritten when the frames arrive.
- **Enumerate prior implementations; never accept the stated count.** When the
  product replaces, generalises, or is cloned from existing builds, those builds
  are a requirements source, so find all of them:
  `glab api "groups/<group>/projects?search=<term>&include_subgroups=true&per_page=50"`.
  A count given from memory is routinely short, and the build nobody mentioned
  is often the oldest — the one the others grew from. Read each as code, not
  only as a live site.
- Answers land in the document that owns them, never in a separate resource
  file nobody updates. Product facts go to the brief, spec, architecture or a
  journey. **Where a service is** — tracker key and boards, channel ids, Figma,
  Notion and Drive links — goes to `CONVENTIONS.md` § Tooling, because skills
  read it there (the release skill takes its Slack channel from it). Each entry
  carries its flag: shared with the client, not final, confidential. The brief
  links to that section instead of copying it.

---

## Lane 3 — Intent

### 3a. Harvest what the repo already knows

**First, check whether this kickoff already ran** — also on what looks like a
bare clone: other worktrees and the stash list (including the `^3` parent of a
`-u` stash) can hold a prior run's documents that `git status`, `ls` and a
`docs/` glob never show. Missing them is the most expensive failure in this
skill. The commands are in [references/prior-run.md](references/prior-run.md).
When a prior run exists, stop and reconcile with the user before writing — see
"Never overwrite silently".

Then, on a retrofit, read before asking — every fact found here is one question
the team does not have to answer:

- `README.md` — product summary, audiences, sometimes the client's own wording
- `CONVENTIONS.md` — stack, structure, deviations, existing decisions
- `rules/` (project-local) — patterns already agreed
- `package.json` — stack, scripts, integrations visible as dependencies
- `docs/backlog/`, `docs/specs/`, `docs/plans/` — scope already written down
- any prioritised requirements or scope document — glob widely
  (`docs/*requirement*`, `docs/*scope*`, `docs/*spec*`), because the document
  that owns the requirement IDs every other doc cites rarely sits under a folder
  name this list predicts. When one exists it is the authority: the spec records
  rules decided around it and does not restate it
- `src/` top-level directories — the actual layer candidates
- env schema (`src/env.ts` or equivalent) and validation helpers — trust boundaries
- deploy config (`.gitlab-ci.yml`, hosting config, `docker-compose*.yml`) — topology
- migrations or CMS collections — the real data model
- middleware/proxy and route groups — the request paths and what they exclude
- cache tags, revalidation hooks, storage adapters, cron or queue config — the
  runtime paths that the diagrams have to show
- import-boundary lint config, and at which severity — whether the layer mapping
  is enforced or merely intended
- `docs/todo/`, existing epics — the known architectural debt, already tracked;
  the doc links to those items instead of restating them
- `git log` on config files — decisions someone already made silently
- the merged MR descriptions since the first commit — where a decision made
  before the kickoff was argued, with its reason and what was rejected. With
  check 3b's squash commit template the squash commit carries the MR body
  (`git log --format=%B <default-branch>`); otherwise
  `glab mr list -R <path> --merged --output json`. Each "turn on X", "replace
  Y with Z" or "not Clever, not Vercel" in there is a decision-log candidate,
  dated by its merge

Present the harvest as a **confirm-or-correct list**, not as questions:

```
From the repo I already have:
  Stack        Next.js 16 + Payload 3 (Postgres), Tailwind 4
  Entities     User, Organization, Vacancy, Application  (from collections/)
  Boundaries   env via Zod (src/env.ts); CMS payloads not validated
  Topology     Clever Cloud + Postgres, GitLab CI
  Locales      nl, en

Correct anything that is wrong; I will only ask about what is missing.
```

A fact harvested from the repo is evidence, not intent. If the repo shows
something that looks accidental, ask whether it is a decision or drift — the
answer belongs in the decision log either way.

### 3b. Interview in rounds

Never one long questionnaire. Four rounds, each small enough to answer in one
sitting. Use `AskUserQuestion` where the harness offers it, with the option you
would recommend first. Skip anything lane 2 or the harvest already answered.

| Round | Feeds | Covers |
| --- | --- | --- |
| 1 · Why and for whom | brief | problem, decision makers, audiences, success, hard constraints, what it must never become |
| 2 · Scope | brief, spec | journeys (names plus one line; lane 4 specs them), in and out of scope, which audience wins, the smallest credible release |
| 3 · Product rules | spec | roles, entities, CMS vs code content, locales, accessibility, personal data, integrations and credential owners, environments, release constraints |
| 4 · Architecture | architecture | system context, runtime paths and caching, layer mapping and its enforcement, schema, untrusted edges, hosting and services, cross-cutting choices, known deviations, each real decision with its reason |

The questions per round are in
[references/interview-rounds.md](references/interview-rounds.md); read it
before the first round.

Two rules that outrank finishing the round:

- **Never invent.** No stakeholder, metric, entity, integration, or decision
  that nobody stated. An unanswered question is recorded, not filled in.
- **Unknowns are output.** Park them in `Open Questions` (brief, architecture)
  or `Open Decisions` (spec), each with who can answer it. A recorded gap is a
  deliverable; a plausible guess is a defect that reads as fact for months.

### 3c. Write the documents

Write in this order — each one narrows the previous. Follow the templates, drop
sections that do not apply rather than leaving placeholders, and resolve every
`<placeholder>` or move it to the open-questions section.

1. `docs/project-brief.md` from `templates/project-brief.md`
2. `docs/project-spec.md` from `templates/project-spec.md`
3. `docs/architecture.md` from `templates/project-architecture.md`

Strip the template's leading HTML comment block from every generated file.

Write in the language the project's other docs use; default to English even when
the interview ran in Dutch, so the docs stay usable for every tool and reader.

For the architecture doc specifically:

- **It is a map, not a rulebook.** Open with the link table: which document
  answers which question, and that the rule wins when a rule and this file
  disagree. Every section links to the rule or spec that owns the detail instead
  of restating it. Restating is how the copy rots.
- **Write the diagrams in draw.io**, one `docs/diagrams/<name>.drawio.svg` per
  diagram, never Mermaid. A system-context diagram is the minimum. The file
  format, layout rules and when to add more diagrams are in
  [references/architecture-diagrams.md](references/architecture-diagrams.md).
- **Work outside in**: system context → topology → request paths → read path →
  layers → data → boundaries. A reader who stops after the first diagram should
  still have the right mental model.
- The layer mapping covers the folders that **actually exist** (or, on a fresh
  clone, the ones the stack rules prescribe) — check it against
  `rules/clean-architecture.md` and the stack rule for the detected stack. Say
  what enforces it and at which severity; "intended, unenforced" is a finding
  worth writing down.
- Trust boundaries follow `rules/type-safety.md`: every inbound edge gets a row,
  including the ones with no validation today. Those rows are the honest ones.
- **Known architectural debt is a deliverable.** Every deviation the harvest
  surfaced goes in that section with the item that tracks it — including any
  document or rule you found pointing at something that no longer exists. Debt
  with no tracker gets one proposed, not omitted. Keep it out of Open Questions:
  debt has an answer, it just is not implemented.
- The decision log starts with the decisions made in Round 4 **and** the ones
  the harvest surfaced as already-made — including a lane 0 PoC waiver. Date
  them; mark status; keep superseded entries with a pointer to their replacement.
  A retrofit doc that honestly has no recorded decisions yet ships with an empty
  log and a full debt section — that is a real state, not a gap to fill with
  guesses.

---

## Lane 4 — Journeys

The spec says what the product does; it does not say how anyone walks through it.
Hand that to `skills/user-journeys/SKILL.md`, with the spec, the brief's journey
list, and the design links from lane 2.

It writes one document per journey in `docs/journeys/`, and each one ends in
**slice candidates** — which is exactly what lane 5 needs. A journey whose design
is not finished is still worth specifying: the missing frames come back as
design-readiness items instead of silent assumptions.

---

## Lane 5 — Plan

Turn the slice candidates into work, and stop there:

- `skills/backlog/SKILL.md` writes the items, sliced and sized per
  `rules/mr-sizing.md` — one item is one reviewable MR, so one journey usually
  produces several
- `skills/jira-ticket/SKILL.md` files the tracker ticket when there is none yet;
  one ticket can carry several items
- do not implement anything here. Delivery is `skills/work-backlog/SKILL.md`

An item that cannot be sized because a lane-2 resource is missing stays a
recorded gap. Never invent acceptance criteria around an unanswered question.

---

## Never overwrite silently

For each document that already exists (`docs/project-brief.md`,
`docs/project-spec.md`, `docs/architecture.md`):

1. Read it first.
2. Report what it already covers and what is missing against the template.
3. Offer: **extend in place** (recommended), **rewrite** (needs explicit
   confirmation), or **skip**.
4. On extend, keep the existing wording and section order; add only the missing
   sections and mark unresolved parts as open questions.

Never delete an existing decision-log entry. A decision that no longer holds is
marked superseded, with the entry that replaced it.

---

## Recap

```
Started <project-name>:

  Lane 0  repository     [checked]   template lineage ok · 2 deviations (no approval
                                     rule, Jira integration missing) · hosting unknown
                                     · 4 template MRs to port
  Lane 1  config         [ran]       setup-ai-workflows: CONVENTIONS.md + 4 adapters
  Lane 1b first run      [ran]       6/8 pass · test fails without CMS env
                                     (template-owned → upstream) · db:up not run
                                     (Docker blocked in the sandbox)
  Lane 2  resources      [collected] 3 Figma links, CMS instance, tracker key; 2 gaps
  Lane 3  intent         docs/project-brief.md   [created]
                         docs/project-spec.md    [created]
                         docs/architecture.md    [created]  system context + 3 diagrams
  Lane 4  journeys       [delegated] 4 journeys specced, 11 slice candidates
  Lane 5  plan           [next]      backlog for "post a vacancy" (3 slices)

  Mode:            retrofit (existing codebase)
  Project type:    production — template method verified
  Open questions:  3 in the brief, 5 open decisions, 2 architectural
  Tracked debt:    3 known deviations, 1 stale doc reference
  Waiting on:      hosting contract, 2 design frames
```

List the open questions, the lane 0 deviations, the lane 1b failures with
their fix route, and everything waiting on a person. They are the reason to
read the documents.

---

## Constraints

- Do not modify source code, add or remove dependencies, or configure tooling.
  Lane 1b runs the project's own scripts, an install from the lockfile and
  (after a go) its local database container; that is the developer's first
  run, not a change to the project.
- Do not create or reconfigure a GitLab project silently — propose, then act on
  an explicit go. Never create a production repo from the CLI: it skips the
  template.
- Never print CI/CD variable values. Names only.
- A PoC waiver that is not written into the brief *and* the decision log does not
  count as a waiver.
- Do not generate `CONVENTIONS.md` or the tool adapters here — that is
  `skills/setup-ai-workflows/SKILL.md`.
- Do not write journey documents here — that is `skills/user-journeys/SKILL.md`.
- Do not create backlog items or tickets here — that is `skills/backlog/SKILL.md`
  and `skills/jira-ticket/SKILL.md`, and the spec has to be agreed first.
- Do not restate what a rule, a spec, or a journey already says — link to it. Two
  copies of a boundary means one of them is wrong within a sprint.
- Keep each document scannable — the brief and spec around 150 lines, the
  architecture doc as long as its diagrams, decision log, and debt list need.
- The intent documents and the journeys are tracked in git: the project repo is
  the master for architectural decisions, and an untracked decision is a lost one.
