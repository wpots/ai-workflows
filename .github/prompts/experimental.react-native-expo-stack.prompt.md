# React Native + Expo Stack Rules

Applies when `expo` or `react-native` is detected in `package.json`.

Load clean architecture principles first — this file adds stack-specific
structure and mapping on top.

---

## Folder Mapping for Existing Projects

Before enforcing anything, map the project's actual folders to CA layers.
Common patterns in React Native / Expo projects:

| Detected folder(s)                                          | CA layer                      |
| ----------------------------------------------------------- | ----------------------------- |
| `domain/`, `entities/`, `models/`                           | Domain                        |
| `types/` (entity shapes, not just utility types)            | Domain                        |
| `application/`, `use-cases/`, `stores/`, `state/`           | Application                   |
| `hooks/` (business operation hooks)                         | Application                   |
| `infrastructure/`, `services/`, `api/`, `lib/`, `adapters/` | Infrastructure                |
| `storage/` (AsyncStorage wrappers)                          | Infrastructure                |
| `components/`, `ui/`                                        | Presentation                  |
| `screens/`, `views/`                                        | Presentation                  |
| `navigation/`                                               | Presentation (routing config) |

If a folder is ambiguous, inspect a sample of files to classify by what they
import. Ask the user if still unclear.

---

## Recommended Greenfield Structure

```
src/
├── domain/
│   ├── types/          # Entity interfaces and value types
│   └── interfaces/     # Repository and service contracts
│
├── application/
│   ├── hooks/          # Business operation hooks (useCart, useAuth, etc.)
│   └── stores/         # Global app state (Zustand, Jotai, Context)
│
├── infrastructure/
│   ├── api/            # REST/GraphQL clients, fetch utilities
│   ├── storage/        # AsyncStorage adapters
│   └── notifications/  # Push notification integrations
│
└── presentation/
    ├── components/     # Pure, reusable UI components
    ├── screens/        # Screen components (thin shells only)
    └── navigation/     # React Navigation stack/tab/drawer config
```

---

## Stack-Specific Rules

### Screens are thin shells

A screen file's responsibility is layout and wiring — it composes components
and calls application hooks. Business logic does not belong in screens.

**Max ~50 lines of non-JSX logic per screen file.**

```tsx
// ❌ business logic + API call inside a screen
export function CartScreen() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    fetch("/api/cart")
      .then((r) => r.json())
      .then(setItems);
  }, []);
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
}

// ✅ screen is a thin shell
export function CartScreen() {
  const { items, total, addItem, removeItem } = useCart();
  return (
    <CartView
      items={items}
      total={total}
      onAdd={addItem}
      onRemove={removeItem}
    />
  );
}
```

### Navigation state is application-layer, not domain

Navigation params and deep link data are application concerns. Domain entities
must not contain navigation-specific fields.

### Platform-specific code in infrastructure

Use `.ios.ts` / `.android.ts` extensions or explicit platform checks only
inside `infrastructure/`. Presentation and application layers must be
platform-agnostic.

### AsyncStorage is infrastructure

Never call `AsyncStorage` or `expo-secure-store` directly from a screen,
component, or hook. Wrap them in `infrastructure/storage/` adapters.

### API calls belong in infrastructure

All `fetch`, Axios, or GraphQL client calls live in `infrastructure/api/`.
Application hooks call infrastructure functions — they do not make network calls
themselves.

### Expo-specific packages

Expo SDK packages (`expo-camera`, `expo-location`, `expo-notifications`, etc.)
are infrastructure concerns. Wrap them in adapters so the application layer
remains testable without native APIs.

---

## What to Flag in Reviews

- `fetch()`, Axios, or GraphQL client calls inside screen or component files
- `AsyncStorage` or `expo-secure-store` called directly outside `infrastructure/`
- `Platform.OS` checks outside `infrastructure/`
- Business calculations or validation logic inside screen files
- Navigation params or screen names embedded in domain entity types
- Expo SDK packages imported directly in `application/` or `presentation/`
- Screen files exceeding ~50 lines of non-JSX logic
