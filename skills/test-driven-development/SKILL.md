---
name: test-driven-development
description: Drive any feature or bugfix test-first through a strict RED-GREEN-REFACTOR cycle — write the failing test, watch it fail for the right reason, write minimal code to pass, then refactor. Use when implementing a feature, fixing a bug, or changing behavior before writing implementation code, or when the user asks for TDD / "test eerst" / "schrijf eerst een test". Adapted from obra/superpowers.
---

# Test-Driven Development (TDD)

Write the test first. Watch it fail. Write the minimal code to pass. Then refactor.

**Core principle:** if you did not watch the test fail, you do not know whether it
tests the right thing.

This skill owns the *process*. It does NOT redefine *what* to test or *where* —
that policy lives in `rules/testing.md` (Jest vs Storybook split, Testing Library
query priority, coverage thresholds). Load that rule first, then follow this cycle.

## When to use

**Always:** new features, bug fixes, refactoring, behavior changes.

**Exceptions (ask the user first):** throwaway prototypes, generated code,
configuration files.

Thinking "skip TDD just this once"? Stop. That is a rationalization — see the table below.

## Project test command

Never hardcode a runner. Resolve the command once per run:

1. Read the project's `CLAUDE.md` / `rules/testing.md` for the test command.
2. If missing, check `package.json` scripts (`test`, `test:watch`, `test:functions`).
3. If still ambiguous, AskUserQuestion and persist the answer to `CLAUDE.md`.

The default Greenberry stack (per `rules/testing.md`):

```bash
npm test                 # all tests
npm run test:watch       # watch mode — the natural TDD driver
npm run test:functions   # utils/lib/hooks only (100% enforced)
```

Run the single test file while iterating, not the whole suite, e.g.
`npm test -- path/to/thing.test.tsx`.

## The Iron Law

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

Wrote code before the test? Delete it. Start over from the test.

**No exceptions:** don't keep it "as reference", don't "adapt" it while writing the
test, don't look at it. Delete means delete. Implement fresh from the test.

## RED → GREEN → REFACTOR

### RED — write one failing test

One behavior, clear name, real code (mock sparingly — see `rules/testing.md` and
`testing-anti-patterns.md`). Follow the Arrange–Act–Assert shape and the Testing
Library query priority (`getByRole` first, `getByTestId` last resort).

```tsx
// Good: one behavior, clear name, tests real behavior via role
test("disables submit until the form is valid", async () => {
  render(<SignupForm />);
  expect(screen.getByRole("button", { name: /sign up/i })).toBeDisabled();

  await userEvent.type(screen.getByLabelText(/email/i), "a@b.nl");

  expect(screen.getByRole("button", { name: /sign up/i })).toBeEnabled();
});
```

```tsx
// Bad: vague name, asserts on a mock instead of behavior
test("form works", () => {
  render(<SignupForm />);
  expect(screen.getByTestId("submit-mock")).toBeInTheDocument();
});
```

### Verify RED — watch it fail (MANDATORY, never skip)

Run the test. Confirm:

- it **fails**, not **errors** (a stack trace / typo is not a real RED);
- the failure message is the one you expected;
- it fails because the behavior is missing, not because of a typo or bad import.

Test passes immediately? You are testing behavior that already exists — fix the test.
Test errors? Fix the error and re-run until it fails *correctly*.

### GREEN — minimal code to pass

Simplest thing that turns the test green. No extra options, no speculative
abstraction, no "while I'm here" improvements. YAGNI.

Then run the test again and confirm: it passes, **other tests still pass**, and the
output is pristine (no warnings, no `act()` noise, no console errors).

Test still fails? Fix the code, not the test. Other tests broke? Fix them now.

### REFACTOR — clean up on green only

Remove duplication, improve names, extract helpers. Keep every test green. Do not add
behavior in this step. Re-run to stay green, then move to the next failing test.

## Good tests

| Quality | Good | Bad |
|---|---|---|
| Minimal | One thing. "and" in the name? Split it. | `test("validates email and domain and whitespace")` |
| Clear | Name describes the behavior | `test("test1")` |
| Shows intent | Demonstrates the desired API | Obscures what the code should do |
| Real behavior | Drives the component/hook/util | Asserts that a mock rendered |

## Common rationalizations

| Excuse | Reality |
|---|---|
| "Too simple to test" | Simple code breaks. The test takes 30 seconds. |
| "I'll test after" | Tests written after pass immediately and prove nothing. |
| "Already manually tested" | Ad-hoc ≠ systematic. No record, can't re-run. |
| "Deleting X hours is wasteful" | Sunk cost. Keeping unverified code is the real debt. |
| "Keep it as reference" | You'll adapt it — that's testing after. Delete means delete. |
| "Need to explore first" | Fine. Throw the spike away, restart with TDD. |
| "Hard to test" | Listen to the test: hard to test = hard to use. Simplify the design. |
| "TDD will slow me down" | TDD is faster than debugging in production. |
| "Existing code has no tests" | You're improving it — add tests for the code you touch. |

## Red flags — STOP and start over

Code before test · test after implementation · test passes immediately · can't
explain why the test failed · "I'll add tests later" · "I already manually tested it"
· "keep as reference" · "this case is different because…".

All of these mean: delete the code, start over from a failing test.

## Bug-fix flow

A bug is a missing test. Reproduce it with a failing test first, then fix.

```tsx
// RED — reproduce the bug
test("rejects an empty email", async () => {
  const result = await submitForm({ email: "" });
  expect(result.error).toBe("E-mailadres is verplicht");
});
```

Verify it fails, write the minimal validation to pass, verify green. The test proves
the fix and guards against regression. Never fix a bug without a test.

## Verification checklist

Before claiming the work is done:

- [ ] Every new function/hook/component has a test
- [ ] You watched each test fail before implementing
- [ ] Each test failed for the expected reason (behavior missing, not a typo)
- [ ] You wrote minimal code to pass each test
- [ ] All tests pass and output is pristine (no warnings)
- [ ] Tests use real code; mocks only where unavoidable
- [ ] Edge cases and error paths covered
- [ ] Coverage thresholds in `rules/testing.md` are met (100% on utils/lib/hooks)

Can't tick every box? You skipped TDD. Start over.

## When stuck

| Problem | Solution |
|---|---|
| Don't know how to test it | Write the wished-for API in the test first. Ask the user. |
| Test too complicated | The design is too complicated. Simplify the interface. |
| Must mock everything | Code is too coupled. Inject dependencies. |
| Test setup is huge | Extract test helpers; if still complex, simplify the design. |

## References

- `rules/testing.md` — what to test in Jest vs Storybook, query priority, coverage.
- `testing-anti-patterns.md` (this folder) — load when adding mocks or test-only code.
