---
name: scaffold-component
description: Create a new React component with the correct file structure, templates, and project conventions. Use when the user asks to create a new component, scaffold a component, or generate component boilerplate.
---

# Scaffold Component Skill

Use this skill when the user asks to create or scaffold a new React component.

## Inputs

Ask the user if not provided:

1. **Component name** — PascalCase (e.g. `UserCard`)
2. **Location** — `components/ui/`, `components/features/`, or custom path
3. **Files to generate** — default: all four below

## Files to Generate

| File                 | Always?                 |
| -------------------- | ----------------------- |
| `[Name].tsx`         | Yes                     |
| `index.ts`           | Yes                     |
| `[Name].test.tsx`    | Optional (default: yes) |
| `[Name].stories.tsx` | Optional (default: yes) |

## Conventions

- `function` keyword for the exported component — no arrow function, no `React.FC`
- Props interface exported from `index.ts`, not defined in the component file
- Use `@/` path aliases — never relative paths
- Component stays under 200 lines
- No `React.memo` or `useCallback` without explicit justification

## Constraints

- Create files only — do not modify existing files unless asked.
- List created file paths in the output.
- Do not add placeholder comments beyond minimal structure.
