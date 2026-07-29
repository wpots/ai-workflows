<!--
Template for docs/project-spec.md — written by skills/start-project.

The spec answers WHAT the product does in this release: functional scope,
domain model, non-functionals, integrations, environments, and the decisions
that bound the release. It carries no product vision (that is
docs/project-brief.md) and no technical structure (that is
docs/architecture.md).

Rules for filling it in:
- A rule belongs here only if someone actually decided it. Anything still open
  goes to "Open Decisions" — an invented rule is worse than a recorded gap.
- Drop sections that do not apply. Add per-feature sections where a feature has
  real rules of its own.
- Write in the language the project's other docs use; default to English.
- Remove this comment block from the generated file.
-->

# Project Spec: <project name> <release or phase>

## Status

<Draft | Reviewed | Approved> — <date>

## Authors

- <name> <email>

## Relationship To The Brief

This document complements `docs/project-brief.md`.

The brief explains the product vision, audiences, and high-level scope. This
spec captures the product rules, boundaries, and release decisions for
<release or phase>.

## Release Focus

<Release or phase> is <the first functional release | an increment on …>.

It focuses on:

- <capability>
- <capability>

## Product Boundary

The product includes:

- <surface or area>

The product does not aim to be <the thing it will be mistaken for>. Once
<the point where users leave the product>, <what happens instead>.

## Roles And Access

<Auth approach in one line.> The baseline roles are:

- `<Role>`: <what it may reach>
- `<Role>`: <what it may reach — scope it to "own records" where that is the rule>

<Where each role actually works: admin UI, dedicated frontend routes, or both.>

## Core Domain Entities

The core entities for <release or phase> are:

- `<Entity>`
- `<Entity>`

Key relationships:

- One `<Entity>` <has many | belongs to> `<Entity>`.

## Content Model

<Which content is CMS-managed, which is code-owned, and which globals exist
(navigation, footer, site settings). State explicitly what must never be
hardcoded.>

## <Audience> Experience

The <audience> experience in <release or phase> includes:

- <behaviour the release must support>
- <behaviour the release must support>

<Any rule that constrains how it is built — data structure, entry path,
deliberate lightness.>

## <Feature Area> Rules

<Repeat per feature area that carries real rules of its own: what it must
support, what states exist, who may act on it, and what is deliberately kept
simple.>

## Content, I18n, And Accessibility

- Locales in this release: <locales>
- <What is translated: UI copy, CMS content, user-generated content.>
- <Accessibility target and where it applies.>

## Performance And Sustainability

- <Caching/rendering expectation for public pages.>
- <Budget or constraint that changes design decisions (asset weight, client JS).>

## Security, Privacy, And Operations

- <Auth and session approach.>
- <Access control across user types.>
- <Personal data handled, and the retention or visibility rule that follows.>
- <Email/transactional infrastructure and deliverability expectation.>
- <Hosting and data-residency expectation.>
- <Protection required on public write endpoints.>
- <Logging required for security-sensitive flows.>

## Integrations

| System | Purpose | Direction | Owner |
| --- | --- | --- | --- |
| <service> | <what it does for us> | <inbound / outbound / both> | <who owns the account and credentials> |

## Environments

| Environment | URL | Data | Who uses it |
| --- | --- | --- | --- |
| <local / preview / staging / production> | <url or "n/a"> | <seeded, anonymized, real> | <audience> |

## Delivery Constraints

- <no X in this release — the constraint, not the reason>

## Out Of Scope For <release or phase>

- <capability that is deliberately deferred>

## Open Decisions

- <question that must be answered before the affected feature is built, and who
  answers it>

## Related Docs

- Product vision and audiences: `docs/project-brief.md`
- Architecture decisions: `docs/architecture.md`
- Detected stack and conventions: `CONVENTIONS.md`
