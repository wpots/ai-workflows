---
name: component-spec
description: "Accessible Component Spec"
---

# Accessible Component Spec

Write a production-ready specification for an accessible React component that
matches this project's conventions.

## Context To Load

Before writing, read:

1. `CONVENTIONS.md`
2. `rules/accessibility.md`
3. `rules/testing.md`
4. The relevant stack prompt/rule if the project stack is ambiguous
5. Existing component files if the component already exists

## Inputs

Confirm only what you genuinely cannot infer:

- **Component name** - required
- **Output path** - if the user wants a persisted file and does not specify a
  location, default to `docs/specs/<component-name>.spec.md`
- **Known constraints** - existing API, design tokens, react-aria primitive,
  controlled vs uncontrolled behavior, grouped usage, etc.

Do not interrogate the user. Infer from the repo first.

## Workflow

1. Understand the component's role in the system.
2. Identify meaningful modes or variants.
3. Surface unresolved decisions naturally while writing.
4. Collect unresolved items in an `Open Questions` section using `- [ ]`.
5. If the user answers later, update the relevant sections and mark resolved
   questions as `- [x]`.

## Output Requirements

- Default to Markdown.
- Write implementation-ready guidance, not vague principles.
- Use tables where they improve scanning.
- Include concrete ARIA and keyboard behavior.
- Prefer React Aria patterns when they fit the component and project
  conventions.
- Do **not** claim that every public component must have a spec doc unless the
  project rules explicitly say so.

## Spec Structure

Use the sections below. Adapt depth to the component; do not pad.

### Overview

One short paragraph covering:

- what the component is
- what problem it solves
- where it sits in the component hierarchy
- where it is expected to be used

### Recommended File Structure

Recommend the implementation files needed for this component. Include only the
files that make sense for the request. Typical examples:

```text
ComponentName/
├── index.ts
├── ComponentName.tsx
├── types.ts
├── ComponentName.stories.tsx
├── ComponentName.test.tsx
└── ComponentName.mocks.tsx
```

If the user asked for a persisted spec, include the chosen spec file path as a
documentation output, not as a universal project rule.

### Modes Or Variants

Document meaningfully different modes separately. For each mode, explain:

- when to use it
- required and forbidden props
- accessibility-tree impact
- visual or behavioral differences

### Props

Provide a table:

`Prop | Type | Default | Required | Description`

Call out conditional requirements explicitly.

#### Prop Validation

Explain both layers when relevant:

- **TypeScript**: discriminated unions, `never`, shared props
- **Runtime**: development-only warnings for invalid combinations that TS
  cannot enforce for every consumer

### Accessibility Requirements

Cover:

- relevant WCAG criteria with short component-specific reasoning
- ARIA roles, attributes, and states
- labeling strategy
- grouping patterns such as `fieldset`/`legend`, `tablist`, `radiogroup`, etc.
- live regions or status announcements when applicable
- color contrast and non-color communication
- touch targets
- zoom/reflow expectations
- reduced-motion behavior
- high-contrast / forced-colors considerations when applicable

### Keyboard Behavior

Provide a table:

`Key | Action`

If the component is not interactive, say so explicitly.

### Screen Reader Behavior

Provide a table:

`Scenario | Expected announcement`

Cover:

- initial focus
- default and changed states
- disabled / invalid / loading states when applicable
- hidden or decorative elements

### Storybook Coverage

List the stories needed to verify the component well. Include interactive,
error, disabled, responsive, and accessibility-sensitive states when relevant.

### Testing Plan

Split the plan by test type:

- **Jest** for unit-level contracts, prop behavior, and edge cases
- **Storybook/play** for interaction, keyboard flow, focus behavior, and a11y
  verification
- **Manual checks** for screen reader, high-contrast/forced-colors, and 400%
  zoom on complex components

Mention `axe-core`, Storybook a11y checks, and `eslint-plugin-jsx-a11y` when
they apply.

### Usage Examples

Provide concise TSX examples for the most important usage patterns.

### Implementation Notes

Call out project-specific choices such as:

- React Aria primitives to use
- likely component composition
- risky edge cases
- fallback behavior

### Open Questions

End with unresolved questions only. Keep them concrete and decision-oriented.
