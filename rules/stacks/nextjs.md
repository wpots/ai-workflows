# Stack Rules: Next.js + React

Applies when `next` is detected in `package.json`, regardless of the data
layer behind it (CMS, database SDK, external APIs).

Load `rules/clean-architecture.md` first — this file only adds stack-specific
structure and mapping on top of those universal principles. When the project
also uses Payload CMS, additionally load `rules/stacks/nextjs-payload.md`,
which overlays the Payload-specific mapping on this file.

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
│   ├── <adapter>/      # One folder per data source (cms/, firebase/, api/, …)
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
import { insertOrder } from "@/infrastructure/orders";

export async function createOrderAction(data: unknown) {
  const order = validateOrder(data); // domain
  return insertOrder(order); // infrastructure
}
```

### Data adapters

All queries against a data source — CMS SDK, database client (Firestore,
Prisma, …), or external API — live in their own `infrastructure/<adapter>/`
folder. Components, hooks, and Server Actions never import an SDK client or
query a data source directly; they call the adapter function.

```ts
// ✅ infrastructure/firebase/products.ts
import { db } from "./client";

export async function getProduct(id: string) {
  const snapshot = await getDoc(doc(db, "products", id));
  return toProduct(snapshot); // raw doc → domain entity at the boundary
}
```

```tsx
// ❌ SDK client used directly inside a component
import { getDocs, collection } from "firebase/firestore";
export default function ProductList() {
  // ...
}
```

### Custom Hooks

Hooks in `application/hooks/` encode a single business operation and may call
infrastructure adapters (via fetch/SWR/React Query). They must not contain raw
SDK or database calls.

```ts
// ✅ application/hooks/useCart.ts — calls an API route or Server Action
export function useCart() { ... }

// ❌ application/hooks/useCart.ts — querying the database from a hook
import { getDocs } from "firebase/firestore"; // infrastructure concern in application layer
```

### Type Flow

- Entity types defined in `domain/types/` are importable from any layer.
- Raw SDK document types (a Firestore snapshot, a CMS doc, an API response) are
  infrastructure types — transform them to domain entity types at the
  infrastructure boundary before returning to application or presentation.

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
| **Query**    | `infrastructure/**`               | return raw or normalized domain docs from the data source. Stays presentation-agnostic.    | domain only                             |

```
Page  →  Loader  →  Query (infrastructure)  →  data source
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
- SDK clients or data-source queries used outside `infrastructure/`
- Business calculations or validation logic inside component files
- `"use server"` functions defined inside component files instead of `actions/`
- Infrastructure types (raw SDK docs) used directly in components without
  transformation
