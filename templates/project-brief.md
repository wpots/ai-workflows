<!--
Template for docs/project-brief.md — written by skills/start-project.

The brief answers WHY the product exists and FOR WHOM. It carries no release
scope (that is docs/project-spec.md) and no technical decisions (that is
docs/architecture.md).

Rules for filling it in:
- Every <placeholder> is either resolved from a real answer/source, or the
  section is dropped and the question moves to "Open Questions". Never invent
  stakeholders, goals, metrics, or scope.
- Drop sections that do not apply to this project rather than leaving them empty.
- Write in the language the project's other docs use; default to English.
- Remove this comment block from the generated file.
-->

# Project Brief: <project name>

## Status

<Draft | Reviewed | Approved> — <date>

## Reference Point

<What this brief is based on: kickoff call of <date>, the live product reviewed
on <date>, a client document, the current repository. Name the sources so a
later reader can tell fact from assumption.>

## Product Summary

<Two or three paragraphs: what the product is, what it does for its users, and
where it deliberately stops. State the boundary explicitly — what continues
outside the product.>

Detailed release scope and product rules live in `docs/project-spec.md`.

## Why This Product Exists

- <problem or barrier this removes>
- <value for the primary audience>
- <value for the organization commissioning it>

## Stakeholders

| Stakeholder | Role | Decides on |
| --- | --- | --- |
| <name or role> | <client, product owner, editor, sponsor> | <what they have the final say over> |

## Primary Audiences

- <audience> — <what they come to do>
- <audience> — <what they come to do>

## Core User Journeys

One paragraph each — this is the list of journeys, not their specification. Each
one is walked step by step in `docs/journeys/<slug>.md` (written by
`skills/user-journeys`); link the document once it exists.

### 1. <journey name>

<One short paragraph: what the user is trying to achieve and what "done" looks
like for them.>

### 2. <journey name>

<…>

## Goals And Success Signals

| Goal | How we know it worked |
| --- | --- |
| <goal> | <observable signal or metric — leave "not yet decided" rather than inventing a number> |

## Scope Highlights

- <capability in scope at product level>
- <capability in scope at product level>

## Out Of Scope

- <explicitly not building this — and, where useful, why>

## Product Principles

- <principle that should settle day-to-day tradeoffs>

## Constraints And Boundaries

- <legal, privacy, contractual, budget, timeline, or platform constraint>
- <hard boundary: what this product must not become>

## Key Risks

| Risk | Impact | Mitigation or owner |
| --- | --- | --- |
| <risk> | <what it costs if it happens> | <how it is handled, or who decides> |

## Release Focus

<Which phase or release this brief is written against, and what the smallest
credible release has to prove.>

## Priority Audience

<If tradeoffs appear, which audience wins — and what that means concretely for
the others.>

## Open Questions

- <question that could not be answered yet, and who can answer it>

## Related Docs

- Release scope and product rules: `docs/project-spec.md`
- Architecture decisions: `docs/architecture.md`
- Detected stack and conventions: `CONVENTIONS.md`

## Sources

- <URL or document reference>
