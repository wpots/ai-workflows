---
name: architecture-review
description: Review a project's codebase for clean architecture violations. Probes the actual folder structure, maps it to CA layers, then checks principles against that mapping — works with any folder naming convention. Use when the user asks to review architecture, check clean arch, audit layer violations, or inspect project structure.
metadata:
  owner: wieteke.pots
---

# Architecture Review

Use this skill when the user asks to review architecture, check clean arch
compliance, audit layer violations, or inspect project structure.

---

## Step 1 — Detect Stack

Read `package.json` (`dependencies` + `devDependencies`):

- `"next"` present → stack is **Next.js** (+ Payload if `@payloadcms/payload`
  present); load `rules/stacks/nextjs-payload.md`
- `"expo"` or `"react-native"` present → stack is **React Native + Expo**;
  load `rules/stacks/react-native-expo.md` when available
- Neither → principles-only review; load `rules/clean-architecture.md` only

---

## Step 2 — Probe Actual Structure

List top-level directories in `src/` (or project root if no `src/` exists).
Do not assume any canonical folder names exist.

---

## Step 3 — Map Folders to CA Layers

**First, look for the intended mapping.** If `docs/architecture.md` exists, its
layer-mapping table is what this project decided its layers are — written by
`skills/start-project/SKILL.md`. Use it as the mapping instead of inferring one,
and treat any difference between it and the tree as a finding of its own:

| Situation | Report as |
| --- | --- |
| folder in the tree, absent from the table | Warning — unmapped folder, the intended mapping never decided where it belongs |
| folder mapped to a layer its imports contradict | Critical or Warning, depending on the dependency-rule breach it causes |
| table names a path that no longer exists | Suggestion — stale intended mapping, update the decision |

Do not silently substitute your own mapping for the documented one. When the
documented mapping looks wrong, say so as a finding with the evidence (the
imports you read), and let the fix land in `docs/architecture.md` as a
decision-log entry.

**Then read its "Known Architectural Debt" section.** Deviations listed there are
already known and tracked, so reporting them as new findings buries the ones
nobody has seen yet. Report them as `Known` with the tracker they name, and keep
them out of the finding counts. Two exceptions worth raising:

| Situation | Report as |
| --- | --- |
| listed deviation has grown beyond what the entry describes | Warning — the tracked scope no longer matches the code |
| entry names a tracker, todo, or path that no longer exists | Suggestion — stale debt entry, the deviation lost its owner |

If `docs/architecture.md` does not exist, infer the mapping as below — and note
in the output that the review ran against an inferred mapping, so a
disagreement about layers cannot be settled by a document.

Use the mapping table from the loaded stack file. If no stack file was loaded,
use the universal mapping below:

| Detected folder(s)                                                      | CA layer       |
| ----------------------------------------------------------------------- | -------------- |
| `domain/`, `entities/`, `models/`                                       | Domain         |
| `types/` (entity shapes)                                                | Domain         |
| `application/`, `use-cases/`, `actions/`, `stores/`, `state/`           | Application    |
| `hooks/` (business operation hooks)                                     | Application    |
| `infrastructure/`, `services/`, `lib/`, `api/`, `adapters/`, `storage/` | Infrastructure |
| `components/`, `ui/`, `modules/`, `templates/`                          | Presentation   |
| `screens/`, `views/`, `pages/`, `app/`, `navigation/`                   | Presentation   |

### Resolving ambiguous folders

If a folder does not clearly match any layer:

1. Read 3-5 files from that folder.
2. Check what they import — the imports reveal the layer.
   - Imports from framework packages only (React, Next, Expo) → likely Presentation
   - Imports from external services / fetch / storage → likely Infrastructure
   - Imports from other application-layer files, calls use cases → Application
   - No imports from the project at all → likely Domain
3. If still ambiguous, stop and ask the user: "I found a `[folder]` directory
   I can't classify. Is it Domain, Application, Infrastructure, or Presentation?"

Do not proceed with the review until all folders are mapped.

---

## Step 4 — Check Principles

With the resolved layer mapping, scan for violations of the dependency rule.
Check each principle from `rules/clean-architecture.md`:

### Dependency direction violations

For each file, check that its imports only reference equal or inner layers:

- A **Presentation** file imports from **Infrastructure** directly → violation
- A **Domain** file imports from any outer layer → violation
- An **Infrastructure** file imports from **Presentation** → violation

To check imports efficiently:

1. Pick a representative sample of files per layer (5-10 files each).
2. Read their import statements.
3. Flag any import that crosses the wrong direction.

### Business logic in UI files

In Presentation files, flag:

- Inline `reduce`, `filter`, `map` chains performing business calculations
- Validation logic (regex, numeric rules, business constraints)
- State machines or multi-step process control
- Inline `fetch()` or API client calls

### Infrastructure calls from UI

In Presentation files, flag:

- Direct `fetch()` calls
- Direct database/CMS query functions (`getPayload()`, Prisma, etc.)
- Direct `AsyncStorage`, `SecureStore`, or cookie access

### Domain purity violations

In Domain files, flag:

- Any import from a framework package (React, Next.js, Expo, etc.)
- Any import from Infrastructure or Application folders
- Side effects (console.log aside, any async operations)

---

## Step 5 — Output

Report findings ordered by severity. For each finding include:

- **Severity**: Critical / Warning / Suggestion
- **File**: relative path with line number(s) where relevant
- **Violation**: which principle is breached and why
- **Fix**: concrete, targeted change to resolve it (show the corrected code or
  the correct import path/location)

### Severity guide

| Severity   | Examples                                                                      |
| ---------- | ----------------------------------------------------------------------------- |
| Critical   | Infrastructure imported directly in a component; Domain importing a framework |
| Warning    | Business logic inside a screen/component file; raw API calls in hooks; folder missing from the intended mapping |
| Suggestion | Folder structure unclear; ambiguous utility code that could move inward; `docs/architecture.md` names a path that no longer exists |

### Output format

```
## Architecture Review

### Layer Mapping (from docs/architecture.md | inferred)
- `services/` → Infrastructure
- `hooks/`    → Application
- `screens/`  → Presentation
- `types/`    → Domain
- `workers/`  → not in the intended mapping

### Findings

#### [Critical] Direct API call in Presentation
File: src/screens/CartScreen.tsx:14
fetch('/api/cart') called inside a screen component.
Fix: Move to src/services/cartApi.ts and call via src/hooks/useCart.ts.

#### [Warning] Business logic in component
File: src/components/OrderSummary.tsx:22-26
Tax calculation performed inline inside JSX.
Fix: Extract to src/hooks/useOrderTotal.ts.

### Known (tracked in docs/architecture.md)
- Loader/vendor import boundary is warn-level, not error → RFW-241
- `workers/` unmapped since the queue migration → docs/todo/queue-layering.md

### Summary
3 Critical · 2 Warnings · 1 Suggestion · 2 known/tracked
```

---

## Constraints

- Do not edit any files unless the user explicitly asks.
- Do not report violations based on folder names alone — only on principle
  breaches within the resolved mapping.
- If the project has no `src/` directory or a very flat structure, note this
  and explain what a layer structure would look like for this stack.
- If the codebase is large, sample 5-10 representative files per layer rather
  than reading every file.
