# Clean Architecture Principles

Applies to all projects regardless of folder naming or tech stack. These
principles define _what_ belongs where — stack rules define _how_ to express
this in a given project's actual folder structure.

## The Four Layers

Dependencies flow **inward only**. Outer layers depend on inner layers. Inner
layers never know outer layers exist.

```
Presentation  →  Application  →  Infrastructure  →  Domain
   (outer)                                           (inner)
```

- **Domain** — the core of the application, framework-free and
  side-effect-free: business entities and their invariants, interfaces
  (repository contracts, service ports), pure functions operating on entities,
  shared value types and enums.
- **Application** — orchestrates use cases: one use case per function, hook or
  action; custom hooks that encode a single business operation; Server Actions
  (in Next.js the application/infrastructure boundary); application-level
  state, not UI state and not domain entities directly.
- **Infrastructure** — adapts the outside world: API clients and fetch
  utilities, database/CMS query adapters (Payload collections, Prisma calls),
  storage adapters (AsyncStorage, localStorage, cookies), third-party
  integrations (analytics, auth providers, notifications), cache strategies.
- **Presentation** — renders UI, a thin layer with no business logic:
  components and screens, navigation configuration, page/route files, UI-only
  state (open/closed, active tab, scroll position).

## Dependency Rule

| Layer          | May import from                                                       |
| -------------- | --------------------------------------------------------------------- |
| Domain         | nothing outside Domain, and no framework (React, Next.js, Expo, etc.) |
| Infrastructure | Domain only, to implement its interfaces                              |
| Application    | Domain, Infrastructure (via domain interfaces)                        |
| Presentation   | Application (hooks, actions), Domain (types only)                     |

## Forbidden Patterns

These are violations regardless of how folders are named.

### Business logic in UI files

```tsx
// ❌ calculation/validation inside a component
function OrderSummary({ items }) {
  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const tax = total > 100 ? total * 0.21 : 0;
  return <div>{total + tax}</div>;
}

// ✅ use case in application layer, component is a thin shell
function OrderSummary({ items }) {
  const { total, tax } = useOrderTotal(items);
  return <div>{total + tax}</div>;
}
```

### Direct infrastructure calls from UI

```tsx
// ❌ API call directly in a component or screen
function UserProfile({ id }) {
  const [user, setUser] = useState(null);
  useEffect(() => {
    fetch(`/api/users/${id}`)
      .then((r) => r.json())
      .then(setUser);
  }, [id]);
}

// ✅ application hook wraps the infrastructure call
function UserProfile({ id }) {
  const { user } = useUser(id);
}
```

### Raw UI state used as domain state

```tsx
// ❌ domain entity stored directly in useState inside a component
const [cart, setCart] = useState<CartItem[]>([]);

// ✅ domain state lives in an application-layer hook or store
const { cart, addItem, removeItem } = useCart();
```

### Imports against the dependency rule

- Infrastructure importing from presentation, such as an API client importing
  `Toast` from `@/components/Toast`: infrastructure returns data or errors, and
  presentation decides how to show them.
- Domain importing from an outer layer, such as an entity importing `apiFetch`
  from `@/lib/api`: domain entities have zero external imports.

## Boundary Rules

- Data transformations (API response → domain entity, domain entity → view
  model) happen **at layer edges**, not inside components or deep inside
  infrastructure.
- Types defined in Domain are the only types that flow freely across all layers.
  Infrastructure-specific types (raw API responses, ORM models) are transformed
  before crossing into Application or Presentation.
- Side effects (network, storage, notifications) are always initiated from
  Application or Infrastructure — never from Domain.

## Conform to the rule, not the neighbour

When extending existing code that does **not** follow these principles, conform
to the rule — not to the surrounding (non-conforming) code. Mirroring the
neighbour propagates the violation; the rule is the norm even when the nearest
example contradicts it.

When you spot the existing deviation, do not silently fix it in the same change
(that bloats scope). Instead, flag it — add a tracked follow-up (e.g. a
`docs/todo/` entry) that names the file and the rule it breaks, so the retrofit
can be scheduled on its own. Your new code lands conforming; the old code gets a
tracked follow-up.

## When Reviewing Code

Apply these principles against the project's **actual folder structure** — do
not assume canonical folder names. Map the detected folders to layers first
(see `stacks/` rules or use the architecture-review skill), then check
violations against the mapping.
