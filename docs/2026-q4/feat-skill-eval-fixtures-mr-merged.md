# Feature: A Scaffold Fixture for the mr-merged Eval Cases

## Status

<!-- draft | ready | in-progress | done -->

done

Filed and delivered on 2026-10-29 in one MR, at the maintainer's go.

## Ticket

[Audit 2026-10](../audits/2026-10.md) — roadmap item 1

## Priority

medium

## Summary

43 of the 86 eval cases are tagged `needs-scaffold`: their prompt describes
repository and CLI state that an empty eval workspace lacks, so they never run.
This item builds the first fixture, for `mr-merged`, and finds out what a
fixture takes: a real git repository, fake `glab`, `jira` and `vercel` on the
agent's `PATH`, and graders that judge what the run did. A case ships only when
it fails on the skill without the fix it guards.

## User Story

As the maintainer, I want the `mr-merged` regression cases to run against a
repository and CLIs that behave like the real ones, so that a skill edit that
drops the deploy read-back fails a case before it merges.

## Acceptance Criteria

- [x] `mr-merged-1` runs with `--scaffold --allow-tools Bash` and passes every
      grader on the current skill, in every run.
- [x] The same case fails on the skill without its deploy read-back.
- [x] A case whose base passes is dropped, not shipped.
- [x] `evals/README.md` says how to run a scaffold case and what it needs on
      macOS.

## How to verify

One run per command, `--runs 1 --ablation none --judge-model sonnet
--no-publish --trust-plugin --scaffold --allow-tools Bash`, Claude Code 2.1.296.

- [x] `mr-merged-1` on the current skill: 5/5, $0.71. The run read the
      deploy job's log, quoted the refused hook, found no Vercel deployment for
      the squash commit and left the retry to the user.
- [x] `mr-merged-1` on the skill without the deploy read-back (Step 5 bullet,
      recap, description and constraint removed): 2/5, $0.68, failing a1, a2
      and a3. It read the MR, the backlog item and the ticket through the fakes
      and never looked at a pipeline.
- [x] `mr-merged-3` (merged branch in a checkout on another session's branch):
      5/5 on the current skill ($0.67) and 5/5 with step 3 reverted to the
      pre-2026-10-05 text ($0.61). On the base the model ran `git branch -d`,
      got "not fully merged", then compared the head SHA, ran `merge-base
      --is-ancestor` and deleted with `-D` on its own. Dropped.
- [x] The final fixture, moved into the case directory, on the current skill:
      4/5, $0.68. a2 ("checks the platform for a deployment") failed: the run
      quoted the refused hook and flagged the deploy, but did not run
      `vercel ls`. a2 is dropped: when the hook refused, its response already
      proves no deployment exists, so the platform check adds nothing in this
      scenario. It matters when the hook accepted and the build failed later,
      a scenario no case covers. Without a2, the current skill passed both
      runs and the base still fails a1 and a3.

## Technical Notes

Found while delivering:

- Apple's `/usr/bin/git` is an xcrun launcher, and the eval sandbox blocks
  what it needs (reading the Command Line Tools, writing its cache under
  `/var/folders`). Before `brew install git`, every git call in the run failed
  with `Failed to locate 'git'`; after it, git works with xcrun warnings in the
  output.
- A scaffold reaches the agent's shell only through the run's temporary
  `HOME`. A line in `.zshrc` never took effect; the same line in `.zshenv`
  did, on every Bash call.
- Judged on the final message, two `mr-merged-3` assertions about commands
  failed on a run that ran exactly those commands. Action assertions now carry
  `focus: trace`; the assertion text is unchanged apart from "the run" for
  "the output".
- `mr-merged-2` stays `needs-scaffold`. It asserts a bounded wait of about ten
  minutes on a pipeline that does not finish, which a fixture can only show by
  letting a run wait that long.
- The fixture spend for this item was about $4.80: two `PATH` probes ($0.40),
  five `mr-merged-3` runs ($2.30, two of them lost to the git and `.zshrc`
  problems above), and three `mr-merged-1` runs ($2.07).

## Out of Scope

- Fixtures for the other `needs-scaffold` cases; each one earns its fixture
  the same way, by failing on its base.
- A Linux runner. bash login shells and Linux sandboxing are untested.

## Related

- MR: https://gitlab.com/greenberrynl/config/ai-workflows/-/merge_requests/324
- [evals/README.md](../../evals/README.md), "Scaffold cases"
- https://code.claude.com/docs/en/plugin-evals
