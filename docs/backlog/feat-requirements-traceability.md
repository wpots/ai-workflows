# Feature: Requirements Traceability in the QA Gate

## Status

draft

## Priority

high

## Summary

Make "done" provable per acceptance criterion instead of asserted as a whole. Every
criterion in the ticket becomes a test, every test maps back to a criterion, and the
QA result is reported criterion by criterion rather than as one green or red.

## User Story

As a reviewer or product owner, I want to see which acceptance criteria are
demonstrably met and which are not, so that "done" is a traceable claim instead of a
green checkmark I have to trust.

## Acceptance Criteria

- [ ] A QA pass produces a traceability report: one row per acceptance criterion, with
      the test(s) that cover it and the pass/fail result.
- [ ] Criteria with no covering test are reported as **uncovered**, distinct from
      failing — an untested criterion must not read as a pass.
- [ ] Criteria that cannot be tested as written are flagged as **untestable**, with the
      reason, and named as feedback for the Definition-of-ready gate: if QA cannot test
      it, the ticket was not specified well enough.
- [ ] Tests are generated from the criteria — functional, edge, and negative cases —
      and proposed before being written, not silently added.
- [ ] The report is verified against the pinned requirements snapshot rather than live
      tracker state, so the same commit always produces the same verdict.
- [ ] The report is emitted in a form that can be posted onto the ticket or the MR, and
      is short enough to read without opening a test file.
- [ ] Existing verification surfaces are reused rather than reimplemented:
      `skills/run-checks` runs the suite, `skills/wcag-audit` covers accessibility
      criteria, `skills/code-review` covers the semantic pass.
- [ ] Placed in `docs/pipeline-map.md` and listed in
      `docs/workflow-canonical-sources.md`.

## Technical Notes

`skills/work-backlog` already treats a BLI's `## Acceptance Criteria` block as the
definition of done and reports criteria coverage in its self-review. This item promotes
that from a report the author writes to a gate artefact that a reviewer can check —
and extends it to tracker-sourced criteria.

Generating tests from criteria at QA time is deliberately later than the spec's
"tests-from-criteria at build time". Both are useful; the gate is what makes it matter,
so build the gate first and let it drive the generation.

Decide early whether this is its own skill or an extension of `skills/run-checks`. The
traceability matrix is the deliverable; where it is produced matters less than that it
is produced from the snapshot and reported per criterion.

## Out of Scope

- Visual regression against design frames (separate, needs a Figma baseline).
- Blocking the MR mechanically — first make the verdict visible and trustworthy.
- Replacing the existing project test suite or its runner.

## Related

- [../../skills/run-checks/SKILL.md](../../skills/run-checks/SKILL.md)
- [../../skills/work-backlog/SKILL.md](../../skills/work-backlog/SKILL.md)
- [../../skills/wcag-audit/SKILL.md](../../skills/wcag-audit/SKILL.md)
- [feat-ticket-drift-check.md](feat-ticket-drift-check.md)
- [../pipeline-map.md](../pipeline-map.md)
