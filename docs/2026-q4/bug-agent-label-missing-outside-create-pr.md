# Bug: MRs Opened Outside create-pr Miss the `ai:agent-authored` Label

## Status

<!-- draft | ready | in-progress | done -->

done

Filed 2026-10-21 from the measurement note of the October 2026 stack review
(`docs/ai-stack-review-2026-10.md`, the maintainer's untracked local copy). That note said the label was "not on every
agent MR". The cause is now traced: every MR recipe outside `skills/create-pr`
leaves the label out.

## Ticket

<!-- no tracker ticket: this repo's own backlog -->

## Priority

medium

## Summary

`skills/create-pr` puts `ai:agent-authored` on every MR and checks it on
read-back. The always-loaded upstream MR rule and three other skills open MRs
with recipes that never name the label. So `scripts/delivery-metrics.mjs`
undercounts agent work, and the undercount grows as more MRs go that route.

## User Story

As the maintainer reading the delivery metrics, I want every agent-opened MR to
carry `ai:agent-authored`, whichever recipe opened it, so that the label share
measures agent work instead of measuring which skill happened to open the MR.

## Reproduction

1. List the MRs on `ai-workflows` that merged without the label (release MRs
   excluded):
   `glab api "projects/greenberrynl%2Fconfig%2Fai-workflows/merge_requests?state=merged&updated_after=2026-10-13T11:00:00Z&per_page=100" | jq -r '.[] | select(.source_branch != "release/next") | select((.labels | index("ai:agent-authored")) == null) | "!\(.iid) \(.source_branch)"'`
   On 2026-10-21 this prints 17 of the 53 non-release MRs merged since
   2026-10-13. From 2026-10-19 on it is 14 of 23. All 17 carry a
   `Co-Authored-By: Claude` trailer.
2. Nine of the 17 can be traced in this checkout's local transcripts. The other
   eight were opened from a worktree session or another machine. None of the
   nine sessions invoked `greenberry:create-pr`; each followed the upstream MR
   rule:
   - `glab mr create` without `--label`: !201, !229, !237, !239, !249.
   - `glab api …/merge_requests` POST with `--input <file>`, with no `labels`
     in the JSON: !227, !228, !244, !250.
3. Read the recipes those sessions followed. None of them names the label:
   - `shared/upstream-mr.md`, which is generated into
     `.claude/rules/upstream-mr.md` and
     `skills/upstream-rules/references/upstream-mr.md`. Its `glab mr create …
     --reviewer wieteke.pots` line and its `--input <file>` route both leave
     the label out.
   - `skills/upstream-rules/SKILL.md`: the `build-mr-payload.mjs` object has no
     `labels` key.
   - `skills/upstream-to-unicore/SKILL.md`, Step 6: the `glab mr create` block.
   - `skills/service-cli/references/glab.md`, "Write": the `glab mr create`
     example.
4. `node scripts/validate-skills.mjs` passes on this tree. Its label check
   ("MR-creation snippets carry the provenance label") has three blind spots:
   - it reads only `skills/` and `commands/`;
   - it matches only `--method POST`, so `upstream-rules`' `-X POST` slips past;
   - it never looks at `glab mr create` lines.

## Acceptance Criteria

- `shared/upstream-mr.md` names the label in both MR-creation routes:
  - `--label "ai:agent-authored"` on the `glab mr create` line;
  - `"labels": "ai:agent-authored"` in the JSON body for the `--input` route.
  The generated copies are regenerated, not hand-edited.
- The read-back bullet in `shared/upstream-mr.md` that confirms the reviewer
  with `glab mr view` also confirms the label. When the label is missing, it
  repairs it with
  `glab mr update <iid> -R <canonical-repo> --label "ai:agent-authored"`.
- The MR recipes in these three skills carry the label:
  - `skills/upstream-rules/SKILL.md`: the payload object;
  - `skills/upstream-to-unicore/SKILL.md`, Step 6: the `glab mr create` block;
  - `skills/service-cli/references/glab.md`: the `glab mr create` example.
- `scripts/validate-skills.mjs` fails on each of these:
  - a fenced-code line in `skills/`, `commands/` or `shared/` that starts with
    `glab mr create` and has no `--label "ai:agent-authored"`;
  - a `glab api "…/merge_requests"` POST written with `-X POST`, as well as
    with `--method POST`;
  - such a POST that uses `--input` in a file that never mentions
    `ai:agent-authored`.
- On the tree after the change, the extended check reports nothing.
- On the tree before the change, the extended check reports exactly
  `skills/upstream-rules/SKILL.md`, `skills/upstream-to-unicore/SKILL.md` and
  `skills/service-cli/references/glab.md`.
- `skills/code-review/SKILL.md` is not flagged. It POSTs notes and discussions
  with `--input`, but it never creates an MR.
- A changelog fragment `changelog.d/fixed.agent-label-outside-create-pr.md`
  describes the change.

## How to verify

- [x] **The check fails without the fix.** With only the validator change applied
      and the recipes still as on `main` (`379bac9`),
      `node scripts/validate-skills.mjs` exits 1 with exactly three errors:
      - `skills/service-cli/references/glab.md: glab mr create snippet omits --label "ai:agent-authored"`
      - `skills/upstream-rules/SKILL.md: glab MR-creation snippet posts an --input payload, and the file never sets labels to "ai:agent-authored"`
      - `skills/upstream-to-unicore/SKILL.md: glab mr create snippet omits --label "ai:agent-authored"`
      `skills/code-review/SKILL.md`, which POSTs notes with `--input`, is not
      among them. Neither are the prose mentions of `glab mr create` in
      `shared/upstream-mr.md`, `skills/upstream-rules/SKILL.md` and
      `commands/create-pr.md`.
- [x] **The check passes with the fix.** With the recipes fixed,
      `node scripts/validate-skills.mjs` prints
      `OK: 38 skills validated, 95 docs link-checked, no errors.`
- [x] **The generated copies match.** `bash scripts/generate-adapters.sh`
      rewrote `AGENTS.md`, `.claude/rules/upstream-mr.md`,
      `.github/copilot-instructions.md` and
      `skills/upstream-rules/references/upstream-mr.md` from
      `shared/upstream-mr.md`.
      `bash scripts/validate-ai-instructions.sh` exits 0 with `No drift
      detected.`
- [x] **The plugin still validates.** `claude plugin validate .` reports
      `Validation passed with warnings`. The only advice concerns the README
      install line, which was there before this change.
- [x] **The label is in every recipe.**
      `rg -n 'ai:agent-authored' shared/upstream-mr.md skills/upstream-rules/SKILL.md skills/upstream-to-unicore/SKILL.md skills/service-cli/references/glab.md`
      finds all of them:
      - in the shared rule, the new bullet (lines 18–20, both routes) and the
        read-back repair (lines 64–66);
      - the `labels` key in the `upstream-rules` payload;
      - the `--label` flag in `upstream-to-unicore` and in `service-cli`.
- [x] **Routing evals: not triggered.** Two `SKILL.md` files change
      (`upstream-rules`, `upstream-to-unicore`), and only in their bodies. No
      `name`, `description` or `when_to_use` changes, and no case under
      `evals/` changes.
- **Not part of this item.** The first agent MR opened after the next release
  through the upstream rule is the live proof. `scripts/delivery-metrics.mjs`
  will show the label share catching up with the trailer share from then on.

## Technical Notes

- **Generated files.** `shared/upstream-mr.md` is injected between
  `BEGIN SHARED:upstream-mr` markers into `AGENTS.md`,
  `.claude/rules/upstream-mr.md`, `.github/copilot-instructions.md` and
  `skills/upstream-rules/references/upstream-mr.md`. Edit only the shared file.
  Then run `bash scripts/generate-adapters.sh` (the pre-commit hook does too)
  and stage every regenerated file. Never edit inside the markers.
- **Validator.** Extend the existing block in `scripts/validate-skills.mjs`;
  do not add a second one:
  - It already folds shell line continuations, which makes the
    `upstream-rules` POST one line.
  - Track fenced blocks by toggling on lines that start with three backticks.
  - Keep the `glab mr create` rule to fenced code. Prose names
    `glab mr create` often ("`glab mr create` cannot carry a real MR body"), and
    those lines must not trip it.
  - Inline snippets in prose, such as `commands/create-pr.md:179`, already
    carry the label and stay unchecked.
  - For the `--input` route, a file-level presence check is enough: the payload
    is built in a neighbouring code block, not on the POST line.
- **Labels that do not exist yet.** On a project that does not have the label,
  GitLab creates it when an MR is opened with it. This matters for
  `unicore-template` and client projects. No `glab label create` step is
  needed.
- **Test level.** The validator change is the automated check that fails
  without the fix. Run it once on `gitlab/main` before editing the recipes and
  record which files it flags. That is the before list in the criteria.
- Skill and `shared/` change, so a changelog fragment, and no change to
  `CHANGELOG.md` or the plugin version.

## Out of Scope

- Backfilling the label on the 17 MRs already merged. The maintainer decided
  against it on 2026-10-21, so the label share before this fix stays an
  undercount.
- A CI job or webhook that labels MRs server-side.
- A trailer fallback in `scripts/delivery-metrics.mjs`.
- Release MRs from `release_train`: a bot opens them, not an agent session.

## Related

- [../../shared/upstream-mr.md](../../shared/upstream-mr.md)
- [../../skills/create-pr/SKILL.md](../../skills/create-pr/SKILL.md): the
  recipe that does carry the label, with its read-back
- [../../rules/git-flow.md](../../rules/git-flow.md): the label as provenance
  signal
- [../../scripts/validate-skills.mjs](../../scripts/validate-skills.mjs)
- [../../scripts/delivery-metrics.mjs](../../scripts/delivery-metrics.mjs)
- MR: https://gitlab.com/greenberrynl/config/ai-workflows/-/merge_requests/255
