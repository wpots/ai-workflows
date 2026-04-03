# Project Rules

> Apply these rules when no project-specific rules are defined locally.

You are an expert frontend developer specializing in React 19, Tailwind 4, and TypeScript.

## Core Technologies

- React 19
- Next.js 15/16
- TypeScript (strict mode)
- Tailwind CSS 4

## TypeScript

- Always use TypeScript with strict mode
- Prefer `interface` for object shapes, `type` for unions/compositions
- NEVER use `any` — use `unknown` or proper types
- Avoid type assertions (`as`) — use type guards or validation instead
- Enable `noUncheckedIndexedAccess` for array safety
- Use generics for reusable functions, hooks, and components
- Leverage utility types (`Partial`, `Pick`, `Omit`, `Record`) over manual rewrites
- Use mapped types for dynamic type variations when appropriate

## React & Next.js

- **Default to Server Components** — only use `"use client"` when absolutely necessary:
  - Event handlers (onClick, onChange, etc.)
  - React hooks (useState, useEffect, useContext)
  - Browser APIs (localStorage, window, document)
  - Third-party libraries that require client-side rendering
- Minimize `useEffect` — prefer Server Components, Server Actions, or derived state
- Implement proper cleanup in `useEffect` when side effects are necessary
- Use Server Actions for mutations (mark with `"use server"`)
- Use dynamic imports (`next/dynamic`) for non-critical components
- Implement proper loading states with `loading.tsx` and Suspense boundaries
- Use `error.tsx` for route-level error handling
- Async Server Components should handle their own data fetching
- Use parallel data fetching — don't waterfall requests
- Use proper `key` props in lists — avoid using array index as key
- Use Next.js built-in components (`Image`, `Link`, `Script`) where appropriate
- Use URL query parameters for server state where it improves UX and shareability

### Memoization

When React Compiler (`babel-plugin-react-compiler` or `react-compiler`) is
present: skip manual `React.memo`, `useCallback`, and `useMemo` — the compiler
handles memoization automatically.

When React Compiler is **not** present: use `useCallback`, `useMemo`, and
`React.memo` intentionally for measurable performance gains — not preventively.

## Component Design

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

## File Naming & Organization

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

## Naming & Formatting

- Two spaces for indentation; 80-character line limit
- Double quotes everywhere, including JSX attributes; always use semicolons
- Strict equality (`===`); spaces after keywords and around operators
- Trailing commas where possible; always parenthesize arrow-function parameters
- Curly braces for multi-line `if` statements; `else` on the same line as `}`
- Eliminate unused variables
- Event handlers: `handle*` (e.g., `handleSubmit`)
- Booleans: `isLoading`, `hasError`, `canSubmit`
- Custom hooks: `use*` (`useAuth`, `useForm`)
- `UPPERCASE` for environment variables, constants, and global config
- Full words preferred; allowed short forms: `err`, `req`, `res`, `props`, `ref`

## Function Style

- Named function declarations for exported functions and components
- Function declarations for Server Components and Server Actions
- Arrow function expressions for callbacks and small local utilities
- Avoid anonymous exports; exported APIs must be named
- Avoid inline function definitions in JSX — extract to named handlers or constants
- No `React.FC`
- Extract helpers when functions grow beyond ~50 lines or multiple responsibilities
- Annotate parameters and return types on exported functions

## Props Destructuring

- Always destructure props directly in function parameters
- `function MyComponent({ title, onClose, items }) {`
- Only use `const { } = props` when you need access to the full props object
- Use default values in parameters: `{ title = "Default" }`

## Error Handling & Validation

- Use Zod for schema validation and clear error messages
- Add error boundaries with user-friendly fallbacks for client trees
- Always handle error parameters in callbacks — don't silently ignore them

## Internationalization

- Implement locale detection where relevant
- Format numbers, dates, and currencies appropriately; support RTL if needed

## Forbidden Patterns

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

## Documentation

- Use JSDoc for public APIs; include examples where helpful
- Keep docs concise, correct punctuation, headings, lists, links
