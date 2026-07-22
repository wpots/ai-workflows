# Sustainable IT / Green Software Rules

Energy, compute, bandwidth, and cost are first-class quality attributes.
Treat wasted CPU, redundant network traffic, and idle infrastructure as
defects. This rule is the policy source; the `sustainable-review` workflow
executes an audit against it.

Load alongside the project's architecture/read-path rules (caching seam) and
`accessibility.md` (less client work = better on low-end devices). Do not
duplicate their content here.

## Principles

- **Cache by default at trust-safe boundaries.** Public, publish-bound reads
  should be cached cross-request; user/request-bound reads must not be.
- **Do the work once.** Prefer build-time/cached over per-request; dedupe
  reads (the same query must not run twice per request, e.g. metadata + page);
  parallelize independent lookups instead of awaiting them serially.
- **Ship less to the client.** Default to Server Components; `"use client"`
  only for interactivity. Measure before adding client libraries.
- **Load only what first paint needs.** Above-the-fold assets load eagerly;
  optional or gated features load on demand.
- **Right-size infrastructure.** No idle preview/branch environments; jobs run
  only when relevant files change.
- **Measure, then optimize.** No bundle/CI/runtime claim without a number.
  Record a dated baseline before optimizing; re-measure after.

## What to Flag in Reviews

### Rendering & caching
- Public CMS/content reads with no cross-request cache (`use cache`/`cacheTag`
  or equivalent) while the write side already emits invalidation tags.
- A new **unconditional dynamic-forcer** (`draftMode()`, `headers()`,
  `cookies()`, `searchParams`) in a public route or shared layout — one call
  drags the whole route dynamic and blocks route/CDN caching.
- The same query executed more than once per request (e.g. in
  `generateMetadata` *and* the page) instead of deduped via a request cache.
- Serial `await` chains over independent lookups where `Promise.all` would do.
- Public HTML served `no-store`/uncacheable at the CDN without a documented
  reason.

### Assets
- The LCP / above-the-fold image rendered with `loading="lazy"` or without
  `priority`/preload — **never lazy-load the LCP image**; image wrappers must
  expose that escape hatch.
- Fonts preloaded that first paint does not need (opt-in features such as an
  accessibility font): set `preload: false` and keep them out of the
  always-loaded font module — co-location alone triggers preload.
- `sizes` claiming the full viewport for images rendered in columns
  (over-fetch); missing `sizes`; uncapped `qualities`.
- Raw `<img>` instead of the framework image component; fonts without
  `display: swap`; external font CDN; non-woff2.
- Third-party `<script>` without a loading strategy or consent gating.

### Client JS
- New `"use client"` on a component with no event handler, hook, or browser
  API.
- `import * as` barrels resolved by runtime name lookup in client code —
  defeats tree-shaking and ships the whole set (icon registries are the
  classic case).
- A registry that statically imports every variant (content blocks, widgets)
  so every page bundles all of them; lazy-load the client-heavy variants.
- A heavy library (editor, chart, map SDK) shipped to visitors who cannot
  reach the feature — auth- or state-gated features must be code-split behind
  that gate.
- Full data blobs (i18n dictionaries, config objects) serialized to the client
  when the page uses only a slice.
- Client-side polling (`setInterval`/repeated `fetch`) where a server action
  or cache tag would do.
- New runtime dependency that is really a dev tool; heavy library added
  without a bundle-size note.

### CI / infra
- A job that runs on every commit regardless of changed paths.
- No cache for dependencies / build output / type-build info between runs.
- Long-lived preview/branch deployments with no expiry.
- Duplicate work across pipelines.

### Developer workflow
- Full test suite + coverage collection blocking every local push.
- Lint/tests run over the whole tree on every commit/push instead of the
  changed files (keep the full suite as the CI merge gate; run incrementally
  locally).
- Coverage collected in watch mode.

## Anti-Patterns

- ❌ "Add `force-dynamic` to be safe" on a public, publish-bound page.
- ❌ Caching a user/auth/`draftMode`/`searchParams`-bound read cross-request.
- ❌ Optimizing bundle/CI/LCP without a measurement to compare against.
- ❌ Adding a separate skill/rule per dimension instead of one review pass.
- ❌ An audit that ends as a report only — findings become backlog items or an
  explicitly parked list, otherwise they evaporate.

## Change-Safety Checklist (AI agents)

Before proposing or applying a change, confirm:

- [ ] Net effect on compute/bandwidth/cost is neutral or positive (state it).
- [ ] No new uncached per-request read on a public path.
- [ ] No request-bound data cached cross-request.
- [ ] No new dynamic-forcer in a public route or shared layout.
- [ ] No new client component/dependency without a stated reason + size note.
- [ ] Above-the-fold assets stay eager; optional/gated assets stay lazy.
- [ ] CI impact considered (does this make a job run more often / longer?).
- [ ] Any DB migration expectation stated explicitly.
- [ ] Change is incremental, not a rewrite (prefer smallest diff that works).

## Quick Reference

| Concern | Prefer | Avoid |
| --- | --- | --- |
| Public read | cross-request cache + tags | per-request DB/CMS hit |
| LCP image | eager + `priority`/preload | `loading="lazy"` on the hero |
| Optional fonts/features | load on toggle (`preload: false`) | preload on every page |
| Interactivity | Server Component + small client island | page-wide `"use client"` |
| Variant registries (icons, blocks) | static per-variant imports / lazy client variants | `import * as` + name lookup |
| CI jobs | `rules:changes`, cached deps/build | run-everything-every-commit |
| Previews | auto-expiry | long-lived idle instances |
