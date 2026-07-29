# Feature: Jira Feedback Loop — Triage, Reproduce, Propose

## Status

draft

Readiness pass 2026-07-29 — blocked on two maintainer decisions: this adds a
third sanctioned tracker write (commenting on tickets) against the repo-wide
read-only policy, and no AC names the deliverable surface (new skill vs
extension of address-review-comments). Build last of the tracker chain, after
feat-ticket-drift-check and feat-requirements-traceability (it consumes the
snapshot and reuses the QA gates).

## Priority

high

## Summary

Close the return arc of the pipeline: a comment lands on a ticket, and the workflow
classifies it, reproduces it as a failing test, fixes it until the test goes green, and
opens a **draft** MR that re-enters the pipeline at QA and Review like any other change.
The guardrails are the feature — triage before fix, reproduce before fix, human gate at
merge.

## User Story

As a developer, I want feedback comments on a ticket to arrive as a draft MR with a
failing-then-passing test and a root-cause note, so that I review a proposal instead of
starting from a sentence someone typed three days ago.

## Acceptance Criteria

- [ ] **Triage first.** The workflow classifies each comment before acting:
      actionable defect / question / scope change / noise. Only an actionable defect
      proceeds; a question gets answered on the ticket, a scope change is escalated to
      a human, noise is ignored — and the classification is stated with its reason.
- [ ] **Reproduce before fixing.** The feedback is turned into a failing test that
      demonstrates the problem. If it cannot be reproduced, the workflow posts a
      specific clarifying question on the ticket and **stops** — it never guesses a fix.
- [ ] The fix is driven by that test: implement until green, following the project's
      conventions from `rules/` and `CONVENTIONS.md`.
- [ ] The result is a **draft** MR, linked to the ticket, containing the test, the fix,
      and a root-cause note; plus one comment back on the ticket explaining what was
      done.
- [ ] The MR passes the same gates as a human-authored change — `skills/run-checks`,
      the QA pass, `skills/code-review` — with nothing skipped or downgraded because it
      was AI-authored.
- [ ] Merge is always a human decision. No auto-merge path, regardless of how green the
      pipeline is.
- [ ] Review comments on that draft MR loop back into the fix step via
      `skills/address-review-comments` rather than a second parallel mechanism.
- [ ] Scope is confirmed per invocation: which ticket(s), which comments, and a
      hard limit on how many are processed in one run.
- [ ] Placed in `docs/pipeline-map.md` and listed in
      `docs/workflow-canonical-sources.md`.

## Technical Notes

The two failure modes to design against: confidently "fixing" a misclassified comment,
and a fix that passes its own narrow reproduction test while breaking what that test
never covered. The human merge gate and the full QA pass catch both — which is exactly
why neither may be skipped for an AI-authored MR.

`skills/address-review-comments` already handles comments on an **MR**; this is the
same shape one level out, on the **ticket**, and should reuse its propose-then-apply
discipline rather than reimplementing it. `skills/receiving-code-review` is the
precedent for pushing back on feedback that is wrong instead of implementing it.

Reproduction leans on the pinned requirements snapshot plus ticket history and linked
MRs, so state what the workflow needs to read before it starts, and fail loudly when
that context is unavailable.

Comment volume is the practical risk. Process explicitly selected comments; never
"everything new since yesterday" by default.

## Out of Scope

- Any auto-merge of an AI-authored fix.
- Acting on comments in other trackers or on Slack messages.
- Production incident triage (correlating an error spike to recent MRs) — related but a
  different input and a different gate.

## Related

- [../../skills/address-review-comments/SKILL.md](../../skills/address-review-comments/SKILL.md)
- [../../skills/receiving-code-review/SKILL.md](../../skills/receiving-code-review/SKILL.md)
- [../../skills/test-driven-development/SKILL.md](../../skills/test-driven-development/SKILL.md)
- [feat-ticket-drift-check.md](feat-ticket-drift-check.md)
- [feat-requirements-traceability.md](feat-requirements-traceability.md)
- [../pipeline-map.md](../pipeline-map.md)
