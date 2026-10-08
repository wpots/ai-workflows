# Feature: Skill Evals on `claude plugin eval` — Convert and Run Locally

## Status

in-progress

Rewritten 2026-10-08 from the October 2026 stack review. The July draft planned
a custom runner (`scripts/run-evals.mjs`). Claude Code v2.1.269 ships
`claude plugin eval`, so this item converts the existing cases and builds no
runner. Premise corrections against `main`: 12 of 38 skills have
`evals/evals.json` (the draft said one), and of the five skills the draft named
as riskiest only `create-pr` has one. `skills/improve-skill/SKILL.md` step 5
already tells authors to add an eval case, so only its target path changes.

## Slice

1/3 — convert the existing cases and run them locally

## Priority

high

## Summary

Move the 12 existing `skills/*/evals/evals.json` files onto the format
`claude plugin eval` reads, so a skill edit can be checked by running a command
instead of by a human reading a markdown diff. Local run only; the new cases
for the riskiest skills are slice 2, the CI job is slice 3.

## User Story

As the maintainer of a skill library that drives every other phase, I want to
run one command and see whether an edited skill still triggers and still
delivers, so that `skills/improve-skill` edits are protected the same way code
changes are.

## Acceptance Criteria

- [x] A one-off conversion script (kept in the scratchpad, not committed) reads
      every `skills/<skill>/evals/evals.json` and writes one case directory per
      eval: `evals/<skill>/<skill>-<id>/`
      holding `prompt.md` (frontmatter `tags: [<skill>, runnable]` or
      `[<skill>, needs-scaffold]`, `max_turns: 10`,
      `allowed_tools: [Read, Glob, Grep, Skill]`, `expected_outcome` from the
      file's `expected_output`; body is the `prompt`) and
      `graders/criteria.md` (`type: llm`; one `PASS if every one of these
      holds` line with the `assertions` as a numbered list, then one `FAIL if`
      line that names the numbered assertion that failed — one judge call per
      case, not one per assertion).
- [x] Each converted case also gets `graders/skill-fired.md` (`type: tool_used`,
      `tool: Skill`, `input_match` on the skill's directory name, including the
      `greenberry:` namespaced form).
- [x] A case whose prompt needs files, a git repository or `glab`/`jira` (an
      eval run starts in an empty workspace with no `CLAUDE.md`, hooks or other
      plugins) is tagged `needs-scaffold` and listed in `evals/README.md` with
      what it would need. It is not dropped and not silently run.
- [x] After conversion the 12 `skills/*/evals/evals.json` files are deleted in
      the same MR — one format, no drift — and `skills/improve-skill/SKILL.md`
      step 5 points at `evals/<skill>/`.
- [x] `evals/results/` is gitignored, and `claude plugin validate .` and
      `node scripts/validate-skills.mjs` still pass with `evals/` at the plugin
      root.
- [x] `docs/contributing.md` § Add Or Update A Skill documents where cases
      live, the case layout, and the local loop
      (`claude plugin eval . --tag <skill> --runs 1 --ablation none --no-publish
      --trust-plugin --max-cost-usd 3`).
- [x] `docs/pipeline-map.md` (Skill-change health row, the evals inventory row,
      gap row 12) says a local runner exists and the CI job is slice 3.

## How to verify

Stays `in-progress` until the first check below is ticked: a live run needs a
network and a model account, which the delivering run did not have.

- [ ] A live run, by the maintainer: `claude plugin eval . --tag runnable --runs 1
      --ablation none --no-publish --trust-plugin --max-cost-usd 10`. Expect 6
      cases to run; read each verdict. A `criteria` verdict that fails is a
      finding about the skill or the assertion, not about the conversion.
- [x] `node scripts/validate-skills.mjs` — 38 skills validated, 88 docs
      link-checked, no errors, with the 12 `evals.json` files gone.
- [x] `claude plugin validate .` — "Validation passed" (it validated
      `.claude-plugin/marketplace.json`) with `evals/` at the plugin root.
- [x] `claude plugin eval . --case component-spec-3 --runs 1 --ablation none
      --no-publish --trust-plugin` in a sandbox with no network: the harness
      loaded the case, identified plugin `greenberry` 2.5.0 and reached the run
      step, then stopped with `EPERM … mkdtemp '/tmp/…'` at $0.00. That shows
      the case files parse; it does not show a verdict.
- [x] `git check-ignore -v evals/results/<run>/report.html` — matched by
      `.gitignore:9 evals/results/`; the run above wrote that folder and
      `git status` did not list it.
- [x] Counts: 42 `prompt.md` and 42 `graders/criteria.md` under `evals/`, 6
      tagged `runnable` and 36 `needs-scaffold` (36 rows in `evals/README.md`).
      `dependency-hotfix` eval 4 landed on `main` while this was in flight
      (!147); it was rebased in and converted, so no `evals.json` survives.
- [x] `bash scripts/validate-ai-instructions.sh` — passes, no adapter drift.

## Technical Notes

Format, checked against https://code.claude.com/docs/en/plugin-evals on
2026-10-08: a case is a directory under `evals/` holding `prompt.md` (frontmatter
plus the prompt as body) and `graders/*.md` (frontmatter `type`, optional
`weight`/`arm`; the body of an `llm` grader is the rubric). A case without a
grader fails to load. The tool does not read skill-creator's `evals.json`, so
this is a conversion, not a rename.

Runs are isolated: no `CLAUDE.md`, user settings, hooks, MCP servers or other
plugins load, and each run starts in an empty directory. The existing prompts
were written against a project that had `CONVENTIONS.md` and `rules/`, so some
assertions cannot pass as written; the converter must not "fix" them, it tags
what cannot run (criterion 3) and the follow-up decides.

Found while building, and not in the item as filed: 36 of the 42 cases are
scenario evals — "Context the agent can discover: `git status` shows …" — that
assume repository, git or `glab` state, so only 6 (`component-spec` 1–3,
`payload-jobs` 1 and 3, `npm-maintenance` 2) carry every fact in the prompt and
are tagged `runnable`. The other 36 are converted unchanged and listed in
`evals/README.md`; a `scaffold_script` fixture per case is what makes them run,
and that is a follow-up, not this slice. A run is also not free of side effects:
`claude plugin eval` publishes its HTML report to claude.ai by default when the
account supports it, and these prompts name client projects, so every documented
command carries `--no-publish`.

In a two-arm run (the default) every `tool_used: Skill` grader is excluded from
the score and reported as an indicator only. That is fine for the local loop,
which uses `--ablation none`, where nothing is excluded. Slice 2 and 3 must not
forget it: a routing gate has to run with `--ablation none` or set `arm: both`.

Plugin root is the repo root (`.claude-plugin/marketplace.json`, `source:
"./"`), so `evals/` ships in every install. It is never loaded into context;
the cost is install size. Keep the default directory name; do not add
`experimental.evals` to `plugin.json`.

The converter is a throwaway: criterion 1 is the mapping spec and the generated
case files are what review reads. Nothing in `scripts/` changes.

Size: the converted cases are generated output, like fixtures. State the split
in the MR description ("N generated case files + ~M authored lines").

## Out of Scope

- New cases for skills that have none — slice 2.
- A CI job, an API key or a spend cap — slice 3.
- Blind A/B comparison or benchmark scoring between skill versions.
- Writing a runner; `claude plugin eval` is the runner.

## Related

- MR: https://gitlab.com/greenberrynl/config/ai-workflows/-/merge_requests/150
- Slice 2: [feat-skill-eval-harness-2-routing-cases.md](feat-skill-eval-harness-2-routing-cases.md)
- Slice 3: [feat-skill-eval-harness-3-ci-job.md](feat-skill-eval-harness-3-ci-job.md)
- [../../skills/improve-skill/SKILL.md](../../skills/improve-skill/SKILL.md)
- [../../scripts/validate-skills.mjs](../../scripts/validate-skills.mjs)
- [../pipeline-map.md](../pipeline-map.md)
- https://code.claude.com/docs/en/plugin-evals
