# Stack Rules: Next.js + React + Payload CMS

Applies when `next` is detected in `package.json`. Optionally with
`@payloadcms/payload`.

Load `rules/clean-architecture.md` first — this file only adds stack-specific
structure and mapping on top of those universal principles.

---

## Folder Mapping for Existing Projects

Before enforcing anything, map the project's actual folders to CA layers.
Common patterns in Next.js projects:

| Detected folder(s)                                          | CA layer       |
| ----------------------------------------------------------- | -------------- |
| `domain/`, `entities/`, `models/`                           | Domain         |
| `types/` (entity shapes, not just utility types)            | Domain         |
| `application/`, `use-cases/`, `actions/`                    | Application    |
| `hooks/` (business operation hooks)                         | Application    |
| `infrastructure/`, `services/`, `lib/`, `api/`, `adapters/` | Infrastructure |
| `components/`, `ui/`, `modules/`, `templates/`              | Presentation   |
| `app/` (App Router), `pages/`                               | Presentation   |

If a folder is ambiguous (e.g. `utils/` could be Domain or Infrastructure),
inspect a sample of files to classify by what they import. Ask the user if
still unclear.

---

## Recommended Greenfield Structure

Use this when starting a new project or when the user asks for a migration plan.

```
src/
├── domain/
│   ├── types/          # Entity interfaces and value types
│   └── interfaces/     # Repository and service contracts
│
├── application/
│   ├── actions/        # Next.js Server Actions (use-case boundary)
│   └── hooks/          # Client-side use case hooks
│
├── infrastructure/
│   ├── payload/        # Payload collection queries and adapters
│   ├── api/            # External API fetch utilities
│   └── cache/          # Revalidation and cache strategies
│
└── presentation/
    ├── components/     # Pure UI components
    ├── modules/        # Feature-level component compositions
    ├── templates/      # Page-level templates
    └── app/            # Next.js App Router (routes, layouts, pages)
```

---

## Stack-Specific Rules

### App Router files (`app/` directory)

- Route files (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`) are
  **presentation-only** — they render components and pass data, nothing more.
- Data fetching in Server Components is fine, but should call application-layer
  functions or infrastructure adapters — not raw `fetch` inline.

```tsx
// ❌ raw fetch inside a page component
export default async function ProductPage({ params }) {
  const res = await fetch(`/api/products/${params.id}`);
  const product = await res.json();
  return <ProductDetail product={product} />;
}

// ✅ delegates to application or infrastructure layer
export default async function ProductPage({ params }) {
  const product = await getProduct(params.id); // lives in application/ or infrastructure/
  return <ProductDetail product={product} />;
}
```

### Server Actions

Server Actions are the **application/infrastructure boundary**. They live in
`application/actions/` and are the only place that crosses from client-callable
code into server-side infrastructure.

```ts
// ✅ application/actions/createOrder.ts
"use server";
import { validateOrder } from "@/domain/...";
import { insertOrder } from "@/infrastructure/payload/orders";

export async function createOrderAction(data: unknown) {
  const order = validateOrder(data); // domain
  return insertOrder(order); // infrastructure
}
```

```tsx
// ❌ Payload query directly inside a component
import { getPayload } from "payload";
export default function ProductList() {
  // ...
}
```

### Payload CMS

All Payload collection queries live in `infrastructure/payload/`. Components and
Server Actions never call `getPayload()` or query collections directly.

```ts
// ✅ infrastructure/payload/products.ts
import { getPayload } from "payload";
import config from "@payload-config";

export async function getProduct(id: string) {
  const payload = await getPayload({ config });
  return payload.findByID({ collection: "products", id });
}
```

### Custom Hooks

Hooks in `application/hooks/` encode a single business operation and may call
infrastructure adapters (via fetch/SWR/React Query). They must not contain raw
Payload or database calls.

```ts
// ✅ application/hooks/useCart.ts — calls an API route or Server Action
export function useCart() { ... }

// ❌ application/hooks/useCart.ts — calling Payload directly from a hook
import { getPayload } from "payload"; // infrastructure concern in application layer
```

### Type Flow

- Entity types defined in `domain/types/` are importable from any layer.
- Raw Payload document types (`PayloadProduct`) are infrastructure types —
  transform them to domain entity types at the infrastructure boundary before
  returning to application or presentation.

---

## Read Path: Page → Loader → Template

For rendered routes, use a **loader** as the read-path data-access seam — the
mirror of a Server Action on the write path. Every route renders through four
roles; dependencies flow one direction only.

| Role         | Lives in                          | Responsibility                                                                              | May import                              |
| ------------ | --------------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------- |
| **Page**     | `app/**/page.tsx`                 | route params, auth, `redirect`/`notFound`, call the loader, render the template. No fetching, no transforms. | loader, template                        |
| **Loader**   | `templates/<Name>/load<Name>.ts`  | fetch via infrastructure queries + map raw docs into the template's view-model props. The ONLY seam allowed to touch both infrastructure and presentation. | infrastructure queries, domain, view-model types |
| **Template** | `templates/<Name>/*.tsx`          | render the view model. No fetching, no transforms. Server or client component.              | loader types, modules, components, domain types |
| **Query**    | `infrastructure/payload/**`       | return raw or normalized Payload/domain docs. Stays presentation-agnostic.                  | domain only                             |

```
Page  →  Loader  →  Query (infrastructure)  →  Payload
          │
          └→ produces props → Template (presentation)
```

**Why a loader**

- A `page.tsx` is presentation; it must not fetch or transform.
- An infrastructure query must not know view-model/prop types, or infrastructure
  starts depending on presentation.
- The loader is the one place allowed to bridge both. It keeps infrastructure
  clean, keeps pages and templates thin, and gives view-model transforms a
  single, testable home.

**Rules**

- Every route renders a template; the page contains no markup beyond the
  template element (plus route-level control flow).
- View-model transforms (raw doc → component props) live in the loader, or in a
  module-local `Transform*.ts` the loader calls — **never** in a page or
  template, and **never** in an infrastructure query.
- Normalization transforms (domain doc → cleaner domain doc) may stay inside the
  query, since they do not reference presentation types.
- A loader may call `redirect()` / `notFound()` for data-driven navigation.
  Pure route-param control flow stays in the page.
- The loader file uses the `load<Name>.ts` prefix form (e.g. `loadProductDetail.ts`)
  — never a bare `load.ts` — so it stays greppable and unambiguous across
  modules. The same applies to a module that needs its own data-access seam
  (`modules/<Name>/load<Name>.ts`).

Co-location:

```
templates/<Name>/
  <Name>.tsx          # template (presentation)
  load<Name>.ts       # loader: queries + view-model transform → props
  types.ts            # the props / view-model type
  index.ts            # barrel
```

## Definition of Done (routes & modules)

Run this checklist over your own diff **before** finishing a route or module
change — not in review. Every box must hold for the changed code (and don't
mirror a neighbour that fails them; see "Conform to the rule, not the neighbour"
in `rules/clean-architecture.md`).

- [ ] The `page.tsx` contains only route control flow (params, auth,
      `redirect`/`notFound`) and the `<Template/>` element — no markup, no
      fetching, no view-model derivation.
- [ ] Fetching and view-model derivation live in `templates/<Name>/load<Name>.ts`;
      pure raw-doc → props mapping lives in a `Transform*.ts` the loader calls.
- [ ] Route/path construction goes through the project's central route helper —
      never a hand-written, locale-prefixed URL string scattered across files.
- [ ] Component prop interfaces live in `types.ts` (or `index.ts`), never inline
      in the `.tsx`.
- [ ] One transform per module; no stray helper files left lying around.
- [ ] Hooks hold client state only. Pure or server-side derivation belongs in a
      transform/loader, not in a hook.
- [ ] No infrastructure query imports a presentation type (`templates/*`,
      `modules/*`, `components/*`) or returns a view-model/prop shape.
- [ ] No template imports an infrastructure query function directly — it goes
      through the loader.

Machine-enforce the import-direction boundary (infrastructure read-path ↛
presentation; templates ↛ infrastructure queries) with `no-restricted-imports`
in the ESLint config once the codebase is clean enough to flip it from `warn` to
`error`.

---

## What to Flag in Reviews

- `fetch()` called inline in a `page.tsx`, `layout.tsx`, or any component file
- `getPayload()` or Payload collection queries outside `infrastructure/payload/`
- Business calculations or validation logic inside component files
- `"use server"` functions defined inside component files instead of `actions/`
- Infrastructure types (raw Payload docs) used directly in components without
  transformation
