---
name: start-project
description: Capture project intent on day one — interview the team, then write docs/project-brief.md (why and for whom), docs/project-spec.md (what this release does), and docs/architecture.md (intended layer mapping, trust boundaries, deployment topology, decision log), and hand over to init-project for CONVENTIONS.md and the tool adapters. Works on a fresh clone of the template and as a retrofit on an existing project that never wrote these down. Use when the user starts a new project, runs a project kickoff, asks for a project brief or spec, or says "nieuw project" / "project opzetten" / "na de unicore template".
---

# Start a Project

Use this skill at project kickoff, before tooling. It captures **intent**;
`skills/init-project/SKILL.md` captures **detected facts**. Run this one first,
then hand over.

Also use it as a retrofit on an existing project that has code but no brief,
spec, or architecture doc — most projects are in that state, and the interview
gets much shorter because the repo already answers half of it.

Output — three tracked documents at the project root:

| Document | Answers | Never contains |
| --- | --- | --- |
| `docs/project-brief.md` | why the product exists, for whom, what success looks like | release scope, technical choices |
| `docs/project-spec.md` | what this release does: rules, domain, non-functionals, integrations | vision, folder structure |
| `docs/architecture.md` | intended layer mapping, data model, trust boundaries, deployment, decisions + rationale | detected stack versions, scripts |

Templates back all three: `templates/project-brief.md`,
`templates/project-spec.md`, `templates/project-architecture.md`.

---

## The boundary that keeps these from drifting

Four surfaces carry project context. Each fact has exactly one home.

| Surface | Owns | Example |
| --- | --- | --- |
| `docs/architecture.md` | intent + rationale | "`src/vendor/` is Infrastructure because the vendor coupling is deliberate" |
| `CONVENTIONS.md` | detected facts, as they are today | "Next.js 16, Payload 3, `npm run type-check`" |
| `rules/` | patterns to follow while coding | "pages never fetch; loaders do" |
| `docs/project-spec.md` | product rules | "vacancies are public without an account" |

Consequences to honour:

- A path appears in `docs/architecture.md` **with its layer and the reason**.
  `CONVENTIONS.md` lists what the tree looks like now and links here for the why.
- When the intended mapping changes, it changes in `docs/architecture.md` first,
  as a decision-log entry. `CONVENTIONS.md` is regenerated from the tree.
- Never copy a decision into two documents. Link instead.

---

## Step 1 — Detect Mode

Check the target project:

| Signal | Means |
| --- | --- |
| no `docs/project-brief.md`, `docs/project-spec.md`, `docs/architecture.md` | full run |
| some of them exist | fill the gaps only; never overwrite without asking (Step 6) |
| `package.json` + real `src/` + git history beyond the template import | **retrofit** — harvest before asking |
| bare template clone | **fresh** — everything comes from the interview |

State the detected mode back to the user in one line before continuing.

---

## Step 2 — Harvest What The Repo Already Knows

Skip on a bare clone. On a retrofit, read before asking — every fact found here
is one question the user does not have to answer:

- `README.md` — product summary, audiences, sometimes the client's own wording
- `CONVENTIONS.md` — stack, structure, deviations, existing decisions
- `rules/` (project-local) — patterns already agreed
- `package.json` — stack, scripts, integrations visible as dependencies
- `docs/backlog/`, `docs/specs/`, `docs/plans/` — scope already written down
- `src/` top-level directories — the actual layer candidates
- env schema (`src/env.ts` or equivalent) and validation helpers — trust boundaries
- deploy config (`.gitlab-ci.yml`, hosting config, `docker-compose*.yml`) — topology
- migrations or CMS collections — the real data model
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

---

## Step 3 — Interview In Rounds

Never one long questionnaire. Four rounds, each on its own, each small enough to
answer in one sitting. Use `AskUserQuestion` where the harness offers it, with
the option you would recommend first.

Skip any question the harvest already answered. Ask at most the questions whose
answers change what gets written.

**Round 1 — Why and for whom** (feeds the brief)
Problem being solved · commissioning organization and decision makers ·
audiences and what each comes to do · what success looks like and how anyone
would know · hard constraints (legal, privacy, budget, deadline) · what this
product must never become.

**Round 2 — Scope and journeys** (feeds the brief and spec)
Core user journeys end to end · what is in scope for this release · what is
explicitly out · which audience wins when a tradeoff appears · the smallest
credible release and what it has to prove.

**Round 3 — Product rules** (feeds the spec)
Roles and what each may reach · core entities and their relationships ·
CMS-managed vs code-owned content · locales and what is translated ·
accessibility target · personal data handled and the rule that follows ·
integrations and who owns their credentials · environments · release constraints
("no X in this phase").

**Round 4 — Architecture** (feeds the architecture doc)
Intended layer mapping for this project's actual folders · where the schema
lives and how it changes · every edge untrusted data enters, and what validates
it · hosting, database, media, email, preview, CI, observability · the
cross-cutting choices (rendering and caching, authentication, localization) ·
and for each real choice: what was decided, when, why, and what was rejected.

Two rules that outrank finishing the round:

- **Never invent.** No stakeholder, metric, entity, integration, or decision
  that nobody stated. An unanswered question is recorded, not filled in.
- **Unknowns are output.** Park them in `Open Questions` (brief, architecture)
  or `Open Decisions` (spec), each with who can answer it. A recorded gap is a
  deliverable; a plausible guess is a defect that reads as fact for months.

---

## Step 4 — Write The Documents

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

- The layer mapping covers the folders that **actually exist** (or, on a fresh
  clone, the ones the stack rules prescribe) — check it against
  `rules/clean-architecture.md` and the stack rule for the detected stack.
- Trust boundaries follow `rules/type-safety.md`: every inbound edge gets a row,
  including the ones with no validation today. Those rows are the honest ones.
- The decision log starts with the decisions made in Round 4 **and** the ones
  the harvest surfaced as already-made. Date them; mark status; keep superseded
  entries with a pointer to their replacement.

---

## Step 5 — Hand Over To init-project

Do not detect the stack, generate `CONVENTIONS.md`, or write tool adapters here.
That is `skills/init-project/SKILL.md`. Offer the hand-off:

```
Brief, spec, and architecture are written. Next: init-project generates
CONVENTIONS.md and the tool adapters, and will reference docs/architecture.md
for the intended layer mapping instead of re-deriving it. Run it now?
```

If `CONVENTIONS.md` already exists, say what should change in it as a result of
this run — usually a pointer to `docs/architecture.md` — and let init-project
regenerate it.

---

## Step 6 — Never Overwrite Silently

For each of the three documents that already exists:

1. Read it first.
2. Report what it already covers and what is missing against the template.
3. Offer: **extend in place** (recommended), **rewrite** (needs explicit
   confirmation), or **skip**.
4. On extend, keep the existing wording and section order; add only the missing
   sections and mark unresolved parts as open questions.

Never delete an existing decision-log entry. A decision that no longer holds is
marked superseded, with the entry that replaced it.

---

## Output Summary

```
Started <project-name>:

  docs/project-brief.md    [created]   why, audiences, goals, risks
  docs/project-spec.md     [created]   <release> scope, roles, entities, non-functionals
  docs/architecture.md     [created]   layer mapping, boundaries, topology, 4 decisions

  Mode:            retrofit (existing codebase)
  Harvested:       stack, entities, env boundary, topology
  Open questions:  3 in the brief, 5 open decisions in the spec, 2 architectural
  Next:            init-project for CONVENTIONS.md and the tool adapters
```

List the open questions in the summary. They are the reason to read the docs.

---

## Constraints

- Do not modify source code, install dependencies, or configure tooling.
- Do not generate `CONVENTIONS.md` or tool adapters — that is init-project.
- Do not create backlog items or tickets from the spec — that is `skills/backlog/SKILL.md`
  and `skills/jira-ticket/SKILL.md`, and the spec has to be agreed first.
- Do not restate the stack in `docs/architecture.md`; name paths and reasons.
- Keep each document scannable — the brief and spec around 150 lines, the
  architecture doc as long as its decision log needs.
- The three documents are tracked in git: this repo is the master for
  architectural decisions, and an untracked decision is a lost one.
