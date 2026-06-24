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

## What to Flag in Reviews

- `fetch()` called inline in a `page.tsx`, `layout.tsx`, or any component file
- `getPayload()` or Payload collection queries outside `infrastructure/payload/`
- Business calculations or validation logic inside component files
- `"use server"` functions defined inside component files instead of `actions/`
- Infrastructure types (raw Payload docs) used directly in components without
  transformation
