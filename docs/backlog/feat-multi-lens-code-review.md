# Feat: Multi-Lens Code Review Sweep

## Status

done

## Priority

medium

## Summary

`skills/code-review` ordered findings by severity but had no mechanism that
forces each review dimension to actually be examined — on a large diff the
model gravitates to correctness and type safety and silently under-reviews
security, accessibility, or test coverage. Make the dimensions an explicit
lens sweep (one deliberate pass per lens) that merges into the existing
single severity-ordered list, with a parallel-subagent path for large diffs.
Pattern borrowed from Every's compound-engineering multi-perspective review
(they run 12+ parallel review agents; eight lenses is the right size here).

## User Story

As a developer requesting a code review, I want every review dimension swept
deliberately, so that a big diff cannot pass review with an unexamined
security or accessibility surface.

## Acceptance Criteria

- [x] `skills/code-review` step 2 lists eight lenses (correctness, security,
      performance/sustainability, accessibility, architecture, type safety,
      documentation freshness, test coverage), each pointing at its rule
      file where one exists.
- [x] Findings merge into ONE severity-ordered list; each finding carries a
      lens tag; the existing output sections are unchanged.
- [x] Large diffs (>~15 files or >~800 changed lines) run one subagent per
      lens, each reading only the diff plus its rule file; merged findings
      need a concrete `file:line` anchor to survive.
- [x] The fallback runbook (`commands/review-code.md`) carries a compact
      version of the sweep.
- [x] Plugin bumped to 1.10.0 with a changelog entry.

## Technical Notes

- Deliberately NOT a set of separate review skills: the lens list lives
  inside the one canonical code-review workflow, matching the existing
  design decision ("one general review workflow, extended").
- Test-coverage is a new lens — nothing in the skill previously asked
  whether changed behaviour has a changed test.
- The subagent threshold is a heuristic, not a hard rule; small diffs sweep
  lenses inline.

## Out of Scope

- Changing the posting mechanics or output sections.
- Review quality metrics (resolution-rate tracking) — separate task.
- CI-triggered reviews — separate task.

## Related

- [../../skills/code-review/SKILL.md](../../skills/code-review/SKILL.md)
- [../../commands/review-code.md](../../commands/review-code.md)
- [../../rules/testing.md](../../rules/testing.md)
