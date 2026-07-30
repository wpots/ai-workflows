# Feature: Eval Harness for Skills

## Status

draft

Filed 2026-07-30 from the July 2026 stack review (finding: one eval file across
the whole repo, and nothing runs it) together with the new Skill-change-health
gate in `docs/pipeline-map.md`. Autonomously runnable: the seed format exists
and the runner is a script, not a decision.

## Priority

high

## Summary

Give the Improve lane the gate every other phase already has. A skill edit is currently
verified by a human reading a markdown diff — nothing checks that the edited skill still
triggers on the same intent or still produces what it produced before. Ship a runner
over the existing `evals.json` format, seed evals for the riskiest skills, and run them
in CI.

## User Story

As the maintainer of a skill library that drives every other phase, I want a changed
skill to fail a check when it stops triggering or stops delivering, so that
`skills/improve-skill` edits are protected the same way code changes are.

## Acceptance Criteria

- [ ] A runner script (`scripts/run-evals.mjs`) executes the eval cases of one skill, of
      a named subset, or of every skill that has an eval file.
- [ ] The eval file format is the one `skills/component-spec/evals/evals.json` already
      uses — prompts plus assertions — extended only where the runner genuinely needs it,
      and documented where a skill author will look for it.
- [ ] Two case kinds are supported and reported separately: **routing** (does this prompt
      reach this skill at all) and **output** (does the run satisfy the assertions).
- [ ] Assertions are checked by a judged pass/fail with the failing assertion named — a
      diff of free text is not a result anyone will act on.
- [ ] Evals exist for the five riskiest skills: `skills/work-backlog`,
      `skills/create-pr`, `skills/code-review`, `skills/start-project`,
      `skills/refinement`.
- [ ] A CI job runs the suite; a failure names the skill, the case, and the assertion.
      The job may be manual or scheduled if per-MR cost is unreasonable — state which and
      why in `.gitlab-ci.yml`.
- [ ] `skills/improve-skill` gains a closing step: a change that fixed a failure adds or
      updates the eval case that would have caught it, so the failure becomes a
      regression test rather than a memory.
- [ ] `scripts/validate-skills.mjs` warns when a skill in the risky set has no eval file.
- [ ] Placed in `docs/pipeline-map.md` (Skill-change-health gate → automated) and listed
      in `docs/workflow-canonical-sources.md`.

## Technical Notes

Run the cases headless (`claude -p`) from the repo checkout so the skill under test is
loaded from source rather than from the installed plugin — an eval that passes against a
stale install is worse than no eval.

Cost is the reason this has not happened yet, so make it explicit: keep the case set
small per skill (routing cases are cheap, output cases are not), and let the CI job be
scheduled rather than per-MR if that is what keeps it running at all.

Routing cases are the higher-value half and nobody expects it: most skill regressions
are a description edit that quietly stops matching the intent it was written for.

## Out of Scope

- Blind A/B comparison or benchmark scoring between skill versions.
- Evals for every skill — the risky set first, the rest as they earn it.
- Replacing human review of skill diffs; this gate runs before that review, not
  instead of it.

## Related

- [../../skills/improve-skill/SKILL.md](../../skills/improve-skill/SKILL.md)
- [../../skills/component-spec/evals/evals.json](../../skills/component-spec/evals/evals.json)
- [../../scripts/validate-skills.mjs](../../scripts/validate-skills.mjs)
- [../pipeline-map.md](../pipeline-map.md)
