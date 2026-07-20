# Testing Anti-Patterns

**Load this reference when:** writing or changing tests, adding mocks, or tempted to
add test-only methods to production code.

Tests must verify real behavior, not mock behavior. Mocks isolate; they are not the
thing under test. **Core principle:** test what the code does, not what the mocks do.
Strict TDD prevents every anti-pattern below.

## The iron laws

```
1. NEVER test mock behavior
2. NEVER add test-only methods to production code
3. NEVER mock without understanding the dependency
```

## Anti-pattern 1 — testing mock behavior

```tsx
// Bad: asserts the mock rendered, not that the page works
test("renders sidebar", () => {
  render(<Page />);
  expect(screen.getByTestId("sidebar-mock")).toBeInTheDocument();
});
```

You are verifying the mock exists — it tells you nothing about real behavior. The test
passes when the mock is present and fails when it isn't, regardless of the component.

```tsx
// Good: test the real behavior via an accessible role (don't mock the sidebar)
test("renders sidebar", () => {
  render(<Page />);
  expect(screen.getByRole("navigation")).toBeInTheDocument();
});
```

**Gate:** before asserting on any mock element, ask "am I testing real behavior or just
mock existence?" If existence → delete the assertion or unmock the component.

## Anti-pattern 2 — test-only methods in production

```ts
// Bad: destroy() exists only so tests can clean up — looks like a real API
class Session {
  async destroy() {
    await this._workspaceManager?.destroyWorkspace(this.id);
  }
}
```

Production code polluted with test-only surface, dangerous if called for real, violates
YAGNI. Put lifecycle cleanup in test utilities instead:

```ts
// Good: test-utils/ owns test cleanup; Session stays stateless in production
export async function cleanupSession(session: Session) {
  const workspace = session.getWorkspaceInfo();
  if (workspace) await workspaceManager.destroyWorkspace(workspace.id);
}
// in tests: afterEach(() => cleanupSession(session));
```

**Gate:** before adding a method to a production class, ask "is this only used by
tests?" If yes → put it in test utilities. Then ask "does this class own this
resource's lifecycle?" If no → wrong class.

## Anti-pattern 3 — mocking without understanding

Don't stub a module until you know what it actually returns and which of its behaviors
the code under test depends on. A mock that returns the wrong shape gives you a green
test over broken code. Prefer the real implementation; reach for MSW / a fake at the
network boundary rather than mocking your own modules. When you must mock, mock the
edge (fetch, time, randomness), not your own domain logic.

**Gate:** before writing a mock, ask "do I understand what the real dependency returns
and why the code needs it?" If no → read the dependency first.

## Relationship to project policy

This file covers process pitfalls. `rules/testing.md` covers the Jest-vs-Storybook
split, Testing Library query priority, and coverage thresholds. When they seem to
conflict, the rule wins on *what/where*; this file wins on *how you build the test*.
