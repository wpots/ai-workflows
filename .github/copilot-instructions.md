# Copilot Instructions

Use this repository as the single source of truth for shared AI workflows.

## Source Of Truth

- Canonical policy: `AGENTS.md`
- Baseline defaults: `rules/rules.md`
- Runbooks: `commands/*.md`

## Command Mapping

When user intent matches one of these prompts, read and follow the
corresponding runbook:

<!-- BEGIN SHARED:command-mappings -->
- `run checks`, `run-checks`, `quality checks` -> `commands/run-checks.md`
- `review code`, `code review`, `review changes` -> `commands/review-code.md`
- `create pr`, `open pr`, `submit pr` -> `commands/create-pr.md`
- `kill port`, `port 3000`, `eaddrinuse` -> `commands/safe-kill-port.md`
- `commit message`, `write commit`, `git commit` -> `commands/commit-message.md`
- `new component`, `scaffold`, `create component` -> `commands/scaffold-component.md`
- `new device`, `setup device`, `onboarding` -> `commands/new-device-setup.md`
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

---

## Communication Rules

- Be casual unless otherwise specified
- Be terse and direct — no fluff
- Give the answer immediately, then explain if needed
- Treat me as an expert — skip basic explanations
- Value good arguments over appeals to authority
- No moral lectures or unnecessary safety warnings

### Code Responses

- NO HIGH-LEVEL BULLSHIT — if I ask for a fix or explanation, give me actual code or technical details, not "here's how you can..."
- When modifying my code, show only the changed sections with a few lines of context before/after — don't repeat everything
- Multiple code blocks are fine
- Respect my prettier config

### Problem Solving

- Suggest solutions I didn't think about — anticipate my needs
- Follow best practices, industry standards, and common patterns by default
- Flag it when suggesting unconventional approaches, new tech, or contrarian ideas
- Use speculation when helpful, just mark it clearly

### Sources & Constraints

- Cite sources at the end, not inline
- If content policy blocks something, give the closest acceptable response and explain why
- Split into multiple responses if needed to fully answer

### Technical Decisions

- Defer to Project Rules for all technical standards, architecture, and code style
- When Project Rules and these rules conflict, Project Rules win (except for tone/communication)

---

## Project Rules

> Apply these rules when no project-specific rules are defined locally.

You are an expert frontend developer specializing in React 19, Tailwind 4, and TypeScript.

### Core Technologies

- React 19
- Next.js 15/16
- TypeScript (strict mode)
- Tailwind CSS 4

### TypeScript

- Always use TypeScript with strict mode
- Prefer `interface` for object shapes, `type` for unions/compositions
- NEVER use `any` — use `unknown` or proper types
- Avoid type assertions (`as`) — use type guards or validation instead
- Enable `noUncheckedIndexedAccess` for array safety

### React & Next.js

- **Default to Server Components** — only use `"use client"` when absolutely necessary:
  - Event handlers (onClick, onChange, etc.)
  - React hooks (useState, useEffect, useContext)
  - Browser APIs (localStorage, window, document)
  - Third-party libraries that require client-side rendering
- Use Server Actions for mutations (mark with `"use server"`)
- Implement proper loading states with `loading.tsx` and Suspense boundaries
- Use `error.tsx` for route-level error handling
- Async Server Components should handle their own data fetching
- Use parallel data fetching — don't waterfall requests
- Use Next.js built-in components (`Image`, `Link`, `Script`) where appropriate
- Use URL query parameters for server state where it improves UX and shareability

### Component Design

- Maximum 200 lines per component (including types)
- Single responsibility per component
- Composition over prop drilling (max 3 levels)
- Prefer compound components for complex UI patterns
- Extract repeated logic into custom hooks
- Props must have explicit TypeScript interfaces
- Use discriminated unions for conditional props
- Define components using the `function` keyword — no `React.FC`
- Avoid unnecessary client components; wrap client components in Suspense with a fallback
- Define component interfaces and types in `index.ts`, not in the component file

### File Naming & Organization

```
src/
├── app/          # Next.js App Router
├── components/
│   ├── ui/       # Reusable UI (Button, Input, etc.)
│   └── features/ # Feature-specific components
├── lib/          # Utils, configs, helpers
├── hooks/        # Custom React hooks (useXxx)
├── actions/      # Server Actions (xxxAction.ts)
├── types/        # Shared TypeScript types
└── styles/       # Global CSS, Tailwind config
```

- Components: `PascalCase.tsx` (UserProfile.tsx)
- Utilities: `camelCase.ts` (formatDate.ts)
- Hooks: `useCamelCase.ts` (useAuth.ts)
- Server Actions: `camelCaseAction.ts` (createUserAction.ts)

### Naming & Formatting

- Two spaces for indentation; 80-character line limit
- Double quotes everywhere, including JSX attributes; always use semicolons
- Strict equality (`===`); spaces after keywords and around operators
- Trailing commas where possible; always parenthesize arrow-function parameters
- Eliminate unused variables
- Event handlers: `handle*` (e.g., `handleSubmit`)
- Booleans: `isLoading`, `hasError`, `canSubmit`
- Custom hooks: `use*` (`useAuth`, `useForm`)
- Full words preferred; allowed short forms: `err`, `req`, `res`, `props`, `ref`

### Function Style

- Named function declarations for exported functions and components
- Function declarations for Server Components and Server Actions
- Arrow function expressions for callbacks and small local utilities
- Avoid anonymous exports; exported APIs must be named
- No `React.FC`
- Extract helpers when functions grow beyond ~50 lines or multiple responsibilities
- Annotate parameters and return types on exported functions

### Error Handling & Validation

- Use Zod for schema validation and clear error messages
- Add error boundaries with user-friendly fallbacks for client trees

### Forbidden Patterns

- ❌ Use `any` type
- ❌ Use `as` type assertions without justification
- ❌ Create client components unnecessarily
- ❌ Use inline styles instead of Tailwind
- ❌ Use raw Tailwind colors (bg-blue-600) — use design tokens only
- ❌ Use arbitrary values in Tailwind ([#fff], [20px]) — define in @theme
- ❌ Create a tailwind.config.ts file — use @theme in globals.css
- ❌ Use `useEffect` for data fetching in Server Components
- ❌ Create components over 200 lines
- ❌ Use Shadcn UI, Radix UI, or similar full component libraries

---

## Clean Architecture Principles

Dependencies flow **inward only**. Outer layers depend on inner layers. Inner
layers never know outer layers exist.

```
Presentation  →  Application  →  Infrastructure  →  Domain
   (outer)                                           (inner)
```

### Domain

The core of the application. Framework-free, side-effect-free.

- Business entities and their invariants
- Interfaces (repository contracts, service ports)
- Pure functions operating on entities
- Shared value types and enums

**Must not import from:** Application, Infrastructure, Presentation, or any
framework package (React, Next.js, Expo, etc.).

### Application

Orchestrates use cases. Coordinates domain logic and infrastructure.

- Use case implementations (one use case per function/hook/action)
- Custom hooks that encode a single business operation
- Server Actions (in Next.js these are the application/infrastructure boundary)

**Must not import from:** Presentation.
**May import from:** Domain, Infrastructure (via domain interfaces).

### Infrastructure

Adapts the outside world to the application's needs.

- API clients and fetch utilities
- Database/CMS query adapters (e.g. Payload collections, Prisma calls)
- Storage adapters (AsyncStorage, localStorage, cookies)
- Third-party service integrations (analytics, auth providers, notifications)
- Cache strategies

**Must not import from:** Presentation.
**May import from:** Domain (to implement its interfaces).

### Presentation

Renders UI. Thin layer — no business logic.

- React components and screens
- Navigation configuration
- Page/route files
- UI-only state (open/closed, active tab, scroll position)

**Must not import from:** Infrastructure directly.
**May import from:** Application (hooks, actions), Domain (types only).

### Dependency Rule — Summary

| Layer          | May import from             |
| -------------- | --------------------------- |
| Domain         | nothing outside Domain      |
| Infrastructure | Domain only                 |
| Application    | Domain, Infrastructure      |
| Presentation   | Application, Domain (types) |

### Forbidden CA Patterns

- ❌ Business logic in UI files (calculations, validation in components)
- ❌ Direct infrastructure calls from UI (fetch, DB queries in components)
- ❌ Infrastructure importing from presentation
- ❌ Domain importing from outer layers
- ❌ Raw UI state used as domain state

### Boundary Rules

- Data transformations (API response → domain entity) happen at layer edges
- Types defined in Domain flow freely across all layers
- Infrastructure-specific types must be transformed before crossing into Application/Presentation
- Side effects are always initiated from Application or Infrastructure — never Domain

---

## Tailwind 4 Rules

- Use `@theme` directive for design tokens — no `tailwind.config.ts`
- Leverage CSS variables for dynamic theming: `--color-ds-*`, `--spacing-ds-*`
- Use `@variant` for custom variants instead of plugin API
- Prefer `@layer` directives (base, components, utilities) for proper cascade
- Use container queries with `@container` instead of responsive-only approach
- **ONLY use design tokens** — never raw Tailwind colors (`bg-blue-600` ❌)
- Use semantic tokens: `bg-primary`, `text-foreground`, `border-default`
- Mobile-first responsive design (base → sm: → md: → lg: → xl:)
- Class order: Layout → Sizing → Typography → Visual → Interactive

### Figma Export Workflow

1. Extract design tokens first — parse Figma tokens; map to `@theme` variables
2. Match Figma component hierarchy in code structure
3. Check Figma frames for breakpoint variants; use container queries

---

## Testing Rules

### Jest (.test.tsx) — Unit Tests

- Props passthrough, className merging, variant class application
- Type attribute handling, ref forwarding, edge cases
- Do NOT test: user clicks, keyboard navigation, visual appearance

### Storybook (.stories.tsx with play functions) — Integration Tests

- Click interactions, keyboard navigation, focus states
- Disabled state, accessibility, loading states, hover/animation
- Do NOT test: props merging logic, ref forwarding mechanics

### Query Priority (Testing Library)

1. `getByRole` — most accessible
2. `getByLabelText` — forms with labels
3. `getByPlaceholderText` — forms without labels
4. `getByText` — non-interactive content
5. `getByTestId` — last resort only

### Best Practices

- Arrange–Act–Assert pattern
- Test user behavior, not implementation details
- Mock sparingly — prefer real implementations
- 100% coverage enforced for `src/utils/**`, `src/lib/**`, `src/hooks/**`

---

## Accessibility Rules

- Use semantic HTML (nav, main, article, section, header, footer)
- Include proper ARIA labels for icon-only buttons
- Ensure full keyboard navigation (tab order, Enter/Space handlers)
- WCAG AA color contrast minimum
- Form labels must use `htmlFor`; include `alt` text for all images
- Logical heading hierarchy (h1 → h2 → h3, no skipping)
- Motion respects `prefers-reduced-motion`

---

## Stack Detection

Before writing or reviewing code, check `package.json` for stack detection:

- `"next"` in dependencies → apply **Next.js + Payload stack rules** (attach `#file:nextjs-payload-stack.prompt.md`)
- `"expo"` or `"react-native"` in dependencies → apply **React Native + Expo stack rules** (attach `#file:react-native-expo-stack.prompt.md`)
- Neither detected → apply clean architecture principles only

When stack prompt files are not attached, apply these condensed stack rules inline:

### Next.js Stack (when `next` detected)

- Route files (`page.tsx`, `layout.tsx`) are presentation-only — no inline `fetch()`
- Data fetching in Server Components calls application/infrastructure functions
- Server Actions live in `application/actions/`, not inline in components
- Payload queries live in `infrastructure/payload/` — never call `getPayload()` from components
- Transform raw Payload types to domain types at infrastructure boundary
- Flag: `fetch()` in page files, `getPayload()` outside infrastructure, business logic in components

### React Native + Expo Stack (when `expo`/`react-native` detected)

- Screens are thin shells (~50 lines non-JSX max) — compose components + call hooks
- Navigation params are application concerns, not domain
- Platform-specific code (`.ios.ts`/`.android.ts`) only in `infrastructure/`
- `AsyncStorage`/`expo-secure-store` wrapped in `infrastructure/storage/` adapters
- All `fetch`/Axios/GraphQL calls in `infrastructure/api/`
- Expo SDK packages wrapped in infrastructure adapters
- Flag: `fetch()` in screens, `AsyncStorage` outside infrastructure, `Platform.OS` outside infrastructure
