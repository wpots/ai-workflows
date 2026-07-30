# Feature: Verification Evidence in the QA Gate

## Status

draft

Rescoped 2026-07-30 from "per-criterion traceability matrix" to "verification
evidence". The matrix form was blocked on two things that never arrived: a
maintainer decision on the owning surface, and the requirements snapshot from
feat-ticket-drift-check, which is unbuilt, undecided in format, and now
deliberately parked (see the build order in `docs/pipeline-map.md`). The
evidence form needs neither: it verifies against the BLI's own
`## Acceptance Criteria`, which is already in the branch.

## Priority

high

## Summary

Make a QA pass end in a re-runnable check instead of a prose claim. Today
`skills/work-backlog` writes `How to verify` from what it actually ran, which is an
honest report — but confirming it means redoing the work. Every criterion that can be
covered by a command gets one, the command and its output land in the MR, and criteria
that cannot be covered that way are named as such rather than quietly folded into a
green summary.

## User Story

As a reviewer, I want the criteria a change claims to meet backed by a command I can
paste and an output I can compare, so that trusting the claim is optional.

## Acceptance Criteria

- [ ] A QA pass emits a verification block per delivered item: for each acceptance
      criterion, the command that exercises it and the observed result.
- [ ] Every command in that block is re-runnable by a reviewer from the branch, with no
      state left over from the authoring session — a step only a live agent could
      perform does not count as evidence.
- [ ] Criteria with no covering command are reported as **unverified**, distinct from
      failing, and the report states why (needs a human judgement call, needs the design,
      needs production data).
- [ ] Criteria that cannot be tested as written are flagged as **untestable**, with the
      reason, and named as feedback for the Definition-of-ready gate: if QA cannot test
      it, the ticket was not specified well enough.
- [ ] UI-affecting criteria may carry a screenshot or a preview URL as their evidence —
      the accepted lighter form of visual verification, per
      `docs/pipeline-map.md`.
- [ ] The block is short enough to read in the MR description without opening a test
      file, and is generated, never hand-written.
- [ ] Existing surfaces are reused rather than reimplemented: `skills/run-checks` runs
      the suite, `skills/wcag-audit` covers accessibility criteria,
      `skills/code-review` covers the semantic pass.
- [ ] Verification runs against the BLI's `## Acceptance Criteria` in the branch — no
      dependency on a tracker snapshot, so the same commit always produces the same
      verdict.
- [ ] `docs/pipeline-map.md` gap 10 and the QA gate row updated to match what shipped.

## Technical Notes

Extend `skills/work-backlog`'s existing `How to verify` step rather than adding a
skill — the step already exists, already runs at the right moment, and already knows
which criteria it covered. What changes is its output contract: a command plus a result
per criterion instead of prose steps.

This is the Anthropic-style verification loop applied to the delivery skill: the agent
must produce evidence, not a claim. `skills/address-review-comments` should end the same
way once the shape is proven here.

A per-criterion machine mapping — criterion id → test id → result, generated tests from
criteria — stays possible later. Build the evidence habit first; it is what makes the
mapping worth anything.

## Out of Scope

- Generating tests from criteria (later, and only once evidence is habitual).
- A criterion-to-test-id matrix or any tracker-side traceability artefact.
- Pixel-level visual regression against a design baseline (⛔ out of scope in
  `docs/pipeline-map.md`).
- Blocking the MR mechanically — first make the evidence visible and trustworthy.

## Related

- [../../skills/work-backlog/SKILL.md](../../skills/work-backlog/SKILL.md)
- [../../skills/run-checks/SKILL.md](../../skills/run-checks/SKILL.md)
- [../../skills/wcag-audit/SKILL.md](../../skills/wcag-audit/SKILL.md)
- [feat-ticket-drift-check.md](feat-ticket-drift-check.md)
- [../pipeline-map.md](../pipeline-map.md)
