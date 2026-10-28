# Project Rules

> Apply these rules when no project-specific rules are defined locally.

## Core Technologies

React 19, Next.js 15/16, TypeScript in strict mode, Tailwind CSS 4.

## TypeScript

- Strict mode, with `noUncheckedIndexedAccess` for array safety
- Prefer `interface` for object shapes, `type` for unions/compositions
- NEVER use `any` — use `unknown` or proper types
- Avoid type assertions (`as`) without justification — use type guards or
  validation instead
- Treat API payloads, `JSON.parse` output, env vars, database rows, files, queue
  payloads, and third-party responses as untrusted until validated
- Prefer discriminated unions over loose optional-state objects, conditional
  props included
- Keep transport shapes separate from trusted domain models when crossing
  boundaries
- Generics for reusable functions, hooks, and components; utility and mapped
  types (`Partial`, `Pick`, `Omit`, `Record`) over manual rewrites

## React & Next.js

- **Default to Server Components.** Use `"use client"` only for event handlers,
  React hooks, browser APIs (`localStorage`, `window`, `document`) or a library
  that needs the client. Wrap a client component that performs async work or
  lazy-loads content in Suspense with a fallback.
- Minimize `useEffect` — prefer Server Components, Server Actions, or derived
  state — and clean up the side effects that remain
- Server Actions for mutations (mark with `"use server"`)
- Async Server Components fetch their own data, in parallel — no waterfalls
- `loading.tsx` and Suspense boundaries for loading states, `error.tsx` for
  route-level errors, `next/dynamic` for non-critical components
- Proper `key` props in lists — not the array index
- URL query parameters for filterable/paginated state, so URLs stay shareable
  and bookmarkable

### Memoization

With React Compiler (`babel-plugin-react-compiler` or `react-compiler`): skip
manual `React.memo`, `useCallback`, and `useMemo` — the compiler handles
memoization. Without it: use them intentionally for measurable performance
gains, not preventively.

## Component Design

- Guideline: keep components under 200 lines (including types) — discuss with team before enforcing as hard limit
- Single responsibility per component
- Prefer composition (children, render props, compound components) over passing
  props through 3+ levels; compound components for complex UI patterns
- Extract shared logic into custom hooks only when the **purpose** is the same
  across call sites — not just because code looks similar
- Props get an explicit TypeScript interface, defined in `types.ts` or
  `index.ts` — not in the component file
- Components use the `function` keyword — no `React.FC`
- Always destructure props in the parameters, with defaults there
  (`function Card({ title = "Default", onClose })`); `const { } = props` only
  when you need the full props object
- Style with Tailwind, never inline styles; no Shadcn UI, Radix UI, or similar
  full component libraries

## File Naming & Organization

```
src/
├── app/          # Next.js App Router
├── components/
│   └── ui/       # Reusable UI (Button, Input, etc.)
├── modules/      # Feature-specific component compositions
├── lib/          # Project-specific integrations and external adapters
├── utils/        # Pure utility functions
├── config/       # App configuration
├── hooks/        # Custom React hooks (useXxx)
├── actions/      # Shared Server Actions used across features
├── types/        # Shared TypeScript types
└── styles/       # Global CSS, Tailwind config
```

Components `PascalCase.tsx` (`UserProfile.tsx`), utilities `camelCase.ts`
(`formatDate.ts`), hooks `useCamelCase.ts` (`useAuth.ts`), Server Actions
`camelCaseAction.ts` (`createUserAction.ts`).

### Shared Layers Are Earned, Not Claimed

`utils/`, `lib/`, `constants/`, `hooks/`, and `actions/` are **shared** layers:
a file lives there only when it has at least two unrelated consumers.

- A helper, transform, constants file, or hook consumed by one feature lives in
  that feature's `modules/` folder, next to its test — not in a shared layer
  "for later".
- Promote to the shared layer in the MR that adds the **second** consumer, and
  refactor the first consumer to import from the new location in that same MR.
  A second consumer that is only planned does not count.
- A feature-named subfolder under a shared layer (`utils/impact/`,
  `lib/checkout/`) is the tell that the file belongs in the feature's module.

## Naming & Formatting

Defer to the project's ESLint and Prettier config. Without one: two-space
indentation, 80-character lines, double quotes (JSX attributes too),
semicolons, trailing commas, parenthesized arrow-function parameters, `===`,
spaces after keywords and around operators, braces on multi-line `if` with
`else` on the `}` line, no unused variables.

- Event handlers `handle*` (`handleSubmit`); booleans `isLoading`, `hasError`,
  `canSubmit`; custom hooks `use*` (`useAuth`)
- `UPPERCASE` for environment variables, constants, and global config
- Full words; allowed short forms: `err`, `req`, `res`, `props`, `ref`

### GraphQL Field Aliases

Alias any GraphQL field whose name does not fit the codebase's conventions, so
the foreign name stops at the query boundary. Most often that is an
underscore-prefixed system field:

```graphql
publishedAt: _publishedAt
updatedAt: _updatedAt
typename: __typename
```

A leading underscore reads as "private" everywhere else in JS/TS, and the raw
name does not stay in the query: it reaches transformers, typedefs, validators,
test fixtures and sometimes component props. The alias is one word in one
place; renaming afterwards is a refactor across every consumer. Pick the name
once and use it in every query that selects that field.

## Function Style

- Named function declarations for exported functions, components, Server
  Components and Server Actions; no anonymous exports
- Arrow functions for callbacks and small local utilities; a local handler
  inside a component is `const handleToggle = () => {}`
- No inline function definitions in JSX — extract a named `const handle*`
  handler or constant
- Extract helpers when a function grows beyond ~50 lines or takes on several
  responsibilities
- Annotate parameters on exported functions; add return types only when
  inference is non-obvious
- Early returns, for legibility and to skip work that is not needed

## Harden What You Can Demonstrate

Defensive code earns its place from a failure you can point at: a reproduction,
a log line, a captured payload, a test that fails without it. Added on a hunch
it is untested behaviour that reads as tested, and the next person cannot tell
which of the two they are looking at.

- Add the fallback, the retry, the extra header, the second lookup path **after**
  the gap is shown to exist — not because it might. "The value might arrive in
  this other header instead" is a hypothesis; a captured request is evidence.
- If no test can fail without the change, that is the signal, not a detail to
  work around.
- A hypothesis worth keeping goes where hypotheses live — the backlog item,
  `docs/todo/`, the MR description — not into code nobody can falsify.
- This is not an argument against validating untrusted input. Boundary
  validation covers data whose shape is unknown by definition; speculative
  hardening invents a failure mode for data whose shape was never checked.

## Error Handling & Validation

- Zod for schema validation and clear error messages; validate boundary data
  close to the edge, then map it into trusted domain types
- Error boundaries with user-friendly fallbacks for client trees
- Always handle error parameters in callbacks — don't silently ignore them

## Internationalization

Detect the locale where relevant; format numbers, dates, and currencies for it;
support RTL when needed.

## Documentation

JSDoc for public APIs, with examples where helpful. Docs stay concise, with
correct punctuation, headings, lists, and links.
