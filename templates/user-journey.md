<!--
Template for docs/journeys/<slug>.md — written by skills/user-journeys.

One file per journey. The journey answers HOW a user walks through the product:
the ordered path, every branch off it, and the behaviour at each step. It
carries no product rules (those live in docs/project-spec.md), no technical
structure (docs/architecture.md), and no implementation plan (docs/backlog/).

Rules for filling it in:
- Reference a rule, never restate it: "per spec § Roles" beats a second copy
  that rots.
- A step, state, role, or metric that nobody stated goes to "Open Questions"
  with an owner. An invented step reads as agreed behaviour for months.
- Drop sections that do not apply. Keep the ones that are empty *for a reason*
  and say why ("no offline behaviour: intranet only").
- Every step that has a design gets its frame link; a step without one is a
  design gap worth seeing.
- Write in the language the project's other docs use; default to English.
- Remove this comment block from the generated file.
-->

# Journey: <journey name>

## Status

<Draft | Agreed> — <date> · specced from <spec § | designs | existing app | interview>

## Actor

<role or audience> — <what they know, what access they have, how often they do this>

## Trigger And Goal

- **Trigger** — <what starts this journey: a link, an email, a task, a schedule>
- **Goal** — <what the actor is trying to achieve>
- **Done when** — <the observable end state, from the actor's point of view>

## Preconditions

- <account/role/data that must exist before the journey can start>
- <what the actor must already have done>

## Main Path

| # | Actor does | System responds | Surface / route | Data touched | Design |
| --- | --- | --- | --- | --- | --- |
| 1 | <action> | <response, including what is validated> | <route or screen> | <entity: read/write> | <frame link> |
| 2 | | | | | |

## Decision Points

| At step | Condition | Then | Else |
| --- | --- | --- | --- |
| <#> | <what is true> | <branch taken> | <other branch — link an alternate path below> |

## Alternate And Error Paths

### <name of the path> (from step <#>)

- **Cause** — <what makes this happen>
- **Behaviour** — <what the actor sees and can do next>
- **Recovery** — <how the actor gets back on the main path, or where they end up>

## States Per Surface

| Surface | Empty | Loading | Error | Unauthorised | <other> |
| --- | --- | --- | --- | --- | --- |
| <route> | <what shows> | <what shows> | <what shows and what the actor can do> | <redirect or message> | |

## Permissions And Visibility

- <role> — <which steps they may take, what is hidden vs. disabled>
- <what an unauthenticated visitor sees of this journey>

## Content And Localisation

- <which text is CMS-managed vs. code-owned>
- <what is translated, and what happens for a locale with no content>

## Accessibility Route

- **Keyboard path** — <how the whole journey is completed without a mouse>
- **Focus** — <where focus lands after each navigation or state change>
- **Announcements** — <what a screen reader must announce: errors, results, progress>
- <known risk in this journey, and the rule it follows in `rules/accessibility.md`>

## Non-Functionals That Bite Here

- <latency or budget the journey depends on>
- <caching and staleness the actor may observe>
- <limits: rate, size, volume, concurrency>

## Measurement

| What we want to know | Signal | Where it lands |
| --- | --- | --- |
| <did the actor complete the journey> | <event, log, metric> | <analytics, dashboard — "not yet decided" is a valid answer> |

## Slice Candidates

Cut per `rules/mr-sizing.md` — vertical, walking skeleton first. This is what
the backlog is written from; the sizing check happens when each item is drafted.

| # | Slice | Covers steps | Notes |
| --- | --- | --- | --- |
| 1 | <capability> — **walking skeleton** | <1–3> | <thinnest end-to-end path a user can walk> |
| 2 | <capability> | <4–5> | |
| — | <shared piece> — horizontal exception | — | consumed by slices <n, m>; cannot be discovered from one |

## Open Questions

| Question | Blocks | Who answers |
| --- | --- | --- |
| <what is undecided> | <which step or slice> | <name or role> |

## Related

- Spec: `docs/project-spec.md` § <section>
- Brief: `docs/project-brief.md` § Core User Journeys
- Architecture: `docs/architecture.md` § <section>
- Designs: <file or prototype link>
- Journeys that start or end where this one does: <link>
