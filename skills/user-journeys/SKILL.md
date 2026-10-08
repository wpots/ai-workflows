---
name: user-journeys
description: Spec the user journeys of a release — one document per journey with the actor, the end-to-end path, decision points, alternate and error paths, per-surface states, permissions, the keyboard route, and the slice candidates the backlog is cut from. Reads docs/project-spec.md and the Figma designs when they exist, and harvests routes and roles from an existing codebase when they do not. Use when the user asks to spec user journeys, user flows, or a customer journey ("journeys uitwerken", "user flows uitschrijven", "spec the flows"), or when a spec exists but nothing describes how a user actually walks through it.
metadata:
  owner: wieteke.pots
---

# Spec The User Journeys

A release spec says what the product does. It does not say how anyone walks
through it — which is where behaviour is decided by accident, in tickets. This
skill closes that gap: one document per journey, and per journey the slices the
backlog is cut from.

Runs standalone, and as the journeys lane of `skills/start-project`.

## What this owns, and what it must not

| Surface | Owns | Example |
| --- | --- | --- |
| `docs/project-brief.md` | the journey **exists** and why | "Employer posts a vacancy" — one paragraph |
| `docs/project-spec.md` | the **rules** a journey obeys | "vacancies are public without an account" |
| `docs/journeys/<slug>.md` | the **walked path** and its behaviour | step 3 validates the KvK number; empty state shows … |
| `docs/backlog/` | the **work** that builds it | slice 2/3, acceptance criteria |

The one rule that keeps these from rotting: **a journey references a product
rule, it never restates it.** Two copies of a rule means one of them is wrong
within a sprint.

## Step 1 — Detect mode

| Signal | Mode |
| --- | --- |
| `docs/project-spec.md` exists | **spec-driven** — journeys derive from its scope and rules |
| designs or a Figma link, no spec | **design-driven** — harvest the frames, and every rule the frames imply becomes an open question, not an assumption |
| running app, no docs | **retrofit** — harvest the real routes and roles first, then confirm |
| none of the above | **interview-only** |

State the detected mode in one line before continuing.

## Step 2 — Gather resources before asking anything

Every fact found here is a question the team does not have to answer twice.

- `docs/project-spec.md`, `docs/project-brief.md`, `docs/architecture.md` —
  scope, roles, entities, non-functionals, trust boundaries
- **Designs.** With a Figma file or frame URL, use the Figma tools: the frame
  inventory first, then a frame's structure and tokens for the steps you are
  writing, and a screenshot only where a state is ambiguous. Record the frame
  link per step — a step without one is a visible design gap.
- **Code** (retrofit): route files and route groups, middleware and what it
  excludes, auth and role guards, CMS collections, i18n catalogues, analytics
  events already fired
- **Ask for what is genuinely missing**: which designs exist and where,
  prototype links, content sources, test accounts per role, and who decides
  behaviour when a design does not show it

Ask for resources *before* writing anything. A journey written without the
designs gets rewritten once they arrive.

## Step 3 — Inventory the journeys, then agree the set

Present the candidates as a table — journey · actor · trigger · in this release?
— and confirm the set and the order before writing. Each document is a real
cost, and half-written journeys are worse than named gaps.

Two journeys that differ only by role are **one** journey with a permissions
section. Two journeys with different goals stay separate even when the screens
overlap.

## Step 4 — Walk each journey end to end

For the main path, per step: what the actor does, how the system responds
(including what it validates), the surface or route, the data touched, the
design frame.

Then the parts a design never shows — ask about them explicitly:

- what makes this step fail, and what the actor sees when it does
- what is validated where, and what happens on the second attempt
- what is remembered between sessions, and what is lost on abandonment
- who else is notified, and when
- what an unauthorised or unauthenticated visitor sees of this step
- empty, loading, error, and offline behaviour per surface, where relevant

**Never invent.** No step, state, role, notification, or metric that nobody
stated. Unknowns go to `Open Questions` with the person who can answer them — a
recorded gap is a deliverable; a plausible guess reads as agreed behaviour for
months.

## Step 5 — Mark the slice candidates

This is why the document exists, and it is the handover to the backlog.

- group the steps into candidate slices per `rules/mr-sizing.md` — vertical,
  each one independently mergeable and verifiable
- mark the **walking skeleton**: the thinnest end-to-end path a user can
  actually walk. It is slice 1
- name any **horizontal exception** (shared infra consumed by two or more
  slices) and say which slices consume it
- do not estimate and do not write acceptance criteria here — sizing is checked
  when the item itself is drafted

## Step 6 — Coverage check, both directions

- every spec rule that applies to this journey appears at some step
- every step traces to a spec rule, a design, or an explicit decision

Report both gaps in the recap. A missing rule is a finding for the spec, not a
licence to write the rule here.

## Step 7 — Write the documents

- one file per journey: `docs/journeys/<slug>.md` from `templates/user-journey.md`
- an index at `docs/journeys/README.md`: journey · actor · status · slices ·
  link
- strip the template's leading comment block; drop sections that do not apply,
  and say why for the ones that are deliberately empty
- write in the language the project's other docs use; default to English even
  when the interview ran in Dutch
- tracked in git — an untracked journey is a lost decision

Never overwrite silently. For an existing journey file: read it, report what it
covers and what is missing against the template, then offer **extend in place**
(recommended), **rewrite** (needs explicit confirmation), or **skip**.

## Step 8 — Hand over

- **To the backlog**: `skills/backlog` writes the items from the slice
  candidates (and enforces `rules/mr-sizing.md`); `skills/jira-ticket` files the
  tracker ticket when there is none yet
- **Inside `skills/start-project`**: return to its planning lane with the slice
  candidates as input
- **Design readiness**: list every step whose design is missing, whose keyboard
  route is unclear, or whose state is undecided. Those items block the ticket,
  not this document

## Recap

```
Journeys specced for <project>:

  docs/journeys/post-a-vacancy.md      [created]   7 steps, 3 branches, 3 slices
  docs/journeys/apply-to-vacancy.md    [extended]  added error paths + a11y route
  docs/journeys/README.md              [updated]   4 journeys, 2 agreed, 2 draft

  Mode:              spec-driven (+ 12 Figma frames)
  Slice candidates:   8 across 2 journeys, walking skeleton marked per journey
  Coverage gaps:      2 spec rules not walked; 1 step with no rule behind it
  Design gaps:        3 steps without a frame, 1 undecided empty state
  Open questions:     5, each with an owner
  Next:               skills/backlog for the slices of <journey>
```

List the open questions and the design gaps in the recap. They are the reason to
read the documents.

## Constraints

- Do not write code, backlog items, or tracker tickets here.
- Do not restate a product rule, an architecture decision, or a component spec —
  link to them.
- One journey per file; never merge two actors' goals into one document.
- Never invent a step, state, role, notification, or metric.
- Keep each document scannable: the main-path table plus the branches that
  actually exist, not every theoretical one.
- Journey documents are tracked in git.
