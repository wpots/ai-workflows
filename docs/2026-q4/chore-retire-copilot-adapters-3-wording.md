# Chore: Wording Stops Naming Copilot As A Target

## Status

<!-- draft | ready | in-progress | done -->

done

Go to drop Copilot, and the cut, given by the maintainer on 2026-10-28. Waits
for slices 1 and 2, because these texts describe what sync and this repo
generate.

## Ticket

[Audit 2026-10](../audits/2026-10.md) — roadmap item 7

## Slice

3/3 — skills, guides and the release announcement stop naming Copilot

## Priority

low

## Summary

After slices 1 and 2 nothing is generated for Copilot, but six skills, the
guides and the Slack release announcement still name it as a supported tool.
They are brought in line, and each tool table keeps at most one line saying
Copilot is not supported.

## User Story

As a developer adopting the workflows, I want the skills and guides to describe
the tools we actually support, so that I do not look for Copilot files that no
longer appear.

## Acceptance Criteria

- `close-sprint`, `compact-sprint`, `refinement`, `release-notes`, `sprint-demo`
  and `sprint-planning` no longer say Copilot follows their runbook, and
  `improve-skill` no longer lists Copilot among the tools a workflow is shared
  across.
- These guides no longer present Copilot as a delivery target or list Copilot
  files among the generated output: `README.md`, `AGENTS.md`, `FEATURES.md`,
  `docs/how-it-works.md`, `docs/keep-current.md`, `docs/adopt-new-project.md`,
  `docs/adopt-existing-project.md`, `docs/contributing.md`,
  `docs/troubleshooting.md` and `docs/setup-machine.md`. A tool or support table
  keeps at most one Copilot line, saying Copilot is not supported and sync
  generates nothing for it.
- `docs/adopt-existing-project.md` says that a project's own
  `.github/copilot-instructions.md` is left alone instead of replaced.
- The Slack release announcement names the project adapters without Copilot.
- History stays as it is: `CHANGELOG.md`, `changelog.d/`,
  `docs/skills-first-migration-plan.md`, `docs/audits/` and `docs/backlog/`.
- `rg -n -i copilot README.md FEATURES.md AGENTS.md docs skills scripts/release-announcement.mjs --glob '!docs/backlog/**' --glob '!docs/audits/**' --glob '!docs/skills-first-migration-plan.md' --glob '!docs/*-q[1-4]/**'`
  lists only these lines:
  - the "not supported" lines in the tool tables;
  - the "not supported" line slice 1 leaves in `skills/setup-ai-workflows`;
  - the project-owned Copilot instructions in `README.md` (the adoption-route
    row), in `docs/adopt-new-project.md` (the check that sends such a project
    to the existing-project route) and in `docs/adopt-existing-project.md` (the
    intro and the left-alone row).
- A changelog fragment says that the skills stop naming Copilot.

## How to verify

- Run the `rg` command from the acceptance criteria. It lists nine lines:
  `README.md:26`, `AGENTS.md:22`, `FEATURES.md:155`,
  `docs/how-it-works.md:47`, `docs/keep-current.md:14`,
  `docs/adopt-existing-project.md:4` and `:23`, `docs/adopt-new-project.md:40`
  and `skills/setup-ai-workflows/SKILL.md:263`. Each is a "not supported" line
  or a project-owned Copilot file. The command gained
  `--glob '!docs/*-q[1-4]/**'`: the quarter folders came back on 2026-10-30,
  after this item was written, and hold delivered history.
- `rg -n "github/prompts" README.md FEATURES.md AGENTS.md docs skills rules templates shared`
  with the same history globs prints nothing.
- `node --test scripts/test-release-automation.mjs`: the `syncLabels` test
  failed after its expected string dropped Copilot and before
  `scripts/release-announcement.mjs` did; 23/23 pass now.
- The pre-commit suite passes, including `generate-adapters.sh`, so the
  `AGENTS.md` edits outside the shared blocks survive regeneration.

## Technical Notes

Mentions on 2026-10-28, before slices 1 and 2:

- Skills: line 14 of `close-sprint` and line 15 of `compact-sprint`,
  `refinement`, `release-notes`, `sprint-demo` and `sprint-planning`
  ("Copilot follows the runbook directly"); `improve-skill` 117 (113 after
  slice 2). Line 64 of `improve-skill` is slice 2. `create-pr` 107 still lists
  `.github/prompts/` among the synced workflow surfaces; sync stopped writing it
  in slice 1, so it goes here too (its runbook twin waits for F3). No `copilot`
  in that line, so the `rg` check below does not catch it.
- `README.md` 3, 26 (stays), 41, 42; line 73 is slice 1.
- `AGENTS.md` 16, 22, 32. Edit outside the shared blocks; the pre-commit hook
  regenerates those.
- `FEATURES.md` 14–17, 158; the generated-artifacts list (145–146) is slices
  1 and 2.
- `docs/how-it-works.md` 14, 22, 40, 50, 55, 93–94, 172, 174; 105–106 and 130
  are slice 1, 131 is slice 2.
- `docs/keep-current.md` 14, 56, 75; `docs/adopt-new-project.md` 40 (stays),
  104–106;
  `docs/adopt-existing-project.md` 4 (stays), 23; `docs/contributing.md` 85
  (12, 83 and 86 are slice 1); `docs/troubleshooting.md` 32;
  `docs/setup-machine.md` 218.
- `scripts/release-announcement.mjs` 130 (`ADAPTERS`) and its expected string in
  `scripts/test-release-automation.mjs` 193.

Several of these lines say the `commands/` runbooks exist for Copilot
(`README.md` 41, `AGENTS.md` 32, `docs/how-it-works.md` 55, `docs/contributing.md`
85). Reword them to "for tools without skills". Whether the runbooks stay is F3
of the October 2026 audit, and this item does not decide it.

None of the guides is in the freshness stamp. The skills ship in the plugin,
hence the fragment: `changed`, e.g. `changelog.d/changed.skills-drop-copilot.md`.
No skill description changes, so the routing-eval pre-flight does not apply.

This slice closes rank 7: in the same MR, set its row in the audit's Delivery
Status table to **Done** with the merge date, and add this MR.

## Out of Scope

- Anything slice 1 or slice 2 covers.
- The Copilot wording in `commands/*.md`: it goes with F3, in one re-sync.
- Rewriting the history in `CHANGELOG.md`, the migration plan or the audits.

## Related

Depends on: chore-retire-copilot-adapters-2-prompt-files.md

- [chore-retire-copilot-adapters-1-stop-emitting.md](chore-retire-copilot-adapters-1-stop-emitting.md)
- [chore-retire-copilot-adapters-2-prompt-files.md](chore-retire-copilot-adapters-2-prompt-files.md)
