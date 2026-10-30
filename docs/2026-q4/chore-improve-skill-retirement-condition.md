# Chore: improve-skill Learnings Name When They Stop Being True

## Status

<!-- draft | ready | in-progress | done -->

done

Filed 2026-10-21 from rank 9 of the October 2026 stack review
(`docs/ai-stack-review-2026-10.md`, the maintainer's untracked local copy). On
2026-10-08 it was left unfiled, to ride along with the next `improve-skill`
change. `improve-skill` has changed since without it, so it gets its own item.

## Ticket

<!-- no tracker ticket: this repo's own backlog -->

## Priority

low

## Summary

`skills/improve-skill` only ever adds learnings. When a learning rests on an
outside fact, it should name that fact and the condition under which it stops
holding, so the next edit in that area can remove it on sight instead of
relearning that it went stale.

## User Story

As the maintainer, I want each folded-in learning that depends on a tool,
platform or branch state to say when it stops being true, so that skills shed
stale rules instead of growing until they steer against a platform that moved
on.

## Acceptance Criteria

- Step 3 ("Filter to durable learnings") of `skills/improve-skill/SKILL.md`
  says what to do with a learning that rests on an outside fact (a tool flag,
  a platform limit, a version, a branch or release line, a sandbox rule). In the
  same sentence it names:
  - that fact;
  - the date the fact was checked;
  - what would make the learning false.
  A learning about this repo's own conventions needs no condition.
- Step 4 tells the editor to read the skill's existing pitfalls in the area
  being edited. A pitfall whose stated condition visibly no longer holds is
  removed in the same edit, and the report names the removal.
- The solution-note template in step 5 grows from four parts (symptom, root
  cause, fix, prevention) to five, adding "retire when".
- Step 7 ("Report once") gives each learning's line its retirement condition,
  or "permanent" for a convention.
- The edit stays within the 500-line skill budget. It adds no new section; it
  extends steps 3, 4, 5 and 7.
- An eval case under `evals/improve-skill/` covers the report. Its prompt hands
  over a written session summary with two frictions: a CLI flag that does not
  exist yet, and a repo naming convention. It asks for the step 7 report only,
  with no file edits.
  - **Graders:** the CLI learning names a retirement condition; the naming
    learning is marked permanent.
  - **Tags:** `runnable`, not `needs-scaffold`.
  - **Runs:** once with the change and once without, on the maintainer's seat.
- A changelog fragment `changelog.d/changed.improve-skill-retirement-condition.md`
  describes the change.

## How to verify

- [x] **Eval `improve-skill-1`, base against branch.**
      Command: `claude plugin eval <checkout> --case improve-skill-1 --runs 2
      --ablation none --no-publish --trust-plugin --judge-model sonnet`.
      - **`main` (`c0d4186`) with the case copied in:** 0/2, score 0.33 on both
        runs.
        - Neither run gives the `--state` learning a condition. One run wrote
          only "glab 1.46 rejects it (checked 2026-10-22)".
        - Neither run marks the branch convention permanent.
      - **This branch:** 2/2, score 1.00, $0.32.
- [x] **The case does not lean on the skill's own example.**
      - A first version used the same `glab mr create --description-file`
        fact that step 3 now gives as its example. It passed on the branch,
        2/2, but that proved little.
      - The case now uses a different flag: `glab mr list --state`.
      - Grader `a1` was tightened too. The judge had accepted a version and a
        date as a condition, and now it does not.
      - All eval runs for this item cost $1.94.
- [x] `skills/improve-skill/SKILL.md` is 194 lines, within the 500-line budget.
      Steps 3, 4, 5 and 7 are extended, and no section is added.
- [x] The pre-commit hook ran on each commit: `validate-skills.mjs` clean, the
      test suites green, and `No drift detected` (nothing is generated from this
      skill).
- **Routing evals: not triggered.** `improve-skill` has no routing cases, its
  frontmatter is unchanged, and the new case is not tagged `routing`.

## Technical Notes

- **The pattern.** It comes from Every's compound-engineering plugin, v3.29.0:
  learnings must name their retirement condition. Taken over here only for
  learnings that rest on outside facts. A condition on every convention would be
  noise.
- **The stale case it prevents, from this repo.**
  - On 2026-10-13, `skills/upstream-to-unicore` named the v4 feature branch
    `feat/declarative-cms-presets` as the template's v4 line.
  - That stopped being true on 2026-10-15, when v4 merged onto `development`.
    Someone noticed by hand, and commit 03bd6f3 (MR !212) removed it.
  - A line saying "until v4 merges onto `development`" would have flagged
    itself to whoever touched the skill next.
- **A fact already in the skills that fits the pattern.** The upstream MR rule
  says "`glab mr create` cannot carry a real MR body: there is no
  `--description-file`". That holds until `glab` ships a body-file flag. Use it
  as the example in step 3; do not rewrite the rule itself in this item.
- **Wording.** Keep it to one clause per learning, e.g. "…; holds while `glab`
  has no body-file flag (checked 2026-10)". Do not add a frontmatter field or a
  registry of conditions.
- **Eval cost.** The case has two graders, one judge call each. Expect a run
  well under the routing suite's $1.81. Use the `claude plugin eval` command
  from `evals/README.md` with `--no-publish`, and with the sandbox bypass,
  because it needs api.anthropic.com.
- **Generated files.** `commands/` has no improve-skill runbook, so nothing is
  regenerated. Check with `bash scripts/generate-adapters.sh`, which should show
  no drift.

## Out of Scope

- Sweeping the existing skills for stale learnings. The removal happens on
  touch, under the second criterion.
- A validator check for retirement conditions. A condition is prose and cannot
  be checked mechanically.
- Memory notes and `docs/solutions/` notes that already exist in client
  projects.

## Related

- [../../skills/improve-skill/SKILL.md](../../skills/improve-skill/SKILL.md)
- [../../evals/README.md](../../evals/README.md)
- https://github.com/EveryInc/compound-engineering-plugin/releases
- MR: https://gitlab.com/greenberrynl/config/ai-workflows/-/merge_requests/278
