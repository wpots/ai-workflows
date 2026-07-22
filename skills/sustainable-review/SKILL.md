---
name: sustainable-review
description: Audit a change or area for Sustainable IT — runtime efficiency and caching, bundle/client JS, assets (LCP images, fonts), dependencies, CI/CD cost, and accessibility-as-performance — and produce backlog-ready findings. Use when the user asks for a sustainability/performance/green/CI-cost/dependency review, a Lighthouse-oriented performance audit, or to assess the energy/compute/cost impact of a change. Read-only until findings are approved.
---

# Sustainable IT Review

Run a single review pass across sustainability dimensions and return
prioritized, backlog-ready findings. One workflow, several lenses — not one
skill per lens. Policy lives in `rules/sustainability.md`; load it first.

## Inputs To Confirm

- Scope: current branch diff, a specific path/module, or the whole repo.
- Dimensions to include (default: all): rendering/caching, bundle/client JS,
  assets (images/fonts), dependencies, CI/CD, developer workflow,
  accessibility-as-performance.
- Output target: inline summary only, or also draft `docs/backlog/` items.

## Context To Load

- `rules/sustainability.md` (policy), the project's architecture/read-path
  rule (caching seam), `rules/accessibility.md`, the relevant `rules/stacks/*`
  file.
- `CONVENTIONS.md` for project-specific caching/rendering decisions, migration
  rules, and CI constraints.
- `package.json`, `next.config.*` (or equivalent), CI config, and any
  `docs/todo`/`docs/audits` performance notes — **verify doc claims against
  the code**; stale docs cause wrong findings.

## Workflow

1. **Map scope.** Resolve the files/areas in scope; note framework + stack.
2. **Per dimension, check against the rule's "What to Flag":**
   - *Rendering/caching* — uncached public reads, dynamic-forcers, duplicate
     per-request queries, serial awaits, `no-store` public HTML.
   - *Assets* — lazy LCP images, preloaded optional fonts, wrong `sizes`.
   - *Bundle/client JS* — needless `"use client"`, barrel registries, gated
     features not code-split, data blobs to the client, heavy deps.
   - *Dependencies* — dev tools as runtime deps, unused deps.
   - *CI/CD* — run-everything jobs, missing caches, idle previews.
   - *Developer workflow* — heavy hooks, coverage in watch.
   - *A11y-as-performance* — reduced-motion / low-end-device paths.
3. **Quantify where possible.** Prefer a measurement (Lighthouse run, bundle
   bytes, query count, CI minutes). Record a dated baseline before proposing
   changes. If unmeasured, label the finding "unverified — needs measurement".
4. **Rank** by impact ÷ effort; flag team-alignment items separately.
5. **Run the Change-Safety Checklist** from the rule on any proposed change.
6. **Land the findings.** Draft findings; on approval, write backlog items per
   `docs/backlog` conventions (note DB-migration expectation for each).
   Findings that are consciously not picked up go on an explicitly parked
   list. **An audit that ends as a report only evaporates.**

## Output

A severity-ordered report:

- **Already good** — keep as-is.
- **Findings** — per item: dimension · location (`file:line`) · impact
  🟢/🟢🟢/🟢🟢🟢 · effort XS/S/M/L · risk · why it helps sustainability ·
  suggested fix.
- **Quick wins** vs **Needs team alignment**.
- Backlog-ready `docs/backlog/` drafts (or an explicit parked list).

## Constraints

- **Read-only** until the user approves writing backlog items or patches.
- **No measurement, no hard claim** — label estimates as estimates.
- Prefer the smallest incremental change; never propose a rewrite as the fix.
- Do not run any `migrate*` command; flag migration expectations only.
- Stay tool-agnostic: no assistant-specific instructions in findings.

## Anti-Patterns

- ❌ Splitting into separate performance/ci/dependency reviews — keep one pass.
- ❌ Recommending caching for user/auth/`draftMode`-bound reads.
- ❌ "Optimize the bundle" with no analyzer/Lighthouse baseline.
- ❌ Backlog items without an impact/effort/risk line.
- ❌ Findings left only in the report — no backlog item, no parked-list entry.

## Example Prompt

> "Run a sustainable-review on the current branch diff. Focus on rendering/
> caching and bundle size, quantify where you can, and draft backlog items for
> anything 🟢🟢 or higher."
