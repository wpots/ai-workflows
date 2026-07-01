# Copilot Instructions

Use this repository as the single source of truth for shared AI workflows.

## Working Model

- Copilot reliably auto-loads this file, so important coding guidance must live here.
- Reusable workflows live in `commands/`; Copilot prompt wrappers are generated into `.github/prompts/`.
- In synced target projects, `CONVENTIONS.md` overrides this baseline.

## Technical Baseline

<!-- BEGIN SHARED:core-rules -->
Apply these as the default coding baseline when project-local conventions do not say otherwise.

## TypeScript And React

- Use TypeScript with strict, explicit types.
- Treat API payloads, `JSON.parse` results, env vars, database rows, files, queue messages, and third-party library data as untrusted until validated.
- Prefer `unknown` plus narrowing or validation at boundaries over `any` or asserted certainty.
- Avoid broad `as` assertions; prefer guards, validation, or better typing.
- Prefer discriminated unions over loose optional-state objects.
- Convert transport shapes into explicit trusted domain types after validation.
- Prefer `interface` for object contracts and `type` for unions/composition.
- Use named function declarations for exported functions and components.
- Use `const handleToggle = () => {}`-style arrow expressions for local callbacks and event handlers inside components.
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
- Validate and map API, CMS, database, file, and other transport payloads at the boundary before they leak into the UI or domain.

## Avoid

- `any`, unchecked parsing, broad assertions, and anonymous exported APIs.
- Passing raw external payloads straight into domain or UI code.
- Direct fetch, database, or CMS calls inside UI components.
- Components that mix rendering, business logic, and data access.
- Introducing a new styling or component-library pattern that conflicts with project conventions.
- Ignoring `CONVENTIONS.md` or other project-local rules when they exist.
<!-- END SHARED:core-rules -->

## Command Mapping

When user intent matches one of these prompts, read and follow the
corresponding runbook:

<!-- BEGIN SHARED:command-mappings -->
- `create pr`, `open pr`, `submit pr` -> `commands/create-pr.md`
- `commit message`, `write commit`, `git commit` -> `commands/commit-message.md`
- `close sprint`, `sluit sprint af`, `sprint afsluiten` -> `commands/close-sprint.md`
- `sprint demo`, `demo voorbereiden`, `demo script`, `prepare demo` -> `commands/sprint-demo.md`
- `sprint planning`, `plan sprint`, `sprint start`, `start sprint`, `plan komende sprint` -> `commands/sprint-planning.md`
<!-- END SHARED:command-mappings -->

Do not assume command files auto-run. Select and execute them when intent
matches.

## Safety

<!-- BEGIN SHARED:safety -->
- Prefer concrete execution over long planning.
- Do not modify code unless requested.
- Ask before destructive actions (force kill, reset, delete) unless explicitly requested.
- Always summarize what was run and what changed.
<!-- END SHARED:safety -->
