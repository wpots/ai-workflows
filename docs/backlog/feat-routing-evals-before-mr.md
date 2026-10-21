# Feature: Run the Routing Evals Before a Skill MR Opens

## Status

done

Closed 2026-10-21 by the maintainer's decision, on the evidence under the
first check in `How to verify`. Filed 2026-10-12 as the alternative to slice 3 of the skill evals (task T4 of
the AI stack reviews). Slice 3 runs the routing suite in GitLab CI, which needs
an API key and a monthly cap, and the maintainer decided on 2026-10-08 to keep
eval spend manual, on her own seat. This item arms the same suite in the
workflow instead: the MR flow runs it when a change can break routing, so it no
longer depends on someone remembering to.

## Priority

medium

## Summary

When a branch adds a skill, edits the frontmatter of a skill that has routing
cases, or edits a routing case, run the routing suite before the merge request
opens and put the result in the MR description. A routing failure stops the MR
the way a failing migration check does.

## User Story

As the maintainer of the skill library, I want a skill MR to arrive with its
routing result already in the description, so that a `description` edit that
stops a skill from triggering is caught before review, without a CI key or a
monthly CI bill.

## Acceptance Criteria

- [ ] The pre-flight of `skills/create-pr` gets a routing-eval step next to the
      migration check. It fires only when the repository has eval cases tagged
      `routing` under `evals/` and the branch diff against the base does at least
      one of these:
  - adds a `skills/<name>/SKILL.md` (a new description can take over another
    skill's requests);
  - changes the frontmatter (`name`, `description`, `when_to_use`) of a skill
    that has routing cases;
  - adds or changes a routing case under `evals/`.
- [ ] In every other repository, and for a branch that changes only skill
      bodies, references or non-routing cases, the step does nothing and costs
      nothing.
- [ ] When it fires, the step runs the routing-suite command documented in
      `evals/README.md` without asking first. Its cost is bounded by the
      command's `--max-cost-usd 3`, and it fires on about eight MRs a month
      (see Technical Notes).
- [ ] All cases pass: the MR description gets one line with the result, the
      cost and the date, e.g. `Routing evals: 10/10 pass ($1.57, 2026-10-12)`.
- [ ] A case fails: the step stops before the push and names the case, the skill
      and the grader. It continues only once the case passes or the user accepts
      the failure, and an accepted failure is written into the MR description with
      the case name. It never loosens or deletes the case to get a pass.
- [ ] The run cannot happen (no network, no auth, sandbox refusal, cost ceiling
      hit): the MR description says `Routing evals: not run — <reason>` with the
      command to run, and the step never reports a pass it did not see.
- [ ] A frontmatter edit to a skill with no routing cases adds the line
      `Routing evals: <skill> has no routing cases` to the MR description,
      instead of running the suite for skills the edit cannot affect.
- [ ] An `improve-skill` edit that lands through the upstream MR flow (which
      opens the MR with `glab`, not through `skills/create-pr`) runs the same
      step under the same conditions.
- [ ] `docs/pipeline-map.md` shows the Skill-change health gate as armed by the
      MR flow on routing-relevant changes, not in CI; gap 12 is updated to match.
- [ ] `docs/backlog/feat-skill-eval-harness-3-ci-job.md` records that it is parked
      in favour of this item, and its revisit condition: a routing failure in
      practice, or routing cases for more than the five risky skills.

## How to verify

- [x] After merge, on the next MR that adds a skill or edits a skill's
      `description`: open it through `skills/create-pr` and confirm the
      pre-flight runs the routing suite (the sandbox-bypass prompt appears) and
      the MR description carries a `Routing evals: …` line. Not checked before
      merge: the installed plugin is still the old copy, so no real `create-pr`
      run could load the new step. Set this item to `done` when it is ticked.
      Ticked on 2026-10-21 by the maintainer's decision, on what was observed.
      This item merged as 8314aad on 2026-10-13. Between that merge and
      `bc2f6b8` (2026-10-21):
      - 16 merged MRs carry a `Routing evals:` decision line. That excludes
        !183 itself and release MR !203, which only quotes the changelog.
      - Four of them say "has no routing cases", correctly:
        - !191 changed the `description` of `upstream-to-unicore`.
        - !200 is `backlog`.
        - !212 is `upstream-to-unicore`.
        - !229 is `release` and `mr-merged`.
        The other twelve say "not triggered" or "not run" and name the reason.
      - **Not observed live: a run of the suite from the pre-flight.** No MR in
        that window added a skill (`git diff --name-status 8314aad bc2f6b8 --
        'skills/*/SKILL.md'` lists only `M`). No MR changed the `name`,
        `description` or `when_to_use` of the five skills with routing cases
        (frontmatter compared per skill between the two commits). No MR changed
        a routing-tagged case: the new cases `work-backlog-4` and
        `work-backlog-5` carry no `routing` tag.
      - The run itself was shown by hand on this branch (the next check). The
        first MR that does trigger it is the first live proof. If that MR does
        not run the suite, file a bug against `skills/create-pr` step 5. Do not
        reopen this item.
- [x] `claude plugin eval <worktree> --tag routing --runs 1 --ablation none
      --no-publish --trust-plugin --judge-model sonnet --max-cost-usd 3` (the
      command in `evals/README.md`, with sandbox bypass) → 10 case(s), 10/10
      pass, 192 s, $1.81. `aggregates.casesPassed`, `aggregates.casesTotal` and
      `costUsd` in `evals/results/<run>/aggregate-result.json` hold the numbers
      the result line uses.
- [x] Trigger test on this branch: `git diff --name-status gitlab/main...HEAD
      -- 'skills/*/SKILL.md' 'evals/**'` → `M evals/README.md`, `M
      skills/create-pr/SKILL.md`. The `create-pr` hunks start at line 83, below
      the frontmatter, so this MR itself does not trigger the step.
- [x] Trigger test on a skill-adding commit: `git diff --name-status 0ca7b5b^
      0ca7b5b -- 'skills/*/SKILL.md' 'evals/**'` → `A
      skills/greenberry-maintenance/SKILL.md`.
- [x] `git grep -l -E '^tags:.*routing' -- 'evals/*/*/prompt.md'` → the ten
      routing cases of the five risky skills.
- [x] `node scripts/validate-skills.mjs` → 38 skills, 93 docs link-checked, no
      errors; `claude plugin validate .` passes (warnings about commands without
      frontmatter and the root `CLAUDE.md` were there before).
- [x] `bash scripts/generate-adapters.sh` → no drift after the generator wrote
      `AGENTS.md`, `.claude/rules/upstream-mr.md`,
      `.github/copilot-instructions.md`, `skills/upstream-rules/references/upstream-mr.md`
      and `.github/prompts/create-pr.prompt.md`; the pre-commit hook passes.
- Not run: the failure path (a case that fails) and the cannot-run path. Both
  are instructions to the model in `evals/README.md`; no case fails today, and
  breaking one on purpose would spend another run to prove prose.

## Technical Notes

Where it goes:

- `skills/create-pr/SKILL.md` § 3 Pre-flight Checks: a new step right after
  step 4 (Migration check), which it mirrors: a conditional delegation that
  stops on failure and continues once the failure is fixed or accepted.
  `skills/work-backlog` ends in `skills/create-pr`, so loop MRs are covered
  without a change there.
- The upstream MR flow: one line before the `glab mr create` bullet that
  points at the same procedure. `improve-skill` step 4 reaches its MR through
  `skills/upstream-rules/references/upstream-mr.md`, but that file's body is
  generated: `scripts/generate-adapters.sh` injects `shared/upstream-mr.md`
  between its `BEGIN SHARED:upstream-mr` markers, and into
  `.claude/rules/upstream-mr.md` as well. Edit `shared/upstream-mr.md`, run
  the generator (the pre-commit hook does it), and stage both generated files.
  Never edit inside the markers.
- The procedure (trigger test, command, result line) has one home: a
  `## Before a skill MR` section in `evals/README.md`. `skills/create-pr` and
  the upstream reference point at it; neither copies the command, so a flag
  change in the README cannot drift.
- If `commands/create-pr.md` materially diverges after the skill change, give
  it the compact version. The pre-commit hook regenerates
  `.github/prompts/create-pr.prompt.md`; stage it and commit again.
- Skill change, so add a changelog fragment
  `changelog.d/added.routing-evals-before-mr.md`. Do not touch `CHANGELOG.md`
  or the plugin version.

Trigger test, deterministic and free:

- `git diff --name-status <base>...HEAD -- 'skills/*/SKILL.md' 'evals/**'`
  lists the candidates. `A` on a `SKILL.md` is a new skill.
- For a modified `SKILL.md`, compare the frontmatter block (between the first
  two `---` lines) of `git show <base>:<path>` with the branch version. A body
  edit does not trigger.
- "Has routing cases" means some `evals/<skill>/*/prompt.md` lists `routing` in
  `tags`. A routing case under `evals/` is changed when its `prompt.md` or any
  `graders/*.md` file is in the diff.

Cost and frequency, measured 2026-10-12 over the month before:

- 37 merged MRs touched `skills/` or `evals/`; 13 of them changed a
  `description:` line. Of those 13, 6 added a skill and 2 edited `create-pr`,
  the one routing-set skill among them. The other 5 edited skills without
  routing cases and get only the "no routing cases" line. So about 8 runs a
  month.
- The routing suite costs $1.57 for its 10 cases (slice 2, 2026-10-08). Routing
  graders are `tool_used`, so no judge calls; most of the cost is should-fire
  runs continuing after the skill loads. So roughly $12–15 a month on the
  maintainer's seat, against CI running on every push of 37 MRs.
- `--max-cost-usd 3` caps a single run at about twice its measured cost. Exit
  code 2 means the cap stopped it; report it as "not run — cost ceiling".

Running it:

- `claude plugin eval` needs api.anthropic.com and writes to `/tmp`, so inside
  the Claude Code sandbox it needs the sandbox bypass. The permission prompt
  that brings up is expected; a refusal falls under "cannot happen".
- Always `--no-publish`: the report is otherwise published to claude.ai, and
  the prompts name client projects.
- One run per MR, on the pre-flight before the first push. A later push that
  changes routing-relevant files again runs the step again; other pushes do
  not.
- `--runs 1` matches the documented command. No case has shown flakiness yet
  (10 of 10 in the slice-2 run). If one does, raise `--runs` in
  `evals/README.md` instead of adding a retry here.

## Out of Scope

- A CI job, an API key or a CI spend cap: slice 3, parked.
- Output cases and the `needs-scaffold` cases: routing only, because a routing
  failure is what a `description` edit causes.
- Routing cases for more skills. They earn one when a skill fails to trigger,
  through `skills/improve-skill`.
- A hook that blocks `git push`. The step is model guidance inside the MR flow,
  like the migration check, not a mechanical gate.

## Related

- [feat-skill-eval-harness-2-routing-cases.md](feat-skill-eval-harness-2-routing-cases.md): the routing suite this runs
- [feat-skill-eval-harness-3-ci-job.md](feat-skill-eval-harness-3-ci-job.md): the CI variant, superseded by this item
- [chore-create-pr-self-review-preflight.md](chore-create-pr-self-review-preflight.md): the next pre-flight addition to `skills/create-pr`; both edit § 3, so deliver one at a time
- [../../skills/create-pr/SKILL.md](../../skills/create-pr/SKILL.md)
- [../../evals/README.md](../../evals/README.md)
- [../pipeline-map.md](../pipeline-map.md)
- MR: https://gitlab.com/greenberrynl/config/ai-workflows/-/merge_requests/183
