# Testing Rules

## Browser Verification: Choose By Purpose

Choose the verification method from the task and the tools available in the
current session, before installing tooling or writing a script.

| Purpose | Preferred method |
| --- | --- |
| One-off layout check, screenshot, interaction check, or bug reproduction | Available native browser control; reuse a suitable tab/session |
| One-off browser check without native browser control | In Claude Code, the `browser-verifier` subagent; elsewhere, a browser MCP server the session already has |
| Repeatable regression, CI, or a route/viewport/browser matrix | Existing project test runner; Playwright where the project uses it |
| Structured audit requiring results a browser tool cannot provide | Existing audit/test tooling; add a script only for the missing capability |

- Honor a browser or tab named by the user. In Codex desktop, prefer the
  built-in browser for localhost/public pages; use a connected browser when
  the task requires its signed-in session. In CLI/IDE environments, choose
  from the browser tools actually exposed there.
- In Claude Code, the main session holds no browser MCP server. A browser MCP
  in the main session keeps its Chrome running for as long as the session is
  open, idle or not. The `browser-verifier` subagent (`~/.claude/agents/`,
  installed by the ai-workflows ambient sync) starts its own headless Chrome and stops it when it
  finishes. Hand it the URLs and states to check; it reports what it saw.
- Native browser control and a browser MCP server both perform interactive
  checks; they are distinct from launching a standalone Playwright script or
  suite. An installed Playwright dependency is not a reason to choose the
  latter.
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

Storybook holds the WCAG and interaction evidence, and the visual record of the
design. A review checks that the right use cases are there:

- **Every reachable state has a story.** The a11y addon scans what a story
  renders, so an open, error, disabled, loading, empty or long-text state
  without a story is never audited. A story that switches its a11y test off
  needs an owner and a follow-up.
- **Every interaction has a `play` function**: click (`userEvent.click`),
  keyboard operation (Tab, Enter, Space, Escape, arrows), focus movement and
  restoration, accessible names and states (`aria-expanded`, `aria-current`,
  disabled), loading feedback. Query by role and assert the behaviour.
- **One story per design variant**, named as in the design.
- **Every visual acceptance criterion maps to a story**: grows with its content
  or keeps a maximum width and stays centred; long title, long unbroken word,
  missing optional field, one item, many items; mobile, tablet, desktop and
  reflow widths. A visual story needs no `play` (Test Value gate below).
- **Page and template stories show composition.** They never replace a
  component's or module's own stories.
- Hover states and animation behaviour; visual regression (Chromatic or Percy)
  where the project runs it.

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

## Test Value — Writing And Review Gate

Before adding or retaining an assertion in changed tests, identify the
requirement or concrete regression it protects and the observable failure
that would make it fail. Test count and coverage alone do not answer this.

- **Legitimate-change check.** If changing a spacing token, palette, radius,
  container width or markup wrapper would break the assertion while the
  required behaviour still works, remove or reframe it. Exact CSS values and
  copied utility lists need an explicit product requirement, not merely a
  matching implementation. A Figma measurement or token value alone is not
  an immutable behaviour requirement. Visual stories can exist without a
  `play` test.
- **Keep risk-bearing checks.** Keyboard operation, focus movement, native
  form submission, accessible names/states, minimum agreed target size,
  reflow, reduced motion and forced-colour usability are observable contracts.
  Assert the constraint, not an incidental colour, stroke width or class.
- **Test at the owner.** Verify a shared component's contract there. Its
  consumers test their composition and behaviour; repeating every shared
  styling assertion in every consumer adds maintenance without new evidence.
- **Fail when the prerequisite disappears.** Query required elements with
  throwing queries, or assert their presence. `if (element)` or
  `if ("required" in field)` around the only assertions can silently pass
  after the feature disappears. Type narrowing must have a failing branch.
- **Avoid tautologies.** Repeating a style/config object or a fixture's own
  constants as the expected result does not demonstrate useful behaviour.
  Public option/attribute passthrough remains useful when it protects a real
  caller contract; a small variant smoke test need not enumerate utilities.
- **Investigate flaky tests.** Preserve the failing evidence and determine
  whether the cause is product behaviour, test setup or environment. A green
  retry is not a fix. Do not add sleeps, widen timeouts, disable assertions or
  lower coverage gates just to get green.

During review, missing coverage and low-value/brittle coverage are both
findings. Give the requirement and the smallest correction; do not replace
every deleted styling check with a new test. During a periodic test-plan
audit, apply the same gate to the selected inventory and report uninspected
areas explicitly.

## Test Data

- Tests, fixtures, stories and seeds use synthetic data, never customer or
  production data. A production dump stays local: never in the repository, a
  fixture, a story or a seed.
- A token or secret a test needs comes from the project's secret store
  (`dotenvx`, an env file outside git), never from a fixture or another
  committed file.

## Fixtures Belong To Their Owner

- Each component, module and template owns one fixture file next to it, such as
  `<Name>.mocks.ts` exporting `<name>Mock`. Its stories, its tests and every
  consumer import from there.
- A consumer reuses the owner's fixture for what it renders: a template that
  renders rich text imports the rich text component's fixture. A local copy of
  another component's props drifts, because a change to the owner's fixture
  never reaches it. In review, that copy is a finding.
- A consumer may spread an owner's fixture and override the fields its own
  scenario needs.

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
