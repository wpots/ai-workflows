# Chore: Trim The Always-On Ambient Layer

## Status

done

Filed 2026-10-08 from the October 2026 stack review (findings F4 and F10) as a
`draft` that should not be picked up alone. Decided the same day (see
Decisions): all parts go ahead, cut into three independent slices.

## Slice

1/3 — the upstream-MR rule leaves the ambient layer (plus the skill-doctor
evidence for the whole item)

| Slice | Item | Delivers |
| --- | --- | --- |
| 1/3 | this file | `## Shared Workflow Assets Land via MR` out of `CLAUDE.md`, into a repo-only Claude rule and the upstream skills |
| 2/3 | `chore-ambient-layer-trim-2-worktree-reference.md` | the worktree section of `## Shell Usage` into one skill reference, a short pointer left behind |
| 3/3 | `chore-ambient-layer-trim-3-command-rows.md` | the 15 command rows a skill row already covers dropped from `CLAUDE.md` |

The slices touch different sections of `CLAUDE.md` and are cut from `main`
independently; none depends on another.

## Priority

low

## Summary

`CLAUDE.md` is loaded into every session in every project. Cut what is
duplicated or only needed in some repos. This slice moves the 4 KB upstream-MR
rule to where it applies: sessions inside `ai-workflows` and the skills that
upstream from elsewhere.

## Decisions (Wieteke, maintainer, 2026-10-08)

1. **Decided: move `## Shared Workflow Assets Land via MR` out of the ambient
   layer** (slice 1). It must still load in every session inside
   `ai-workflows` (Claude and Codex) and whenever `upstream-rules` or
   `upstream-to-unicore` runs from another project.
2. **Decided: move the worktree section of `## Shell Usage` into a shared skill
   reference** (slice 2), leaving a pointer of at most about four lines with the
   non-negotiables.
3. The no-decision slice — the 15 duplicate command rows — goes ahead too
   (slice 3).
4. Run `/skill-doctor` first and record the evidence; do not implement
   description trims or `paths:` (recommendation only, below).

## Measured

### `CLAUDE.md` on `main` at `98a39c3` (2026-10-08)

26,992 bytes (about 6,750 tokens). The draft measured 25,195 at `cf294ce`; the
"Git inside the sandbox" subsection (1,797 bytes) landed in between.

| Part of `CLAUDE.md` | Bytes | Note |
| --- | --- | --- |
| `## Command Mapping` incl. `### Skill Mapping` | 10,690 | the command-mappings block is 1,848 of it |
| `## Shell Usage` | 8,445 | worktrees 3,125, autonomy 2,183, git in the sandbox 1,797, CLI first 1,142 |
| `## Shared Workflow Assets Land via MR` | 4,020 | only relevant in canonical config repos and upstream skills |
| everything else | 3,837 | |

- Of the 17 rows in the command-only block, 15 are already covered by a skill row
  that names `commands/<x>.md` as the fallback. `safe-kill-port` and
  `new-device-setup` have no skill row and must keep theirs. The trigger sets are
  not identical (`performance review` is only in the command row for
  `sustainable-review`). `AGENTS.md` and the Copilot adapter need the block: they
  are the routing for tools without skills.

### skill-doctor (2026-10-08, Claude Code 2.1.283)

`claude -p "/skill-doctor"` from a worktree at `98a39c3`. The usage columns are
this machine's history (the maintainer's), so "never" means never here, not
never on the team.

- **Listing cost.** The 38 greenberry skills cost about 6,400 tokens of skill
  listing per turn, 60–340 each; the largest are `release` (≈340),
  `start-project` (≈270), `improve-skill` (≈260), `dependency-hotfix` and
  `close-sprint` (≈250). That is roughly what `CLAUDE.md` costs.
- **Never invoked here:** 14 of 38, ≈2,340 tokens per turn —
  `architecture-review`, `compact-sprint`, `component-spec`,
  `datocms-migration`, `dependency-hotfix`, `greenberry-maintenance`,
  `payload-jobs`, `run-checks`, `scaffold-component`, `sprint-planning`,
  `start-project`, `upstream-to-unicore`, `user-journeys`, `wcag-audit`. Several
  are new or rare by design (`dependency-hotfix`, `start-project`,
  `user-journeys`), so one machine's history is no removal signal.
- **Stack-specific skills:** `payload-jobs` ≈210, `datocms-migration` ≈180,
  `migration-check` ≈150 (1 use in 7 days) — ≈540 tokens per turn together.
- **Descriptions:** none is near the 1,536-character listing cap; skill-doctor
  reports no truncation.
- The 14 skills that also ship a same-named `commands/` runbook appear twice in
  the report with identical figures. Commands without a twin (`review-code`,
  `safe-kill-port`, `new-device-setup`) show no listing cost, so the duplicates
  are most likely a reporting artefact rather than double cost — unverified.
- The largest never-invoked cost on this machine sits outside the plugin: 13
  claude.ai-synced skills and the `cowork-plugin-management` plugin.

**Recommendation (not implemented).**

- Trimming descriptions: not supported by the evidence. The listing is ≈170
  tokens a skill on average and the text is mostly the Dutch and English
  trigger phrases that do the routing; the payoff is a few hundred tokens at a
  routing risk.
- `paths:` on `payload-jobs`, `migration-check`, `datocms-migration`: not yet.
  It saves at most ≈540 tokens per turn in projects without that stack. Per the
  skills docs a `paths:` skill loads automatically only when Claude works with
  matching files, and these three are routed by symptoms ("job draait niet",
  "migration already exists", "change the cms schema") that come up before any
  matching file is open — so the inference is that `paths:` would cut exactly
  that routing. `scripts/validate-skills.mjs` also warns on the unknown key.
  Revisit with team-wide usage, not one machine's.

## Acceptance Criteria

- [x] `CLAUDE.md` no longer carries the `upstream-mr` fragment; a pointer of a
      few lines names the rule and where the full text loads.
- [x] Every Claude session inside `ai-workflows` (main checkout and worktrees)
      loads the full rule from a repo-only file that `scripts/sync-ambient.sh`
      does not sync and the plugin does not ship as ambient layer:
      `.claude/rules/upstream-mr.md`, generated from `shared/upstream-mr.md`.
- [x] Codex in `ai-workflows` keeps the rule: `AGENTS.md` still carries the
      `upstream-mr` fragment (unchanged).
- [x] `upstream-rules` and `upstream-to-unicore` load the full rule from
      `skills/upstream-rules/references/upstream-mr.md` (generated from the same
      fragment) before they branch; `improve-skill`, which also edits
      `ai-workflows` from other projects, points at it too.
- [x] `scripts/validate-skills.mjs` fails when `CLAUDE.md` carries the
      `upstream-mr` fragment again, or when the repo-only rule, the skill
      reference or `AGENTS.md` loses it.
- [x] unicore-template checked read-only: if its own `CLAUDE.md` / `AGENTS.md`
      lacks the rule, the MR notes carry the exact text to add before merge.
- [x] A changelog fragment `changelog.d/changed.ambient-upstream-mr-rule.md`;
      `CHANGELOG.md` and the plugin version untouched.
- [x] `node scripts/validate-skills.mjs` and
      `bash scripts/validate-ai-instructions.sh` pass; no adapter drift.

## How to verify

- [x] `wc -c CLAUDE.md` — 26,992 bytes on `main` (`98a39c3`), 23,302 on this
      branch: −3,690 bytes, about 920 tokens per turn in every session.
- [x] `rg -c "BEGIN SHARED:upstream-mr" CLAUDE.md AGENTS.md
      .claude/rules/upstream-mr.md skills/upstream-rules/references/upstream-mr.md`
      — `CLAUDE.md` has none, the other three one each.
- [x] The repo-only rule loads: from the worktree,
      `claude -p "…is .claude/rules/upstream-mr.md loaded…" --tools ""` answered
      YES and quoted the rule's first bullet verbatim.
- [x] `node scripts/validate-skills.mjs` — 38 skills validated, 91 docs
      link-checked, no errors. With `CLAUDE.md` stashed back to `main` it exits 1:
      `CLAUDE.md: carries the upstream-mr fragment, which loads in every project`.
- [x] `bash scripts/validate-ai-instructions.sh` (the pre-commit hook on the
      delivery commit) — all suites pass, no adapter drift; `AGENTS.md` and
      `.github/copilot-instructions.md` unchanged.
- [x] unicore-template, read-only via `glab api` (project
      `greenberrynl/the-greenhouse/unicore-template`, default branch
      `development`): no `CLAUDE.md` or `AGENTS.md` on `development`, `main`,
      `experimental-new-setup` or `development-payloadcms`; only the stale
      `feat/AI-workflows` branch (April 2026) has them, without this rule. The
      text to add is in the MR notes.

## Technical Notes

- Loading facts (code.claude.com/docs/en/memory): files in `.claude/rules/`
  without `paths` frontmatter load at launch with the same priority as
  `.claude/CLAUDE.md`, and keep loading alongside `AGENTS.md`. The root
  `CLAUDE.md` cannot hold a repo-only rule: it is also the global baseline that
  `sync-ambient.sh` copies to `~/.claude/CLAUDE.md`.
- The project templates (`templates/project-CLAUDE.md`, `project-AGENTS.md`,
  `project-copilot-instructions.md`, `project-ai-workflows.md`) keep their
  `upstream-mr` markers: a synced project now carries the rule once (its own
  adapter) instead of twice. Dropping it there too is a separate decision.

## Out of Scope

- Trimming skill descriptions or adding `paths:` (recommendation above only).
- Changing `AGENTS.md`, the Copilot adapter, or the project templates.
- Opening an MR on unicore-template.

## Related

- [../../CLAUDE.md](../../CLAUDE.md)
- [../../shared/upstream-mr.md](../../shared/upstream-mr.md)
- [../../skills/upstream-rules/SKILL.md](../../skills/upstream-rules/SKILL.md)
- [../../skills/upstream-to-unicore/SKILL.md](../../skills/upstream-to-unicore/SKILL.md)
- [../../scripts/generate-adapters.sh](../../scripts/generate-adapters.sh)
- [../../scripts/validate-skills.mjs](../../scripts/validate-skills.mjs)
- `chore-ambient-layer-trim-2-worktree-reference.md` (slice 2/3)
- `chore-ambient-layer-trim-3-command-rows.md` (slice 3/3)
