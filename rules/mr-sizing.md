# MR Size & Scope

> Apply these rules whenever work is sized or sliced — writing a backlog item,
> refining a ticket, planning a sprint — and whenever an MR is opened or
> reviewed.

The unit of delivery is not the ticket. It is the **slice**: one independently
mergeable, independently verifiable behaviour change.

```
Jira ticket  1 ── N  backlog item (slice)  1 ── 1  MR
```

A ticket that produces one MR nobody can review in a single sitting is a
planning failure, not a review problem. Slice while the work is still prose;
splitting after the code exists costs a rebase instead of a sentence.

## Budget

Measured on **authored** lines and files in the branch diff against its base.

| Measure | Target | Split required |
| --- | --- | --- |
| Changed lines (added + removed) | ≤ 400 | > 800 |
| Changed files | ≤ 15 | > 25 |

Not counted — content a reviewer scans rather than reads:

- lockfiles and generated types (`payload-types.ts`, codegen/GraphQL output)
- migration SQL and schema snapshots
- translation catalogues, fixtures, seed data, vendored code
- pure renames and moves with no body change

An MR over budget **only** on that content is fine. State the split in the
description ("380 authored lines + 2.1k generated") so the reviewer knows what
to actually read.

## Sliceability test

Every slice must pass all four. One that fails a condition is not a slice:
merge it back into its neighbour, or re-cut the boundary.

1. **Mergeable alone.** After it merges, the base branch is green and
   shippable. Unreachable code, a dark launch, or a flag defaulting to off all
   qualify; "works once the next MR lands" does not.
2. **Verifiable alone.** It has its own `How to verify` steps and at least one
   automated check that fails without the change.
3. **No rework debt.** The next slice does not rewrite this slice's public
   surface — API shape, component props, schema field. If it would, the
   boundary is in the wrong place.
4. **One sentence, no "and".** A title that needs "and" (or a comma doing the
   same work) describes two slices.

## Split triggers

Any single trigger means more than one slice:

| Trigger | Cut |
| --- | --- |
| Schema/CMS migration + behaviour that uses it | migration slice first, on its own |
| Mechanical refactor (rename, move, extract) + new behaviour | mechanical slice first |
| More than one journey step, role, or surface (public site + admin) | one slice per step, role, or surface |
| A new dependency + the feature that needs it | dependency and its adapter first |
| More than ~7 acceptance criteria, or criteria that demo independently | one slice per demoable group |
| Estimated build > 1 day, or > ~500 authored lines expected | slice until each fits the budget |
| Two architectural seams changed in a breaking way | one seam per slice |

## Keep together

Splitting is not free, and these splits produce slices that fail the
sliceability test:

- a schema field and the only code that reads it, when neither works alone
- a component and its tests or story
- an i18n key and its usage; a type and its validator or guard
- a bug fix and the regression test that proves it

Prefer one 500-line slice over two where the first cannot be verified.

## Slice shape

**Vertical by default.** Each slice cuts through every layer it needs — schema →
data access → UI — for one narrow capability. Start with the walking skeleton:
the simplest end-to-end path a user can actually walk. Then enrich it.

**Horizontal is the exception**, allowed only when the shared piece is consumed
by two or more later slices and cannot be discovered from one of them — an auth
boundary, a cache layer, a design-token import. Name the exception in the item's
technical notes, and name the slices that consume it.

Layer-first slicing ("all schema", then "all API", then "all UI") is not a
permitted default: those slices individually deliver nothing verifiable, which
fails sliceability test 2.

## Bookkeeping

Slices are tracked in the backlog files themselves (`rules/backlog.md`), never
in a separate ledger:

- every item carries its ticket key, and — once a ticket has more than one —
  `Slice: 2/3 — <capability>`
- slice N+1 lists `Depends on: <slice N item>` under `## Related`
- **a ticket is delivered when every item carrying its key is `done` on the
  default branch.** That derived state is what triggers the product-owner
  handoff in `skills/mr-merged`; no progress field is maintained by hand

## Enforcement

| Moment | Level |
| --- | --- |
| Writing, refining, or planning an item (`skills/backlog`, `skills/refinement`, `skills/jira-ticket`, `skills/sprint-planning`) | **Blocking** — an item that trips a split trigger is cut into slices before it may be marked `ready` |
| Opening or reviewing an MR (`skills/create-pr`, `skills/code-review`) | **Advisory** — report the overrun and where the cut should have been; do not re-slice work that is ready to merge |

The asymmetry is deliberate. At planning time a split costs a sentence; after
the build it costs a rebase, so the late gate reports instead of blocking — and
the report is what makes the next planning round cut better.
