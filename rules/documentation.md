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
- **Pointing at something that will not exist** — an MR or PR number ("raised
  in review of !34"), "see the MR for the evidence", a ticket that only
  records the discussion, a chat thread. The one reader who can follow the
  reference is the reviewer, who does not need it. State the behaviour the
  code has; drop the provenance. External references that **are** the durable
  fact — the upstream issue a workaround exists for, a CVE, an RFC — are the
  opposite case: they outlive the MR and stay.

The test: would the comment still be worth reading a year from now, to
someone who never saw the MR? If it only helps someone *reviewing* the
change, move its content to the MR description and delete it.

## When You Write One

The classes above are review findings, but they are also the ones a change
keeps producing, so the moment to apply them is while the comment is being
written. Apply the test before adding it, not after a reviewer reads it:
a comment that argues for the change, or points at the MR that carried it,
goes in the MR description instead.

This is where the policy is most often missed, because a writer has the
argument fresh in mind and the code in front of them — exactly the two things
the next reader will not have.

## One Home Per Fact

A durable fact — a measurement, a spike finding, an external contract, a
version-specific dependency behaviour — lives in **exactly one** place: the
docblock of the owning declaration, the unit's `README.md`, or `docs/*`. For a
fact scoped to one symbol, that symbol's docblock is the natural home — it is
what hover shows. Every other code site carries the one-line consequence and a
pointer to the home, never the fact itself.

A change that duplicates the fact is a finding even when every copy is
currently correct. Nothing keeps N copies in sync but a human remembering, so
the second copy is where the next false claim appears — and it reads as
authoritative, because it sits next to the code.

- The same measurement in three files is **one** finding, not three:
  recommend a single home and pointers from the rest.
- A comment stating the local consequence and linking to the fact is not a
  duplicate. That is the shape being asked for.
- Two docblocks in a row saying the same thing is a copy-paste orphan — an
  edit added the new one and did not delete the old. Report the stale one.
- **A measured number nothing asserts.** A comment stating a contrast ratio,
  a bundle size, a timing, a byte count is a claim that has to reproduce. If
  it matters, assert it in a test; if it cannot be asserted, name the method
  so the next reader can re-derive it. An unasserted number drifts silently
  and is believed anyway.

Comment **volume** is not a metric, and no ratio of comment lines to code
lines is a finding on its own. A mostly-comment module documenting a third
party's misbehaviour can be exactly right, and a sparse one can be all noise.
Count duplicated facts, not lines.

## JSDoc Attaches To A Declaration

A docblock documents whatever declaration follows it. Placed wrong it
documents nothing — and the failure is invisible in a diff, because the prose
reads correctly in review and is simply absent on hover.

- A component's or function's docblock sits on the component, not on its
  props or options interface. Explaining `role="alert"` above
  `interface FooProps` means hovering `Foo` shows nothing.
- A file overview goes **above** the imports. Below them it attaches to the
  first declaration that follows, or to nothing.
- `@param` or `@returns` naming something the signature does not have is a
  defect, not a leftover.

## Scope

This rule is **diff-scoped**: it applies to code and docs touched by the
current change. Repo-wide documentation audits are a periodic maintenance
concern (`skills/maintenance`), not a per-MR gate.

## Relation To Other Surfaces

- `skills/code-review` executes this policy as its documentation-and-comment
  freshness dimension; findings cite this rule.
- A `PostToolUse` hook (`scripts/check_added_comments.py`) prints a reminder
  when an edit adds a comment that argues for the change or points at an MR,
  PR or ticket. It reads the added text only, never blocks, and deliberately
  does not measure comment volume — see the paragraph closing "One Home Per
  Fact".
- This file states policy only — review mechanics live in the skill and its
  fallback runbook.
