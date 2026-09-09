# Architecture Decision Records (ADRs)

An ADR records one architecturally significant decision: the context that
forced it, the decision itself, and its consequences. The point is that the
**why** survives the people, the chat logs, and the sprint that produced it.
ADRs are **append-only history** — a decision that turns out wrong is not
edited but superseded by a new ADR that links back.

## When to Write One

Write an ADR when a decision:

- constrains structure, dependencies, or the shape of an integration
  (a vendor seam, a contract type, a flag-vs-branch strategy);
- rejects an obvious alternative that the next developer would otherwise
  reach for ("why didn't we just…");
- came out of a spike, measurement, or session with a date and a rationale
  worth keeping;
- replaces or reverses an earlier recorded decision (supersede it).

Do **not** write one for reversible implementation details, one-file choices,
or anything a code comment at the decision site covers.

## Location and Naming

```
docs/
├── architecture.md      what IS — current state (plus agreed target)
└── adr/
    ├── README.md        index + template
    ├── 0001-<slug>.md
    └── 0002-<slug>.md
```

- One decision per file: `NNNN-short-kebab-slug.md`, numbered sequentially,
  zero-padded to four digits.
- `docs/adr/README.md` holds the index table (number, decision, status, date)
  and the template.
- Statuses: `proposed` → `accepted` (or `rejected`); later
  `superseded by NNNN`. A status change edits only the `Status` field; the
  record itself stays as written.
- English, like all repo documentation (`rules/documentation.md`).

## Format (MADR-lite)

Keep it short: link evidence instead of repeating it — measured data stays in
the spike or investigation document it came from.

```markdown
# NNNN — Title (imperative, one line)

## Status

proposed | accepted | rejected | superseded by NNNN

## Date

YYYY-MM-DD

## Context

What forces this decision? Facts and constraints, not opinions.

## Decision

What we do, stated in one or two sentences.

## Consequences

What becomes easier, what becomes harder, what follow-up it creates.

## References

Links to evidence, related backlog items, tickets.
```

## Relation to Other Documents

- `docs/architecture.md` describes the **current** state; ADRs record the
  decisions that change it. When an accepted ADR changes the picture, update
  `architecture.md` in the same MR (`rules/documentation.md` freshness rule).
- A backlog item that implements a decision links its ADR under `Related`,
  and the ADR links the enabling items under `References`.
- ADRs are durable: sprint compaction (`skills/compact-sprint`) never removes
  them, and spike folders may be pruned once their decisions are recorded.
- `skills/start-project` (retrofit included) creates `docs/architecture.md`;
  create `docs/adr/` alongside it the first time a decision needs recording —
  not preemptively.
