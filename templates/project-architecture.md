<!--
Template for docs/architecture.md — written by skills/start-project.

This document holds INTENT and RATIONALE: the layer mapping the project means
to have, the data model, the trust boundaries, the deployment topology, and the
decisions that produced them. CONVENTIONS.md holds DETECTED FACTS (stack
versions, scripts, the folders that exist today) and points here for the why.
Pattern-level rules that must be followed while coding belong in rules/.

Boundary, so the two documents cannot drift:
- A folder path appears here with the layer it belongs to and the reason.
- CONVENTIONS.md lists what the tree looks like now and links here.
- When the intended mapping changes, it changes here first, as a decision.

Rules for filling it in:
- A decision belongs in the log only if it was actually made. A design someone
  is still weighing goes to "Open Questions" with the options, not to the log.
- Every decision entry gets a date and a status; superseded entries stay, with
  a pointer to what replaced them.
- Write in the language the project's other docs use; default to English.
- Remove this comment block from the generated file.
-->

# Architecture: <project name>

## Status

<Draft | Reviewed | Approved> — <date>

## Scope Of This Document

Intended structure, boundaries, and the decisions behind them.

- Detected stack, scripts, and the current tree: `CONVENTIONS.md`
- Rules to follow while coding: `rules/`
- What the product does: `docs/project-spec.md`

## Layer Mapping (intended)

Dependencies flow inward only: Presentation → Application → Infrastructure →
Domain. See `rules/clean-architecture.md` for the principles this maps onto.

| Path | Layer | Holds | Why here |
| --- | --- | --- | --- |
| `<src/…>` | <Domain / Infrastructure / Application / Presentation> | <what lives there> | <the reason this path carries this layer> |

<Any deliberate deviation from the canonical mapping, and what makes it
intentional rather than drift.>

## Data Model

| Entity | Owns | Relationships | Notes |
| --- | --- | --- | --- |
| `<Entity>` | <the data it is the master of> | <has many / belongs to> | <soft delete, versioning, localization> |

<Where the schema actually lives (CMS collections, migrations, ORM models), and
what the rule is for changing it.>

## Trust Boundaries

Every edge where untrusted data enters, and what validates it. See
`rules/type-safety.md` for the posture this implements.

| Boundary | Data | Validated by | Failure behaviour |
| --- | --- | --- | --- |
| <env vars / CMS payload / webhook / form submit / third-party API / uploaded file> | <what arrives> | <schema or guard, with its path> | <reject, fall back, log> |

<What is deliberately trusted, and why that is safe.>

## Deployment Topology

| Concern | Choice | Notes |
| --- | --- | --- |
| Hosting | <provider / runtime> | <region, scaling model> |
| Database | <engine + hosting> | <backups, migrations> |
| Media / assets | <storage> | <CDN, transforms> |
| Email | <provider> | <transactional only?> |
| Preview / draft | <mechanism> | <who may reach it> |
| CI/CD | <pipeline> | <what gates a deploy> |
| Observability | <logs, errors, analytics> | <retention, who watches it> |

## Cross-Cutting Decisions

<Short subsections for the choices that touch every feature — rendering and
caching strategy, authentication, localization, error handling. Each one names
the mechanism and the rule, then points at its decision entry below.>

## Decision Log

Newest first. One entry per decision that constrains later work.

### ADR-001 — <decision title>

- **Date**: <date>
- **Status**: <proposed | accepted | superseded by ADR-00N>
- **Context**: <the forces in play: constraint, deadline, existing code, team skill>
- **Decision**: <what was chosen, stated so a reader can act on it>
- **Consequences**: <what this makes easy, what it makes expensive, what it rules out>
- **Alternatives considered**: <option — why not>

## Open Questions

- <architectural question still open, the options on the table, and what would
  settle it>
