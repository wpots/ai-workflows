# Documentation and Comment Freshness

Comments, JSDoc, and repo docs are read as fact by the next reader — human or
agent. A description that stopped being true is worse than no description.

## Policy

- Comments, JSDoc, and repo docs (`README`, `CONVENTIONS.md`,
  `AI-WORKFLOWS.md`, `docs/*`) that describe changed behaviour are updated in
  the **same** MR as the behaviour change.
- A comment that contradicts the code is a **defect**, not a nitpick. It is
  reported and fixed like any other finding.
- When a comment cannot be made true cheaply, **delete it** rather than leave
  it wrong. A missing comment is recoverable from the code; a wrong one
  actively misleads.
- Documentation language follows the repo, not the chat. If the repo documents
  in English, new and updated docs are English — regardless of the language
  the change was discussed in.

## What Counts As Stale

The cheap, high-value signal is a comment or doc whose **subject appears in
the diff**:

- a renamed or removed function, flag, or file still named in a comment or doc
- a changed default still documented as the old value
- a removed branch, parameter, or error case still explained
- JSDoc whose parameters, return type, or thrown errors no longer match the
  changed signature

Prefer these concrete mismatches over judging whether a comment is "good".
Style, density, and completeness of **existing** comments are out of scope —
comments the change adds are held to "What A New Comment May Say" below.

## What A New Comment May Say

A comment added by a change earns its place only by stating something the
code cannot show: an external contract, an invariant, a real gotcha, a why
that outlives the MR. Everything else is noise the moment the MR merges.
These classes of **added** comment are findings — recommend deletion, they
are not style nitpicks:

- **Restating the adjacent code** — `// the city is the place name` above
  `locationName: address?.city ?? title`.
- **Justifying the change to the reviewer** — "shared on purpose",
  "deliberately excluded", "`Record<…>` is the point". Argument for why the
  change is correct belongs in the MR description; a comment that argues is
  stale the day it lands, because it describes the change, not the code.
- **File-header essays** that restate the MR description or narrate design
  decisions already visible in the code and its tests.
- **Density that breaks register** — a multi-line justification on a list
  entry whose siblings carry two-word labels. New comments match the comment
  density and idiom of the surrounding code.

The test: would the comment still be worth reading a year from now, to
someone who never saw the MR? If it only helps someone *reviewing* the
change, move its content to the MR description and delete it.

## Scope

This rule is **diff-scoped**: it applies to code and docs touched by the
current change. Repo-wide documentation audits are a periodic maintenance
concern (`skills/maintenance`), not a per-MR gate.

## Relation To Other Surfaces

- `skills/code-review` executes this policy as its documentation-and-comment
  freshness dimension; findings cite this rule.
- This file states policy only — review mechanics live in the skill and its
  fallback runbook.
