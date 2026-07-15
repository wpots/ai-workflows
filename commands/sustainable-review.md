# Sustainable IT Review (Runbook)

Fallback/compatibility runbook for the `sustainable-review` skill. Use on
Copilot or any prompt-first tool. Policy: `rules/sustainability.md`.

## Safety

- Read-only until the user approves backlog items or patches.
- No `migrate*` commands. Flag migration expectations only.
- Smallest incremental change wins; never propose a rewrite.

## Inputs (ask one at a time)

1. Scope? (branch diff / path / whole repo)
2. Dimensions? (default: all — rendering/caching, assets, bundle/client JS,
   dependencies, CI/CD, developer workflow, a11y-as-performance)
3. Output? (summary only / also draft `docs/backlog/` items)

## Phase 1 — Map scope

Resolve files/area in scope; detect stack from `package.json`; load
`rules/sustainability.md`, the project's architecture/read-path rule, and
`CONVENTIONS.md`. Verify any performance claims in local docs against the
code before relying on them.

## Phase 2 — Audit per dimension

Walk the rule's "What to Flag" for: rendering/caching (uncached public reads,
dynamic-forcers, duplicate queries, serial awaits), assets (lazy LCP images,
preloaded optional fonts, wrong `sizes`), bundle/client JS (barrel registries,
gated features not code-split, data blobs), dependencies, CI/CD, developer
workflow, a11y-as-performance. Record `file:line` evidence. Quantify with a
dated baseline (Lighthouse/bundle bytes) or mark "unverified — needs
measurement".

## Phase 3 — Rank & safety

Sort by impact ÷ effort; separate quick wins from team-alignment items; run
the Change-Safety Checklist on each proposed change.

## Output

Severity-ordered report (Already good / Findings with impact·effort·risk·why /
Quick wins / Needs team alignment). On approval, draft `docs/backlog/` items
per the backlog conventions, each noting DB-migration expectation. Findings
that are consciously skipped go on an explicit parked list — an audit that
ends as a report only evaporates.
