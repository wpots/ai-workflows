# Chore: Sync Stops Delivering Anything For Copilot

## Status

<!-- draft | ready | in-progress | done -->

done

Go to drop Copilot given by the maintainer on 2026-10-28; the decision is the
2026-10-28 amendment of `docs/skills-first-migration-plan.md`. The team uses
Claude and Codex. The same day the maintainer confirmed the cut into three
slices and the defaults in Technical Notes: leave a project's `.github/` files
alone, delete `shared/core-rules.md`, and leave the wording in `commands/` to
F3.

## Ticket

[Audit 2026-10](../audits/2026-10.md) — roadmap item 7

## Slice

1/3 — sync and setup stop emitting Copilot files

## Priority

low

## Summary

`scripts/sync.sh --project` and `skills/setup-ai-workflows` stop writing
`.github/copilot-instructions.md` and `.github/prompts/` into projects. Every
Copilot mention in the files the freshness stamp digests goes in the same MR,
except the `commands/` runbooks, so synced projects are asked to re-sync once.

## User Story

As the maintainer of the shared workflow assets, I want sync to stop producing
files for a tool nobody on the team runs, so that every later change to sync,
setup and the templates touches one adapter fewer.

## Acceptance Criteria

- `scripts/sync.sh --project` no longer writes `.github/copilot-instructions.md`
  or `.github/prompts/*.prompt.md`, its usage text names neither, and
  `templates/project-copilot-instructions.md` is deleted. Sync neither writes
  nor deletes anything under a project's `.github/`: files from earlier syncs
  stay where they are.
- `skills/setup-ai-workflows` and `commands/setup-ai-workflows.md` no longer
  create or describe Copilot files: the description, the adapter table, the
  inline-injection step, the recap and the files list. The skill keeps one line
  saying Copilot is not supported and that existing `.github/` files are left
  as they are.
- `shared/core-rules.md` is deleted, because the two Copilot adapters were its
  only readers. This repo's own `.github/copilot-instructions.md` goes with it,
  out of `scripts/generate-adapters.sh` and `scripts/validate-ai-instructions.sh`.
- Nothing points at a deleted file: the freshness stamp's template list, the
  release tooling's path list, the validator's marker and ambient lists, the
  `upstream-rules` asset table, `README.md`, `docs/pipeline-map.md`,
  `docs/contributing.md`, `docs/how-it-works.md` and `rules/type-safety.md`.
- The other Copilot mentions in the digested set go too: `rules/rules.md`,
  `shared/workflow-assets.md`, `templates/project-AGENTS.md`, and
  `templates/project-ai-workflows.md`, which keeps one line saying Copilot is
  not supported.
- `scripts/smoke-test-project-sync.sh` asserts that neither fixture project gets
  `.github/copilot-instructions.md` or `.github/prompts`, and that a fixture's
  existing `.github/copilot-instructions.md` and `.github/prompts/` survive a
  sync. The test fails against `main` before this change.
- A changelog fragment says that sync and `setup-ai-workflows` stop generating
  Copilot files, that `.github/` files a project already has are left alone and
  can be deleted by hand, and that every synced project reads as stale once.

## How to verify

- `bash scripts/smoke-test-project-sync.sh` → `Project sync smoke test passed.`
  With only the new smoke test on the old `sync.sh`, it fails at its first new
  assert: `Unexpected path: …/no-conventions/.github`.
- The new fixture writes `.github/copilot-instructions.md` and one prompt file
  before a sync, then checks that both still read `earlier sync` and that no
  other prompt file appeared. The dry-run scenario now also fails when a
  `.github/` directory appears; the old prompt block created one even under
  `--dry-run`.
- `bash scripts/validate-ai-instructions.sh` → exit 0: `OK: 38 skills
  validated, 105 docs link-checked, no errors`, the three node test files
  `fail 0` (the release-automation test keeps the stamp's template list and the
  release path list in step), both smoke tests passed, `No drift detected`.
- `rg -n "core-rules|project-copilot-instructions|inject_conventions"` over the
  repo hits only `CHANGELOG.md`, `changelog.d/` and `docs/backlog/`.
- `.github/copilot-instructions.md` is still named in `FEATURES.md`'s tool
  table (slice 3) and in the smoke test's leave-alone fixture. In
  `FEATURES.md` and `docs/how-it-works.md`, the lists of this repo's generated
  files also named it; those two lines went in this slice, because the file is
  gone.
- Re-sync prompt: `rules/`, `shared/`, `commands/setup-ai-workflows.md`, two
  templates and `sync.sh` change, all inside `source_digest()`, so every synced
  project reads as stale once. This follows from the digest; it was not run
  against a real project.
- Targeted evals: not run. No eval case covers `setup-ai-workflows` or
  `upstream-rules`. That is a coverage gap: the description change only drops
  "Copilot" from the adapter list.

## Technical Notes

Where the code sits on 2026-10-28 (line numbers move; search for `copilot` and
`core-rules`, case-insensitive):

- `scripts/sync.sh`: usage text at 33 and 35, the adapter block at 280–293, and
  the prompt block at 316–341. The prompt block runs `rm -f` on
  `.github/prompts/*.prompt.md` before it regenerates them; removing the block
  removes that delete too.
- `skills/setup-ai-workflows/SKILL.md`: 3 (description), 247, 261, 266–272, 286,
  361, 364. `commands/setup-ai-workflows.md`: 54.
- `scripts/validate-skills.mjs`: the comment at 490, `REQUIRED_MARKERS` at 550
  and 552–558, `UPSTREAM_MR_AMBIENT` at 626.
- `scripts/project-sync-freshness.sh`: `ADAPTER_TEMPLATES` at 111.
  `scripts/project-sync-paths.mjs`: `PROJECT_SYNC_PATHSPECS` at 19.
  `scripts/test-release-automation.mjs` checks that both lists agree, so it
  needs no edit when both drop the template.
- `scripts/generate-adapters.sh`: `ADAPTER_FILES` at 12.
  `scripts/validate-ai-instructions.sh`: `GENERATED_FILES` at 12. Leave line 20,
  the `.github/prompts` scan, to slice 2.
- `scripts/smoke-test-project-sync.sh`: `assert_prompt_alignment` at 36–49 and
  its callers, and the asserts at 77, 81, 86, 115, 119, 121 and 122. The `.cursor`
  fixture at 126–133 is the model for the leave-it-alone fixture.
- `skills/upstream-rules/SKILL.md`: the table row at 59 and the adapter list at
  145.
- `rules/rules.md` 6, `rules/type-safety.md` 90, `shared/workflow-assets.md` 7,
  `templates/project-AGENTS.md` 61, `templates/project-ai-workflows.md` 17, 48,
  57, 78, 107, 112, 121 and 124.
- `docs/pipeline-map.md` 396–397, `docs/contributing.md` 12, 83 and 86,
  `docs/how-it-works.md` 105–106, `README.md` 73: only the mentions of
  `core-rules`, the template and this repo's own adapter. The rest of those docs
  is slice 3.

**Why `shared/core-rules.md` goes.** `REQUIRED_MARKERS` in
`scripts/validate-skills.mjs` gives the `core-rules` marker to the two Copilot
adapters only; `templates/project-AGENTS.md` and `CLAUDE.md` never carried it.
Claude and Codex lose nothing. Deleting it in a later slice would change the
digest a second time.

**Why the `commands/` wording waits.** Thirteen runbooks say they are for
"prompt-first tools such as Copilot". They are in the digest, so rewording them
here pushes this slice past the 25-file split trigger in `rules/mr-sizing.md`,
and whether the runbooks stay at all is the open F3 decision of the October 2026
audit. Their wording changes when F3 is delivered, in one re-sync.

**One stale nudge, not three.** The stamp is a digest over `rules/`, `commands/`,
`shared/`, the adapter templates and the two sync scripts (`source_digest()` in
`scripts/project-sync-freshness.sh`). Slices 2 and 3 touch none of those files.

**Size.** About 22 authored files, over the 15-file target and under the
25-file split trigger. Most of them change one line. The deleted
`.github/copilot-instructions.md` is generated output and does not count.

**Changelog section.** A `removed` fragment makes the release MAJOR
(`scripts/assign-plugin-version.mjs`, bump inference). Use
`changelog.d/changed.retire-copilot-adapters.md`: no Claude or Codex user loses
anything. Say in the MR that a 3.0.0 is the maintainer's call at release time
(`--bump`).

**Frontmatter.** The `setup-ai-workflows` description changes, so follow the
routing-eval pre-flight in `skills/create-pr` (`evals/README.md`, "Before a
skill MR").

The pre-commit hook regenerates the adapters and fails on drift; on that
failure, stage the regenerated files and commit again.

Add this MR to rank 7's row in the Delivery Status table of the audit, in the
same MR.

## Out of Scope

- The Copilot wording in `commands/*.md` (F3, see above).
- This repo's `.github/prompts/` and its generator (slice 2).
- The wording in skills that mention Copilot in passing, the guides and the
  Slack release announcement (slice 3).
- Deleting `.github/` files from projects.

## Related

- [chore-retire-copilot-adapters-2-prompt-files.md](chore-retire-copilot-adapters-2-prompt-files.md)
- [chore-retire-copilot-adapters-3-wording.md](chore-retire-copilot-adapters-3-wording.md)
- [../skills-first-migration-plan.md](../skills-first-migration-plan.md) — the
  2026-10-28 amendment that put Copilot out
- [../../scripts/sync.sh](../../scripts/sync.sh)
- [../../scripts/project-sync-freshness.sh](../../scripts/project-sync-freshness.sh)
- [../../skills/setup-ai-workflows/SKILL.md](../../skills/setup-ai-workflows/SKILL.md)
