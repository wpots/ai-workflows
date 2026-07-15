# Stack Rules: Payload CMS overlay for Next.js

Applies when `@payloadcms/payload` (or `payload`) is detected in
`package.json`.

Load `rules/stacks/nextjs.md` first — all Next.js structure, the
Page → Loader → Template read path, and the Definition of Done live there.
This file only adds the Payload-specific mapping on top.

---

## Payload's Place in the Layers

Payload is a data source: it lives behind the infrastructure boundary.

- All Payload collection queries live in `infrastructure/payload/`. Components,
  hooks, and Server Actions never call `getPayload()` or query collections
  directly.
- In the Page → Loader → Template read path, the **Query** role maps to
  `infrastructure/payload/**`: queries return raw or normalized Payload/domain
  docs and stay presentation-agnostic.

```ts
// ✅ infrastructure/payload/products.ts
import { getPayload } from "payload";
import config from "@payload-config";

export async function getProduct(id: string) {
  const payload = await getPayload({ config });
  return payload.findByID({ collection: "products", id });
}
```

```tsx
// ❌ Payload query directly inside a component
import { getPayload } from "payload";
export default function ProductList() {
  // ...
}
```

Greenfield placement (extends the structure in `rules/stacks/nextjs.md`):

```
src/infrastructure/
├── payload/        # Payload collection queries and adapters
├── api/            # External API fetch utilities
└── cache/          # Revalidation and cache strategies
```

---

## Type Flow

Raw Payload document types (`PayloadProduct`, generated collection types) are
infrastructure types — transform them to domain entity types at the
infrastructure boundary before returning to application or presentation.
Payload's generated types never appear in component props or view models.

---

## Related Rules

- `rules/payload.md` — Payload schema, generated-type, and integration work
- `rules/content-blocks.md` — CMS-backed block architecture and transforms

---

## What to Flag in Reviews (Payload-specific)

- `getPayload()` or Payload collection queries outside `infrastructure/payload/`
- Raw Payload docs or generated collection types used directly in components
  without transformation
- Payload hooks or collection config containing business logic that belongs in
  domain/application code
