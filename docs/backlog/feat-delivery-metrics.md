# Feat: Delivery Metrics Lane in the Maintenance Sweep

## Status

done

## Priority

medium

## Summary

Nothing measures what the AI stack actually delivers: agent-authored share,
review cycle time, and revert rate are invisible, so the ROI conversation
runs on anecdotes. Frontrunners (Ramp, Anthropic, Shopify, Atlassian) track
exactly these numbers weekly. Start lightweight: a read-only script computes
the measurable subset from git + glab, and the monthly maintenance sweep
reports it with the previous sweep as baseline.

## User Story

As the maintainer of the AI stack, I want delivery metrics per project per
month, so that adoption and quality trends are visible before they become
opinions.

## Acceptance Criteria

- [x] `scripts/delivery-metrics.mjs` (zero-dep, Node 18+, read-only)
      reports: merged MRs in window, median hours MR-created → merged,
      agent-authored commit share via `Co-Authored-By: Claude` trailers,
      revert count. glab absence degrades gracefully to git-only numbers.
- [x] `skills/maintenance` gains lane H running the script and reporting
      the **delta vs the previous sweep**; report template gains a
      Delivery-metrics row.
- [x] Honest limits stated in output and skill: squash merges undercount
      the trailer share; intervention rate is `n/a` until session
      telemetry exists.
- [x] Plugin bumped to 1.12.0 with a changelog entry.

## Technical Notes

- Commit-level metrics come from `git log origin/<default-branch>` with
  `--since`; MR-level metrics from
  `glab api "projects/:id/merge_requests?state=merged&updated_after=…"`
  run with the project as cwd (`:id` resolves from the repo's remote).
- The script prints markdown so the sweep pastes it verbatim.
- Deliberately not a dashboard, not CI-scheduled, not org-wide aggregation —
  monthly per-project via the sweep is the cheapest habit that makes trends
  visible. Revisit automation once two or three sweeps exist to compare.

## Out of Scope

- Session-telemetry-based intervention rate.
- Cross-project aggregation or dashboards.
- Scheduling the script in CI.

## Related

- [../../scripts/delivery-metrics.mjs](../../scripts/delivery-metrics.mjs)
- [../../skills/maintenance/SKILL.md](../../skills/maintenance/SKILL.md)
