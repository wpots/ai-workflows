Apply these as the default coding baseline when project-local conventions do not say otherwise.

## TypeScript And React

- Use TypeScript with strict, explicit types.
- Avoid `any`; prefer `unknown`, narrowing, or a real domain type.
- Avoid unsafe `as` assertions; prefer guards, validation, or better typing.
- Prefer `interface` for object contracts and `type` for unions/composition.
- Use named function declarations for exported functions and components.
- Do not use `React.FC`.
- Keep components focused; extract hooks or helpers when logic starts to sprawl.
- Define explicit props types/interfaces for components.
- Prefer composition over deep prop drilling.
- In Next.js projects, default to Server Components and only use `"use client"` for hooks, events, browser APIs, or client-only libraries.
- In Next.js projects, prefer server-side data loading over `useEffect` fetching when a server-rendered path exists.

## Architecture

- Keep presentation thin: rendering and UI state belong in components, not business rules.
- Dependencies flow inward: Presentation -> Application -> Infrastructure -> Domain.
- Presentation can use application-layer APIs and domain types, but not infrastructure directly.
- Domain code stays framework-free and side-effect free.
- Map API, CMS, or database payloads at the boundary before they leak into the UI.

## Avoid

- `any`, unchecked assertions, and anonymous exported APIs.
- Direct fetch, database, or CMS calls inside UI components.
- Components that mix rendering, business logic, and data access.
- Introducing a new styling or component-library pattern that conflicts with project conventions.
- Ignoring `CONVENTIONS.md` or other project-local rules when they exist.
