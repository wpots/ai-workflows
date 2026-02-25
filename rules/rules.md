# Rules Index

This directory contains focused rule files. Load the relevant file(s) for the current context.

| File               | Covers                                               |
| ------------------ | ---------------------------------------------------- |
| `communication.md` | Tone, response style, problem-solving approach       |
| `project.md`       | React, Next.js, TypeScript, component design, naming |
| `tailwind.md`      | Tailwind 4, design tokens, Figma export workflow     |
| `testing.md`       | Jest + Storybook split, query priority, coverage     |
| `accessibility.md` | WCAG requirements, ARIA, keyboard navigation         |

## Loading Priority

1. Load `communication.md` always — baseline behavior.
2. Load `project.md` when no project-local rules exist.
3. Load `tailwind.md` when working on styles or design tokens.
4. Load `testing.md` when writing or reviewing tests.
5. Load `accessibility.md` when building interactive UI components.

## Conflict Resolution

- Project-local rules always win over these baseline rules.
- `communication.md` wins over project rules only for tone and response style.
