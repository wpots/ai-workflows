---
tags: [component-spec, runnable]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "A comprehensive markdown spec for an accessible Text Input component covering props with TypeScript types, controlled and uncontrolled behavior, WCAG references, ARIA requirements such as aria-invalid and aria-describedby, keyboard behavior, screen reader behavior, error state handling, recommended file structure, Storybook coverage, usage examples, testing guidance, and open questions."
---

I'm building an accessible React component library in TypeScript. We already have a Button. Can you write a spec for the Text Input component? We use react-aria and the project's rules live in CONVENTIONS.md plus rules/accessibility.md. Output as a markdown file.
