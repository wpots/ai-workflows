# Changelog

Release notes for the `greenberry` plugin — everything the plugin ships from
this repo: `skills/`, `commands/`, the `.claude-plugin/` manifests, `hooks/`
plus the scripts they run, and the ambient layer those hooks deliver
(`CLAUDE.md` and the universal `rules/` subset).

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions are
plain semver. Bump `version` in `.claude-plugin/plugin.json` and add the entry
here **in the same MR** whenever a change alters what the plugin ships. See
"Ship a plugin release" in `README.md` for the bump rule. Repo-internal changes
(`README.md`, `docs/`, CI) don't bump.

## [Unreleased]

## [1.3.1] - 2026-07-29

### Fixed

- The `SessionStart` ambient-layer hook no longer keys its "already applied"
  stamp on the plugin version. `$CLAUDE_PLUGIN_ROOT` is version-keyed
  (`…/greenberry/1.3.0`), so any release that shipped without a `plugin.json`
  bump reused that directory name, the gate read it as already applied, and the
  changed `CLAUDE.md` or universal rule never reached `~/.claude` — silently,
  for as long as the version stood still. `scripts/sync-ambient.sh` now stamps a
  `cksum` digest of the files it delivers (plus itself, so a change to the
  subset or the retired list counts), migrating away from the old
  `ambient-synced-from` stamp on first run. Local edits to `~/.claude` are still
  never reverted: they do not change the source digest.

### Changed

- The release rule now covers everything the plugin delivers — `hooks/`, the
  scripts hooks run, and the ambient layer — not only `skills/`, `commands/`,
  and `.claude-plugin/`. An unbumped release lands in the previous version's
  directory and is invisible in `/plugin`, so the bump is load-bearing.
  (`shared/upstream-mr.md`, rendered into `CLAUDE.md`, `AGENTS.md`, the Copilot
  instructions, and the project adapters.)

## [1.3.0] - 2026-07-29

### Added

- `skills/start-project` — day-one intent capture, before any tooling runs:
  a grouped-rounds interview (never one questionnaire, never invented facts)
  that produces `docs/project-brief.md` (why, stakeholders, audiences, goals
  and how they are measured, risks), `docs/project-spec.md` (release rules,
  roles, domain entities, non-functionals, integrations, environments, open
  decisions) and `docs/architecture.md` (intended layer mapping, data model,
  trust boundaries, deployment topology, ADR-style decision log), then hands
  over to `skills/init-project`. Runs on a fresh template clone and as a
  retrofit on an existing codebase, where it harvests the repo first and asks
  only what cannot be derived. Unanswered questions are recorded as open
  questions/decisions rather than filled in.
- `templates/project-brief.md`, `templates/project-spec.md`,
  `templates/project-architecture.md` — the content contract for those three
  documents.

### Changed

- `skills/init-project` — defers to `docs/architecture.md` when it exists
  instead of re-deriving the layer mapping: `CONVENTIONS.md` lists the folders
  that exist and links there for the layer and the reason, divergences are
  reported as findings, and the three intent documents are never modified.
  Closes the drift risk between the two documents.
- `skills/architecture-review` — reads `docs/architecture.md` as the *intended*
  mapping and reviews against it, reporting unmapped folders, contradicted
  mappings and stale paths as findings instead of silently substituting an
  inferred mapping. Says so in the output when it had to infer.

## [1.2.0] - 2026-07-29

### Changed

- `skills/watch-mrs` — the watcher now tracks pipeline state separately
  (per-MR `pipeline.txt`, one report per transition, detail fetched only when
  merge status indicates a CI problem), names the failing job and stage on a
  failed pipeline, and hands off after any merge: pipeline failures offer
  `skills/pipeline-triage` (interim: failing job + suggested next step until
  that skill exists), merges offer the `skills/mr-merged` closeout. Hand-offs
  are proposals surfaced to the user, never silent autonomous fixes.
  Auto-merge stays opt-in per invocation.

## [1.1.0] - 2026-07-29

### Added

- `skills/mr-merged` — post-merge closeout: sprint board to done, a
  "How to test this" comment for the product owner (drafted from the MR,
  posted to the ticket only after approval — the plugin's second sanctioned
  tracker write), proposed ticket transition, and branch/worktree cleanup.
  Standalone or as the hand-off target when `skills/watch-mrs` reports a
  merge.
- `skills/code-review` and `commands/review-code.md` gained a diff-scoped
  documentation-and-comment freshness dimension backed by the new
  `rules/documentation.md` (shipped unversioned in !44 on the same day;
  recorded here).

## [1.0.0] - 2026-07-29

### Added

- First versioned release. The plugin has shipped from `main` since
  2026-07-28 (all skills, command runbooks, and the marketplace manifest);
  this release adds the `version` field, this changelog, and a validator
  check (`scripts/validate-skills.mjs`) that fails when the manifest version
  has no matching changelog entry.
