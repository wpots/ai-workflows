---
name: start-project
description: The single entry point for a project — verifies the repository was created the Greenberry way (GitLab "Create from template" inside the client group, with an explicit recorded waiver when it is a PoC), makes sure the AI-workflow config exists, collects the design and service resources up front, writes docs/project-brief.md, docs/project-spec.md and docs/architecture.md, then hands the journeys to skills/user-journeys and the first sliced work to skills/backlog. Works on a fresh template clone and as a retrofit on an existing project. Use when a project starts or is being set up ("nieuw project", "project opzetten", "init project", "setup project", "project kickoff", "project brief", "project spec"), or when an existing project never wrote these documents down.
---

# Start A Project

The one entry point for a project. Six lanes, in order — each one checks before
it builds, so a lane that is already done costs a sentence instead of a rerun.

| Lane | Question it answers | Output |
| --- | --- | --- |
| 0 · Repository | does the repo exist, and was it created the Greenberry way? | a verified repo, or the exact steps — plus a recorded waiver when it is a PoC |
| 1 · Config | is ai-workflows set up in it? | `CONVENTIONS.md` + tool adapters, via `skills/setup-ai-workflows/SKILL.md` |
| 2 · Resources | what already exists: designs, CMS, hosting, tracker, accounts? | a resource table every later lane reads from |
| 3 · Intent | why, for whom, what does this release do, how is it structured? | `docs/project-brief.md`, `docs/project-spec.md`, `docs/architecture.md` |
| 4 · Journeys | how does a user actually walk through it? | `docs/journeys/*`, via `skills/user-journeys/SKILL.md` |
| 5 · Plan | what is the first properly sized work? | backlog items + tickets, via `skills/backlog/SKILL.md` |

Run all six at a kickoff. On a retrofit, run the lanes that are missing and
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

Resolve the GitLab remote **by URL, not by remote name** (`git remote -v`), then
check:

| # | Check | How |
| --- | --- | --- |
| 1 | repo exists and sits at `greenberrynl/<client>/<project>` | `git remote -v`, `glab repo view <path>` |
| 2 | created from the template — shared history with it | `git fetch https://gitlab.com/greenberrynl/the-greenhouse/unicore-template.git` then `git merge-base HEAD FETCH_HEAD`. No common ancestor → fall back to a file fingerprint (CI config, tooling config, `.nvmrc`, folder skeleton) and record that lineage could not be proven — usually because history was squashed on import |
| 3 | default branch and visibility match the Greenberry defaults | `glab api "projects/<url-encoded-path>"` |
| 3b | merge settings match `rules/git-flow.md` | `node ~/Web/ai-workflows/scripts/gitlab-merge-settings.mjs --project <path>` — read-only; reports `ff` + squash-always, the squash commit template, delete-source-branch, and the pipeline/discussion gates. Paste its table into the lane report |
| 4 | protected branches and approval rules exist | `glab api "projects/<path>/protected_branches"`, `.../approval_rules` |
| 5 | the CI/CD variables the pipeline needs are present | `glab api "projects/<path>/variables"` — **names only, never print values** |
| 6 | tracker and chat integrations wired | `glab api "projects/<path>/integrations/jira"`, `.../integrations/slack` |
| 7 | the kickoff items the repo cannot answer: Jira project set up (standard kickoff stories imported), hosting environment chosen and contracted, CMS contract agreed | ask; record each as known or unknown |

Report one table — check · **ok / deviation / unknown** · what fixes it. Unknown
is a real answer; a guess is not.

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

- skip checks 2–6 (3b included); keep the minimum (repo exists, default branch, visibility,
  licence, and a README that says it is a PoC)
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

## Lane 2 — Resources

The cheapest lane, and the one that prevents the most rework: every document,
journey, and component spec after this point is written from these answers. Ask
once, as a table, and ask before writing anything.

| Area | What to collect |
| --- | --- |
| Design | Figma file and prototype links per surface, the design-system/library file, where tokens come from, who owns them, what is still unfinished |
| Content | CMS and which instance/environment, content-contract status, migration source (an existing site?), who writes the content |
| Tracker | project key, board, sprint cadence, whether the standard kickoff stories were imported |
| Hosting | chosen environment(s), contract status, who deploys, domains, preview URLs |
| Integrations | analytics, consent, search, mail, auth, payments — and **who owns each credential** |
| Brand & legal | brand guide, accessibility target, privacy/DPIA constraints, languages |
| Access | test accounts per role, staging URLs, VPN, repo access for the team |

Rules for this lane:

- **Never invent a link or a credential owner.** No answer → an open question
  with a name attached.
- A design link is worth asking for twice. Journeys and component specs written
  without the frames get rewritten when the frames arrive.
- Answers land in the document that owns them (brief, spec, architecture,
  journey), not in a separate resource file nobody updates.

---

## Lane 3 — Intent

### 3a. Harvest what the repo already knows

Skip on a bare clone. On a retrofit, read before asking — every fact found here
is one question the team does not have to answer:

- `README.md` — product summary, audiences, sometimes the client's own wording
- `CONVENTIONS.md` — stack, structure, deviations, existing decisions
- `rules/` (project-local) — patterns already agreed
- `package.json` — stack, scripts, integrations visible as dependencies
- `docs/backlog/`, `docs/specs/`, `docs/plans/` — scope already written down
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

**Round 1 — Why and for whom** (feeds the brief)
Problem being solved · commissioning organization and decision makers ·
audiences and what each comes to do · what success looks like and how anyone
would know · hard constraints (legal, privacy, budget, deadline) · what this
product must never become.

**Round 2 — Scope** (feeds the brief and spec)
Which journeys exist and who walks them — **names plus one line each; lane 4
specs them** · what is in scope for this release · what is explicitly out ·
which audience wins when a tradeoff appears · the smallest credible release and
what it has to prove.

**Round 3 — Product rules** (feeds the spec)
Roles and what each may reach · core entities and their relationships ·
CMS-managed vs code-owned content · locales and what is translated ·
accessibility target · personal data handled and the rule that follows ·
integrations and who owns their credentials · environments · release constraints
("no X in this phase").

**Round 4 — Architecture** (feeds the architecture doc)
System context: which processes serve which surfaces, and every external service
they talk to · the runtime paths — how a request reaches a surface, what is
cached cross-request and what may never be, what invalidates it, scheduled work
and what keeps it from running twice · intended layer mapping for this project's
actual folders, and whether anything enforces it · where the schema lives and how
it changes · every edge untrusted data enters, and what validates it · hosting,
database, media, email, preview, CI, observability, plus the runtime constraints
those imply · the cross-cutting choices (authentication, localization, headers,
consent, testing) · known deviations that exist in the code today and what
tracks them · and for each real choice: what was decided, when, why, and what
was rejected.

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
- **Write the diagrams.** Mermaid, inline, because it renders on GitLab and
  GitHub and stays reviewable in a diff. A system-context diagram is the
  minimum — it is the one thing a new developer reads first. Add a request-path
  diagram once more than one surface shares the runtime, and a read/invalidation
  pair once anything is cached cross-request. Diagram the shape; put the
  exceptions a reader cannot guess in the notes under it.
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
  Lane 1  config         [ran]       setup-ai-workflows: CONVENTIONS.md + 4 adapters
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

List the open questions, the lane 0 deviations, and everything waiting on a
person. They are the reason to read the documents.

---

## Constraints

- Do not modify source code, install dependencies, or configure tooling.
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
