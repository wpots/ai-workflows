# Chore: create-pr Runs A Self-review Before The First Push

## Status

<!-- draft | ready | in-progress | done -->

done

**Timing: do not start while !143 is open.** !143
(`improve/commit-staging-hygiene`) also rewrites `skills/create-pr` and
`commands/create-pr.md`; deliver this item after it is merged or closed, from a
fresh `main`. `feat-routing-evals-before-mr.md` added step 5 to the same
pre-flight; it is merged (`in-progress` only for its post-merge check), so it no
longer blocks.

Readiness pass 2026-10-13: cut to the self-review. The monitor half is
delivered: step 7 of `skills/create-pr` waits out the MR pipeline's setup stage,
reports a failed job with its log, and offers `skills/watch-mrs`; the recap's
`Checks` row names the stage reached. The ticket-drift half is dropped, because
the check it would call is parked (`docs/pipeline-map.md`, gap 2). Renamed from
`chore-create-pr-preflight-and-monitor.md`.

## Priority

high

## Summary

`skills/create-pr` runs `skills/code-review` over the branch diff before the
first push, stops on correctness and security findings until they are fixed or
waived, and lists the rest in the MR, so a reviewer no longer finds what a
self-review would have caught.

## User Story

As a developer opening a merge request, I want the diff reviewed before it is
pushed, so that the human reviewer spends the round on what a self-review cannot
see.

## Acceptance Criteria

- `skills/create-pr` § 3 "Pre-flight Checks" gains a self-review step after the
  routing-evals step: run `skills/code-review` once over `<base>...HEAD`, before
  the first push.
- A finding tagged `[correctness]` or `[security]` stops the flow until the user
  fixes it or waives it explicitly, one finding at a time.
- Findings with any other lens tag never stop the flow. They are listed in the
  recap's `Open items` row and in the MR description, with their `file:line`.
- A waived finding appears in the MR description with the reason the user gave,
  so the reviewer sees it.
- When `skills/work-backlog` already reviewed the same commit in its step 7
  during this session, the step does not review again and says so in the recap.
- The step runs no lint, type-check, test or build. The single checks sweep the
  skill already runs stays the only one.
- The recap table gains a `Self-review` row after `Checks`: ✅ with the number of
  findings, ⚠️ when a finding was waived, or ➖ with the reason it was skipped.
  The row is never dropped.
- `commands/create-pr.md` says the same as the skill, and
  `.github/prompts/create-pr.prompt.md` is regenerated.
- An eval case under `evals/create-pr/` asserts that a `[correctness]` finding
  stops the flow and a `[docs]` finding does not, following `evals/README.md`.
  If the case needs repository state to run, it is tagged `needs-scaffold` and
  the MR says so.
- `docs/pipeline-map.md` gap 1 is marked delivered.
- A changelog fragment `changelog.d/changed.create-pr-self-review.md` records
  the change.

## How to verify

- `claude plugin eval <checkout> --case create-pr-6 --runs 1 --ablation none
  --no-publish --trust-plugin --judge-model sonnet --max-cost-usd 1` → score
  1.00, a1–a3 and `skill-fired` pass ($0.24, 2026-10-21).
- The same case against `main` without this change → score 0.50: a1 passes (the
  `[correctness]` finding stops the push anyway), a2 and a3 fail (the push
  waits on the `[docs]` finding, which never reaches the MR description).
- `node scripts/validate-skills.mjs` → 38 skills, no errors.
- `scripts/generate-adapters.sh` → `.github/prompts/create-pr.prompt.md`
  regenerated from `commands/create-pr.md`.
- Routing evals not run: only the body of `skills/create-pr/SKILL.md` changes,
  not its frontmatter, and `create-pr-6` is not a routing case.

## Technical Notes

Copy the shape of the existing pre-flight steps 4 (migration check) and 5
(routing evals): state the condition, delegate, define what happens on a failure.
Keep the step to a short paragraph; the review logic stays in
`skills/code-review`.

Why the lens tags and not a severity level: `skills/code-review` orders findings
by severity but names no levels, while every finding carries one lens tag
(`[correctness]`, `[security]`, `[perf]`, `[a11y]`, `[architecture]`,
`[type-safety]`, `[docs]`, `[tests]`). Correctness and security are the two whose
findings do harm when shipped. Widen the set later from evidence, not up front.

The skill body changes, not its frontmatter, so step 5's routing evals do not
run for this MR.

Large diffs: `skills/code-review` already fans out to one subagent per lens above
about 15 files or 800 changed lines. That is the cost of this step on a big MR;
do not add a second size rule here.

## Out of Scope

- A ticket-drift check (parked, `docs/pipeline-map.md` gap 2).
- Watching the MR after it opens (delivered in step 7) and how
  `skills/watch-mrs` polls.
- Auto-merge.
- Changes to `skills/code-review` or `skills/work-backlog`.

## Related

Depends on: feat-routing-evals-before-mr.md

- [../../skills/create-pr/SKILL.md](../../skills/create-pr/SKILL.md)
- [../../commands/create-pr.md](../../commands/create-pr.md)
- [../../skills/code-review/SKILL.md](../../skills/code-review/SKILL.md)
- [feat-routing-evals-before-mr.md](feat-routing-evals-before-mr.md)
- https://gitlab.com/greenberrynl/config/ai-workflows/-/merge_requests/143
- [../pipeline-map.md](../pipeline-map.md) — gap 1
