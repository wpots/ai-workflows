# Testing Rules

## Browser Verification: Choose By Purpose

Choose the verification method from the task and the tools available in the
current session, before installing tooling or writing a script.

| Purpose | Preferred method |
| --- | --- |
| One-off layout check, screenshot, interaction check, or bug reproduction | Available native browser control; reuse a suitable tab/session |
| One-off browser check without native browser control | Existing browser MCP, such as Chrome DevTools or Playwright MCP |
| Repeatable regression, CI, or a route/viewport/browser matrix | Existing project test runner; Playwright where the project uses it |
| Structured audit requiring results a browser tool cannot provide | Existing audit/test tooling; add a script only for the missing capability |

- Honor a browser or tab named by the user. In Codex desktop, prefer the
  built-in browser for localhost/public pages; use a connected browser when
  the task requires its signed-in session. In CLI/IDE environments, choose
  from the browser tools actually exposed there.
- Native browser control and Playwright MCP both perform interactive checks;
  they are distinct from launching a standalone Playwright script or suite.
  An installed Playwright dependency is not a reason to choose the latter.
- For a one-off check, reuse available browser control before creating a
  temporary script, installing packages, or launching another browser.
  If a required capability is missing, state that reason briefly and use
  the smallest fallback that can verify the result.
- Run required project checks and preserve regression coverage. A browser
  spot-check complements automated tests; it does not replace them.
- Report the route/scenario checked, the observed result, and any unverified
  requirement. Only report an automated test as passed when it actually ran.

## Philosophy

Split tests into two complementary approaches:

### Jest (.test.tsx)

Fast, automated unit tests for:

- Props passthrough to underlying elements
- Custom className merging with base classes
- Type attribute handling (submit, reset, button)
- Integration with utility components (Slot, etc.)
- Variant class application (smoke tests)
- Custom HTML attributes (data-_, aria-_)
- Ref forwarding
- Edge cases (undefined props, null children, etc.)

Do NOT test in Jest: user clicks, keyboard navigation, visual appearance, a11y audits, focus states.

### Storybook (.stories.tsx with play functions)

Visual and interaction testing for:

- Click interactions (`userEvent.click`)
- Keyboard navigation (Tab, Enter, Space)
- Focus states and management
- Disabled state verification
- Accessibility (aria-labels, roles, screen reader text)
- Loading states with visual feedback
- Hover states and animation behaviors
- Visual regression (Chromatic or Percy)

Do NOT test in Storybook: props merging logic, ref forwarding mechanics, edge cases with unusual prop combos, internal utility behavior.

## Query Priority (Testing Library)

1. `getByRole` — most accessible (buttons, links, headings)
2. `getByLabelText` — forms with labels
3. `getByPlaceholderText` — forms without labels
4. `getByText` — non-interactive content
5. `getByTestId` — last resort only

## Best Practices

- Arrange–Act–Assert pattern
- Test user behavior, not implementation details
- Mock sparingly — prefer real implementations
- Aim for 100% coverage on critical paths and business logic
- New comments in test files follow `documentation.md` — neighbouring suites
  set the density register, and a comment carrying the claim an assertion
  cannot make is a test-design smell, not documentation

## Coverage Requirements

Coverage is **risk-based**: enforce a floor where product risk lives, not a
blanket target over the safest code. Concrete per-path thresholds live in the
project's test config (e.g. `jest.config.ts`); this rule defines the policy they
must follow.

- **Pure-logic layer — strict 100%.** Framework-free units (`src/utils`,
  `src/lib`, `src/hooks`, or their equivalents) stay at 100% on all metrics.
- **Risk-bearing areas — enforced floors.** Authentication/sessions, server
  actions, data/collection hooks, roles/access control, and scheduled jobs each
  get a minimum floor, set just below measured reality so the policy lands green
  without new tests.
- **Declarative config — measured, no floor.** CMS collections/fields/blocks/
  globals and similar declarative config are collected for visibility but not
  enforced.
- **Ratchet rule.** Floors may only be raised over time, never lowered. When
  coverage rises, raise the floor to just below the new reality in the same MR
  that adds the tests — never lower a floor to make a change land.

**jest gotcha:** a *directory-path* `coverageThreshold` key is enforced against
the **aggregate** of all files beneath it, but a *glob* key (containing `*`) is
enforced **per file**. Use directory-path keys for area floors — a single
low-coverage file otherwise fails a per-file glob floor.

**Coverage exemptions require a written reason.** An istanbul ignore must state
why on the same line, and be used sparingly — only for code that genuinely can't
run under the test runner, or has no executable logic to cover. Prefer a narrow
`/* istanbul ignore next -- reason */` over a whole-file ignore.

```ts
/* istanbul ignore file -- next/font loaders can't run under jest (vercel/next.js#55616) */
```

## Commands

```bash
npm test                      # full suite — the coverage gate above
npm run test:watch            # watch mode
npm run test:functions        # fast: pure-logic tests only, no coverage
npm run test:components       # fast: component tests only, no coverage
npm run storybook             # start Storybook
npm run test-storybook        # run Storybook play functions in CI
```

The split scripts are for fast focused iteration and skip coverage; `npm test`
is the enforcement gate. The pure-logic layer typically only reaches 100% under
the full suite (some helpers are covered via component/integration tests), so a
functions-only run can't enforce 100% on its own.
