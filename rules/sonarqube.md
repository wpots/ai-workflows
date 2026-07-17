# SonarQube / SonarLint parity

Apply when a SonarQube or SonarLint finding is mentioned, and proactively when
writing or editing code that could trip one of the patterns below.

This is the project's opt-in list of SonarQube rules we care about. It lets the
assistant both **avoid introducing** flagged patterns and **apply the preferred
fix** when a finding surfaces — without waiting to be asked each time.

## How this file works

- **One entry per SonarQube rule** we've explicitly opted into — grown one row
  at a time as new findings are approved. Do **not** create a separate rule file
  per suggestion.
- Entries target **production code** (`src/**`, excluding tests, mocks, and
  stories) unless an entry says otherwise.
- To add an entry: capture the SonarQube rule id, a one-line description, the
  preferred fix for this codebase, and a short before/after.
- Shared workflow asset — upstream changes to `ai-workflows` (dual-remote:
  `origin` + `gitlab`) per project convention.

## Patterns

### S6582 — Prefer optional chaining

A null/undefined guard followed by a property access on the same value should
collapse into an optional chain — more concise and easier to read.

**Preferred fix here:** rewrite `a && a.b` as `a?.b`, and the negated guard
`!a || a.b !== x` as `a?.b !== x` (equivalent: when `a` is nullish, `a?.b` is
`undefined`, which is `!== x`). Rely on TypeScript's optional-chain narrowing —
after `if (a?.b !== x) return`, `a` is narrowed to non-null in the fall-through.

```ts
// Avoid — explicit null check then access
if (!session || session.status !== "active") { /* ... */ }

// Prefer — optional chain
if (session?.status !== "active") { /* ... */ }
```

After the change, type-check: the rewrite depends on control-flow narrowing, so
downstream non-null uses of `a` must still compile.
