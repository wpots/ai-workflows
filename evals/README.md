# Skill Evals

Regression cases for the skills in this plugin, run with `claude plugin eval`
(Claude Code 2.1.269 or later). Format reference:
https://code.claude.com/docs/en/plugin-evals

## Layout

```
evals/<skill>/<skill>-<id>/
├── prompt.md             # frontmatter (tags, max_turns, allowed_tools,
│                         # expected_outcome) and the prompt as the body
└── graders/
    ├── a1.md, a2.md, …   # type: llm — one assertion each, body
    │                     # "PASS if this holds for the response: <assertion>"
    ├── skill-fired.md    # type: tool_used — the run called this skill
    └── skill-not-fired.md  # routing should-not-fire cases only (see below)
```

Every case is tagged with its skill and with `runnable` or `needs-scaffold`.
To add a case, copy a neighbouring directory and change the prompt and the
assertions; `skills/improve-skill` does this when a failure earns a regression
case.

One `llm` grader checks one assertion. The JSON result and the report keep
only the judge's votes per grader (`judge votes: FAIL FAIL FAIL`), not its
reasoning, so a rubric with several numbered conditions fails without saying
which one; a grader per assertion names it. A case passes only when every
grader passes.

## Routing cases

Most skill regressions are a `description` edit that quietly stops matching
the request it was written for. Routing cases catch that, tagged `routing`:

- **should fire** — a prompt a user would type, not naming the skill, graded
  by `skill-fired.md` (`tool_used: Skill` with `input_match` on the skill's
  name, including the `greenberry:` form).
- **should not fire** — a near miss ("review this paragraph" against
  `code-review`), graded by `skill-not-fired.md`: the same `input_match` with
  `min: 0`, `max: 0` and `arm: both`.

`code-review`, `create-pr`, `refinement`, `start-project` and `work-backlog`
each have one of both plus one output case; `scripts/validate-skills.mjs` warns
when one of these five has no `evals/<skill>/` directory. A should-fire case
that fails on a fresh prompt is a finding about the skill's `description`, not
a reason to loosen the prompt.

## Run

The default is a targeted run: select only the added or changed cases and the
existing cases that exercise the behavior changed by this branch. List the
exact case names and why they apply before running them. Use one run per case,
one plugin arm, and an explicit cost ceiling.

A whole skill suite, the routing suite, all runnable cases, more repetitions or
an added no-plugin arm require the user's explicit approval of the expanded
scope and its total budget. Approval to edit a skill, push a branch or open an
MR does not approve a broader eval run. A failure or missing coverage does not
expand the selection automatically.

```bash
# free case-file validation; no model run
claude plugin eval . --max-cost-usd 0 --no-publish --trust-plugin

# one selected regression case; $0.50 is an example ceiling, not its price
claude plugin eval . --case backlog-5 --runs 1 --ablation none --no-publish --trust-plugin --judge-model sonnet --max-cost-usd 0.50
```

Broad runs are opt-in. Only after the user approves the suite and its total
budget, use the matching selector, for example:

```bash
# requires explicit approval for the routing suite and a $3 budget
claude plugin eval . --tag routing --runs 1 --ablation none --no-publish --trust-plugin --judge-model sonnet --max-cost-usd 3

# requires explicit approval for all runnable cases and a $10 budget
claude plugin eval . --tag runnable --runs 1 --ablation none --no-publish --trust-plugin --judge-model sonnet --max-cost-usd 10
```

- Always pass `--no-publish`. The report is otherwise published to claude.ai
  when the account supports it, and these prompts name client projects.
- `--ablation none` runs one arm. In a two-arm run every `tool_used: Skill`
  grader without `arm: both` is not scored (it is an indicator), so a case that
  stops triggering its skill would still pass.
- `--judge-model sonnet`: on 2026-10-08 (Claude Code 2.1.283, five cases, 33
  assertions per judge) the default judge, Haiku, voted FAIL on 11 assertions
  that held in the final message it graded; Sonnet misjudged at most 2 of 33,
  for about $0.03 more per case.
- `--trust-plugin` skips the first-run trust prompt; use it on this repo only.
- `--case` takes one glob without alternation, and a second `--case` replaces
  the first; run several selected cases as separate commands with exact names.
  Account for their combined budget; a case filter is not permission to run
  unrelated cases one by one.
- `--max-cost-usd 0` loads and validates every case file without starting a
  run, at no cost; a file that does not load is printed with a `✗`.
- Results land in `evals/results/` (gitignored). Every live run calls the model
  on your account. A cost ceiling is a stop setting, not a fixed charge; a run
  already in flight can exceed it. Respect the user's budget and any declined
  execution or data-transfer permission. Never retry a refused paid run,
  increase its budget or add repetitions automatically.

## Before a skill MR

`skills/create-pr` and the upstream MR flow (`shared/upstream-mr.md`, the path
`skills/improve-skill` takes) use targeted evals before the first push. The
selection and cost policy in [Run](#run) also applies to baseline/fixed runs
while improving a skill.

**Select from the branch diff.** Inspect the changed skills, rules, commands,
shared fragments and eval files against the resolved base. For each selected
case, name the changed behavior its assertions exercise:

- An added or modified case selects that exact case, including when only a
  grader changed.
- A new skill or a change to a skill's `name`, `description` or `when_to_use`
  selects only that skill's relevant routing cases. An added or changed
  routing case does not select the routing cases of other skills.
- A skill body, rule, command or shared-fragment change selects only existing
  cases whose assertions exercise the changed behavior. It does not select
  every case for a skill or every consumer of a shared fragment.
- A documentation-only edit that changes no tested behavior selects no live
  cases. If changed behavior has no suitable case, report the coverage gap;
  do not substitute a broader suite.

**Run and report.**

1. Run each selected case once using its exact `--case` name and the settings
   in [Run](#run). An existing successful result for the same inputs is reused;
   a later push reruns only cases whose relevant inputs changed. A wider run
   waits for explicit approval of its scope and total budget.
2. **All selected cases pass:** put their names, the observed pass count and
   actual combined cost from the run results in the MR description. For
   example: `Targeted evals: backlog-5 — 1/1 pass ($0.20, 2026-10-26)`.
   Read `aggregates.casesPassed`, `aggregates.casesTotal` and `costUsd` from
   `evals/results/<run>/aggregate-result.json`; do not present targeted results
   as a full-suite pass.
3. **A case fails:** stop before the push and name the case, the skill and the
   grader. Continue once the selected case passes, or once the user accepts
   the failure; record an accepted failure in the MR description. Never
   loosen or delete the case to get a pass, or expand to a suite automatically.
4. **No live run:** state `Targeted evals: not run — <reason>` and the selected
   case names or coverage gap. Reasons include unchanged tested behavior, no
   matching case, denied network/auth or data-transfer permission, and a cost
   ceiling stopping a run. Include the targeted command when applicable.
   Never claim a pass the run did not report.

Inside the Claude Code sandbox a live run needs the sandbox bypass, because
`claude plugin eval` reaches api.anthropic.com and writes to `/tmp`. A refused
permission prompt is reported under step 4; it does not authorize another
execution route. Additional repetitions need explicit scope and budget
approval under [Run](#run).

## Runnable and needs-scaffold

A run starts in an empty directory with none of your `CLAUDE.md`, settings,
hooks or other plugins.

- **runnable** — the prompt carries every fact it needs and asks for an answer
  rather than an action in a repository.
- **needs-scaffold** — the prompt describes repository, git or CLI state ("the
  context the agent can discover") that the empty workspace does not have, so a
  run would measure a guess about files it cannot read. The cases are converted
  from the earlier `evals.json` files without changes so nothing is lost; making
  them run needs a `scaffold_script` fixture per case (`case.yaml`, run with
  `--scaffold`).

| Skill | Case | What the prompt assumes |
| --- | --- | --- |
| `address-review-comments` | `address-review-comments-1` | in the cwd repo, !256 is merged and authored by someone else; among the user's open MRs across GitLab, `other-group/other-repo!256` was updated today… |
| `address-review-comments` | `address-review-comments-2` | the approved changes for two reviewer notes on a GitLab MR are committed locally; the branch is not behind its target; the pre-push hook passes. |
| `backlog` | `backlog-1` | `git status --porcelain docs/backlog/` shows an untracked `perf-search-link-prefetch-storm.md` written yesterday plus an uncommitted change to… |
| `backlog` | `backlog-2` | the item and an ADR both name the client's proof-of-concept app as the form reference, with its URL; the vendor API is reachable with the project's… |
| `backlog` | `backlog-3` | CONVENTIONS.md requires every .js file a delivery changes to be converted to TypeScript in the same delivery; the route, its test and the component… |
| `close-sprint` | `close-sprint-1` | `.gitignore` ignores `docs/demo/`; `docs/demo/sprint-16/` holds `deck.md` with twelve slides and presenter notes, `demo-script.md` with a klikpad, a… |
| `close-sprint` | `close-sprint-2` | `docs/demo/sprint-15/` exists but git does not track it — `.git/info/exclude` ignores `/docs/demo/`; the runsheet header names no destination for the… |
| `close-sprint` | `close-sprint-3` | `.gitignore` ignores `docs/demo/`; the runsheet header says the shared pptx was copied to `~/Documents/Klant/Demo Sprint 17.pptx`; that file does not… |
| `close-sprint` | `close-sprint-4` | the session is interactive and can write to the checkout; `git status` shows a staged edit to `docs/sprint18/architecture.drawio` and an unstaged… |
| `close-sprint` | `close-sprint-5` | 30 delivered BLIs move to `docs/sprint-19/`; `docs/adr/0004-x.md` links `../backlog/RFW-131-feat-a.md`, which moves; the moved `RFW-131-feat-a.md`… |
| `component-spec` | `component-spec-1` | `CONVENTIONS.md`, `rules/accessibility.md` and an existing Button component in the cwd; without them the skill stops to ask for the project (live run 2026-10-08) |
| `create-pr` | `create-pr-1` | local lint, type-check, tests and build all pass; the branch changes `package-lock.json`; the CI install job needs a registry token stored as a… |
| `create-pr` | `create-pr-2` | the MR is created normally; its pipeline sits in the queue, and fifteen minutes later the setup stage has still not started because no runner is free. |
| `dependency-hotfix` | `dependency-hotfix-1` | the newest report.json lists next@16.3.0 on main with three critical advisories, fixedIn 16.3.3 and 16.3.6; development already runs next 16.3.8 and… |
| `dependency-hotfix` | `dependency-hotfix-2` | names a repository, files or CLI state that the empty workspace lacks |
| `dependency-hotfix` | `dependency-hotfix-3` | hotfix MR !88 merged and deployed; the push back-merge into acceptance succeeded; git merge-tree for development reports conflicts in… |
| `dependency-hotfix` | `dependency-hotfix-4` | today is in October 2026; Jira project RFW has RFW-319 'Refugeework onderhoud Q4-2026', type Task, label maintenance:periodical, status Open; RFW… |
| `mr-merged` | `mr-merged-1` | the target branch's pipeline for the squash commit has a deploy job that POSTs to a Vercel deploy hook; the job passed, but its log shows the hook… |
| `mr-merged` | `mr-merged-2` | the target branch's pipeline for the merge commit is still running its test stage after fifteen minutes; the deploy job has not started. |
| `mr-merged` | `mr-merged-3` | the shared checkout is on another session's branch, `feat/other-work`; the local source branch has no upstream and its head equals the merged MR's… |
| `npm-maintenance` | `npm-maintenance-1` | `git log -- package.json` shows a maintenance commit that bumped next to 16.3.1, a `Revert "…"` of it the next morning, and a re-applied maintenance… |
| `payload-jobs` | `payload-jobs-2` | names a repository, files or CLI state that the empty workspace lacks |
| `release` | `release-1` | names a repository, files or CLI state that the empty workspace lacks |
| `release` | `release-2` | names a repository, files or CLI state that the empty workspace lacks |
| `release` | `release-3` | names a repository, files or CLI state that the empty workspace lacks |
| `release` | `release-4` | names a repository, files or CLI state that the empty workspace lacks |
| `release` | `release-5` | names a repository, files or CLI state that the empty workspace lacks |
| `release` | `release-6` | names a repository, files or CLI state that the empty workspace lacks |
| `release-notes` | `release-notes-1` | names a repository, files or CLI state that the empty workspace lacks |
| `release-notes` | `release-notes-2` | names a repository, files or CLI state that the empty workspace lacks |
| `sprint-demo` | `sprint-demo-1` | `docs/sprint15/` holds the plan and an `architecture-sprint-15.drawio` with a before and an after page; the sprint swapped the catalogue vendor; the… |
| `sprint-demo` | `sprint-demo-2` | the sprint started 9 September; nine stories were created before that date and carry the planned-for-sprint label; nine more were created between 24… |
| `sprint-demo` | `sprint-demo-3` | the user commented out the status slide, the status section and the outlook section in `deck.md` with HTML comments; the shareable pptx was generated… |
| `sprint-demo` | `sprint-demo-4` | the closing slide says 'the sprint 15 release has set up the CMS production environment'; the release branch `main` is 226 commits behind… |
| `sprint-demo` | `sprint-demo-5` | `.gitignore` has `docs/demo/**/deck.html` and `docs/demo/**/*.pptx` lines from an earlier demo run and no `docs/demo/` line; `git ls-files… |
| `sprint-demo` | `sprint-demo-6` | `deck.md` leaves out the status section, the status slide and the outlook section with HTML comments that also span their `---` separators; the… |
| `sprint-demo` | `sprint-demo-7` | the client's previous deck is in Downloads; the system python3 has no python-pptx; the session has a scratchpad directory for temporary files. |
| `sprint-demo` | `sprint-demo-8` | the intake named the client's Drive folder `Klant/Sprintdemo's`; `~/Library/CloudStorage/GoogleDrive-<account>/Shared drives/Klant/Sprintdemo's/`… |
| `sprint-demo` | `sprint-demo-9` | the intake answer was 'op Google Drive als dat lukt, anders lokaal'; `~/Library/CloudStorage/` holds no Google Drive mount; no Drive connector is… |
