# Changelog

Release notes for the `greenberry` plugin — everything the plugin ships from
this repo: `skills/`, `commands/`, the `.claude-plugin/` manifests, `hooks/`
plus the scripts they run, and the ambient layer those hooks deliver
(`CLAUDE.md` and the universal `rules/` subset).

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions are
plain semver. Bump `version` in `.claude-plugin/plugin.json` and add the entry
here **in the same MR** whenever a change alters what the plugin ships. See
"Ship a plugin release" in `docs/contributing.md` for the bump rule.
Repo-internal changes (`README.md`, `docs/`, CI) don't bump.

## [Unreleased]

## [1.19.0] - 2026-08-04

### Added

- A worktree cost rule in the ambient layer: one root (`~/.worktrees/<repo>-<slug>`,
  never inside the repo and never in a registered additional working directory),
  a symlinked `node_modules` by default, a copy-on-write clone only when a
  bundler that rejects symlinks has to run, and removal right after the push.
  Measured on a real repo, a bare checkout is ~90 MB against 1.4-3 GB once
  dependencies and a build output are in it.
- The same rule now scales with the package manager: the symlink/clone default
  exists because npm has no shared store (five worktrees in one repo held
  ~7.3 GB of duplicated dependencies), while a content-addressed store (pnpm)
  makes a plain install in the worktree hardlink from that store — seconds,
  almost no disk, lockfile-accurate. Agents must use whatever `packageManager`
  pins rather than forcing a manager the project refuses.

### Changed

- The worktree section of `create-pr`'s push-and-MR reference now lists the
  gitignored artifacts a fresh worktree lacks (env files, Next route types,
  generated import maps) next to the error each one actually produces, warns
  that ignore patterns match the absolute path so `~/.worktrees` is skipped by
  test runners too, and adds how to pin both sides of a before/after build plus
  how to audit stale worktrees in a squash-merging repo.
- That reference also warns against running the test suite from the main
  checkout with `--rootDir <worktree>` (config-resolved path aliases keep
  pointing at the original tree, so tests load modules from both checkouts),
  and notes that deleting a copied env file stages a deletion when the project
  commits its env files encrypted.

## [1.18.1] - 2026-08-04

### Changed

- `create-pr` now states at the `glab mr create` example itself that `glab` has
  no `--description-file` / `--body-file` / `-F` flag, so a long body cannot be
  attempted with a guessed flag name that fails on `Unknown flag`. The
  file-based flow was already documented one reference file away; the fact now
  sits where the example gets copied from.
- `create-pr` requires the MR to be created in the same turn it is announced.
  Ending a turn on "creating the MR now" costs the user a round trip and leaves
  a pushed branch with no MR.
- `create-pr` covers pre-push hook failures that come from outside the branch
  diff: a gitignored local artefact directory missing from the linter's own
  ignore list fails `lint:check` on the developer's machine and never in CI.
  Mirror the directory into the linter's ignores as its own commit rather than
  reaching for `--no-verify`, which also skips the migration and schema checks
  sharing that hook.

## [1.18.0] - 2026-08-03

### Added

- A non-waivable VS Code termination rule now requires explicit approval for
  the exact PID and command before an agent may signal `Code`, `Code Helper`,
  or another VS Code process. Pattern-based kills must be resolved and
  inspected first; broad process-cleanup requests do not count as approval.
- The Claude plugin now forces a user approval prompt for `kill`, `pkill`,
  `killall`, and `taskkill` through a `PreToolUse(Bash)` hook, even when a
  local allowlist would otherwise permit the command. Fresh project settings
  carry matching `permissions.ask` rules as a second enforcement layer.

### Changed

- `safe-kill-port` now inspects every resolved PID and stops for explicit
  approval before sending any signal to VS Code or an ambiguous target.

## [1.17.1] - 2026-07-30

### Fixed

- `rules/sustainability.md` now uses version-aware `next/image` guidance:
  Next.js 16+ no longer recommends the deprecated `priority` prop, `preload`
  is reserved for one unambiguous LCP image, and eager loading or
  `fetchPriority="high"` remains the default recommendation for most LCP
  cases.

## [1.17.0] - 2026-07-30

### Changed

- The named reviewer is now scoped to **one** repo: `ai-workflows`. Every other
  repo — `unicore-template`, client projects — gets its MR opened with no
  `--reviewer` flag, and a human assigns the reviewer. The rule shipped through
  `shared/upstream-mr.md`, which is injected into every synced project's
  `CLAUDE.md`/`AGENTS.md`/Copilot adapter, so `wieteke.pots` was being requested
  as reviewer on project MRs she authored herself.
- `skills/create-pr`, `skills/work-backlog`, `commands/create-pr.md` and
  `rules/git-flow.md` follow the same split, and explicitly forbid inferring a
  reviewer from CODEOWNERS, repo members, or git history, or assigning the MR
  author. `--reviewer` outside `ai-workflows` only when the user named the
  person.
- `skills/upstream-to-unicore` no longer passes `--reviewer`; it reports that a
  reviewer still has to be assigned. `skills/upstream-rules` keeps the mandatory
  reviewer — it only ever targets `ai-workflows`.

## [1.16.0] - 2026-07-30

### Removed

- `skills/sprint-board` — the per-sprint work board. Its cost was permanent and
  its value optional: the description loaded into every session, it asked to be
  updated at *every* status change, and a hook nudged on top of that — all to
  maintain an untracked file that duplicated status already derivable from
  `docs/backlog/` (each item's `Status`), the branch, and the MR. The tracker
  and the backlog items stay the single source of truth for what is in flight.
- The `PostToolUse(Bash)` board nudge in `templates/project-claude-settings.json`
  (MR/PR create → *in review*, merge → *done*). The four remaining harness hooks
  are untouched: the migration deny guard, both graphify-before-read/grep
  guards, and the background graph refresh.

### Changed

- `skills/mr-merged` — the board step is gone and steps are renumbered 1–7. The
  closeout keeps everything that carried real information: MR resolution, the
  ticket-completeness gate over `docs/backlog/`, the "How to test this" comment
  for the product owner, the proposed transition, and branch/worktree cleanup.

## [1.15.0] - 2026-07-30

### Added

- `scripts/sync-ambient.sh` — two offline **freshness checks** at session start,
  for the one failure the ambient hook cannot fix by syncing: a frozen plugin,
  where the source it copies from is itself stale.
  - the ai-workflows marketplace entry in `~/.claude/settings.json` carries no
    `autoUpdate` — the exact state that pins an install (and the ambient
    `CLAUDE.md` and rules with it) to the commit it was added on
  - the plugin cache has not changed in over 14 days, which is what a silently
    failing auto-update looks like: an HTTPS-registered marketplace, or expired
    git auth
  Both run **before** the content gate, because a pinned install has a stable
  digest and would otherwise exit before reporting anything. The note is
  advisory, names the fix, and fires at most **once a day** (stamped in
  `$CLAUDE_PLUGIN_DATA`); a malformed or absent `settings.json`, or a missing
  `node`, degrades to silence rather than to a broken session. Covered by five
  new cases in `scripts/smoke-test-ambient-sync.sh`.

### Changed

- `docs/setup-machine.md` and `docs/troubleshooting.md` — document that the hook
  now reports both states, and that silence afterwards is not proof the fix
  worked (`/plugin` is).

## [1.14.0] - 2026-07-30

### Added

- `skills/improve-skill` — **compound step**: every durable learning is now
  pressed into each artifact it deserves — a mechanical check
  (validator/lint/hook/CI) when the failure is detectable, an eval case when
  it was behavioral, and a `docs/solutions/<slug>.md` note in the project
  when it is project-specific. `skills/backlog`, `skills/refinement`, and
  `skills/work-backlog` now read `docs/solutions/` as grounding, so lessons
  resurface at planning time instead of being relearned.
- `scripts/validate-skills.mjs` errors on committed git conflict markers —
  rebase bypasses the pre-commit hook, and that gap shipped a half-resolved
  CHANGELOG twice on 2026-07-30. This check is itself the compound step
  applied to that failure.

## [1.13.0] - 2026-07-30

### Added

- `rules/git-flow.md` — the branch-and-merge policy that was until now implicit
  and inconsistent: fast-forward + squash-always, an explicit
  `squash_commit_template`, delete-source-branch, and both merge gates
  (green pipeline, resolved discussions). Squash stays the default — agent
  branches are exactly the case where intermediate commits are noise — and the
  rule names its one price: the **MR title becomes the commit message**, so it
  must be a conventional-commit subject, mechanically checkable in CI over
  `CI_MERGE_REQUEST_TITLE`.
- `scripts/gitlab-merge-settings.mjs` — checks a GitLab project against that
  baseline and prints a per-setting table; read-only unless `--apply`, which
  PUTs only the deviating fields. Resolves the project from the repo's
  gitlab.com remote or `--project`, and `--strict` exits non-zero for CI.
- `skills/start-project` lane 1 gets check 3b (merge settings, via that script,
  fixed only after an explicit go) and `skills/maintenance` lane E reports
  merge-settings drift as a finding.

### Changed

- `skills/create-pr` labels every MR/PR it opens `ai:agent-authored` (also via
  the push-options fallback) and requires a conventional-commit title, with a
  new **Provenance label** recap row. Provenance had been riding on
  `Co-Authored-By: Claude` commit trailers, which a squash merge discards —
  and `%{co_authored_by}` does not recover them, since it expands to commit
  *authors*, not to the trailers inside the commits.
- `scripts/delivery-metrics.mjs` reports the agent-authored share primarily
  from that label (survives squash, rebase and rewrites), keeps the trailer
  share as a secondary known-undercounting signal, counts `revert`-labelled
  MRs alongside revert commits, and calls out the 0%-label/high-trailer case
  as "label not applied yet" instead of a usage collapse. `skills/maintenance`
  lane H reads it that way. Intervention rate stays `n/a` — explicitly with no
  proxy substituted.

## [1.12.0] - 2026-07-30

### Added

- `skills/maintenance` lane H — **delivery metrics**: the monthly sweep now
  runs `scripts/delivery-metrics.mjs` (read-only; git log + glab api) and
  reports merged MRs, median hours to merge, agent-authored commit share
  (`Co-Authored-By: Claude` trailers), and revert count, with the delta
  against the previous sweep as the actual finding. Intervention rate stays
  `n/a` until session telemetry exists.

## [1.11.2] - 2026-07-30

### Fixed

- `skills/upstream-rules`, `skills/upstream-to-unicore` and the ambient
  `shared/upstream-mr.md` now pass **both** `-R` and `-H <canonical-repo>` to
  `glab mr create`, plus `-R` on every follow-up `glab mr update`/`mr view`.
  `-R` sets only the *target* project; the head (source) project and the MR
  lookup still default to the current directory's git remote. Run from the
  originating project — which is where an upstream change starts, and the only
  option for an agent that may not `cd` — and MR creation failed with
  `422 [Source project is not a fork of the target project]`, with the guidance
  offering no way out. Found while opening !68.

  Also warns off the `glab api …/merge_requests` workaround: `--field
  "reviewer_ids[]=<id>"` sends the bracket as a literal JSON key and silently
  creates the MR with **no reviewer** — a rule violation the CLI reports as
  success — and attaching one afterwards needs a raw JSON body with an explicit
  `Content-Type: application/json`.

## [1.11.1] - 2026-07-30

### Changed

- `skills/create-pr` — no behavior change: the worktree-hook caveat and the
  long-description/cwd mechanics moved to
  `skills/create-pr/references/push-and-mr-mechanics.md` behind conditional
  pointers (progressive disclosure; ~3.5 KB less loaded per invocation).
  The reviewer hard rule stays inline.

## [1.11.0] - 2026-07-30

### Added

- `skills/datocms-migration` — drives a DatoCMS schema change through a sandbox
  fork instead of a hand-written migration: fork the primary environment,
  hand off to the user's UI work, then autogenerate the migration with **both**
  sides of `--autogenerate` spelled out (omitting the reference side diffs
  against the profile's configured environment and silently describes the wrong
  delta). Resumable across sessions via a gitignored `.datocms-active-fork`
  state file that caches the discovered profile, base environment, and env file.
  Profiles, migrations directory, env-file convention, base environment, and
  admin URL are all **discovered** from `datocms.config.json` and the repo — no
  project-specific names baked in — so it fits a single DatoCMS instance or
  several sharing one schema.

  The review phase is what the CLI does not do: it flags destructive operations
  (no undo in DatoCMS, and they drop content on every instance), out-of-scope
  models leaked in from a drifted fork — the same class of bug
  `skills/migration-check` catches for Payload — literal record/upload IDs that
  do not exist on the other instances, and locale assumptions.

  Originated in the VWS innovatieroute project (two DatoCMS instances sharing a
  schema), generalized on the way up.

## [1.10.0] - 2026-07-30

### Changed

- `skills/code-review` (and the fallback runbook) now sweep eight explicit
  review lenses — correctness, security, performance/sustainability,
  accessibility, architecture, type safety, documentation freshness, test
  coverage — one deliberate pass per lens, merged into a single
  severity-ordered findings list with the lens tagged per finding. Large
  diffs (>~15 files / >~800 lines) run the lenses as parallel subagents.

## [1.9.0] - 2026-07-30

### Added

- `skills/setup-ai-workflows` emits per-project integration tooling: a
  checked-in, env-var-based `.mcp.json` plus a `.cursor/mcp.json` mirror,
  documented in a `## Tooling` section of `CONVENTIONS.md`. Doctrine in the
  new `docs/tooling.md` — CLI-first for scriptable/headless work; MCP for
  browser control, design context, and OAuth SaaS.
- `commands/new-device-setup.md` installs and verifies the machine CLI
  baseline: glab (PAT, api + write_repository), jira-cli, dotenvx via npx,
  plus the claude.ai connector authorization note.

### Removed

- The global MCP definitions (`mcp/servers.json`, `mcp/README.md`) and the
  `~/.cursor/mcp/ai-workflows` sync target — superseded by the per-project
  `.mcp.json` convention.

## [1.8.0] - 2026-07-29

### Added

- `skills/mr-merged` — a **ticket-completeness gate** before the product-owner
  handoff. One ticket can carry several items (one per reviewable MR), so the
  "How to test this" comment now waits until every item carrying the ticket key
  is `done` **on the default branch** — read from `docs/backlog/` via
  `git show origin/main:<path>`, so a `done` that only exists on a branch does
  not count. While slices remain it reports "2/3 merged, waiting on `<item>`",
  posts nothing, and proposes no transition beyond what partial delivery
  justifies. When the ticket does complete, the comment covers the whole
  capability, drawn from every slice's `How to verify` and MR description. No
  local items for the key → the MR is treated as the whole ticket, as before.
- `skills/work-backlog` — fills the BLI's `How to verify` **from what it actually
  ran** before opening the MR: commands and their output, route and role,
  hand-checked states, one line per criterion that needs more than a passing
  test. A step that was not run does not go in, and anything only verifiable on a
  preview deploy is stated as such. The MR description repeats those steps and
  names the slice when a ticket has several.

### Changed

- `skills/backlog` — one item is one MR, blocking: an item that trips a split
  trigger in `rules/mr-sizing.md` may not be written as one item or marked
  `ready`. When `docs/journeys/` exists, the journey's slice candidates are the
  input, in order, chained with `Depends on:`.
- `skills/jira-ticket` — the ticket is the feature, not the MR: tickets stay at
  capability level and are never shrunk to fit one MR, and the product-owner
  instructions arrive when the last item merges.
- `skills/refinement` + `commands/refinement.md` — size is part of readiness. A
  ticket that trips a split trigger is not ready, and the refinement document now
  proposes the slices in dependency order instead of only raising story points.

## [1.7.0] - 2026-07-29

### Changed

- `skills/start-project` is now the **single kickoff entry**, restructured into
  six ordered lanes instead of an interview plus a hand-off:
  - **Lane 0 · Repository** (new) — production repos must come from GitLab's
    *Create from template* flow into the client's group (Notion guide linked).
    Checks the namespace, template lineage (shared history with
    `unicore-template`, file fingerprint as fallback), default branch and merge
    settings, protected branches and approval rules, CI/CD variable **names**,
    Jira/Slack integrations, and the kickoff items the repo cannot answer
    (Jira set up, hosting contract, CMS contract). Reports ok/deviation/unknown,
    fixes nothing silently, and never creates a production repo from the CLI.
    **PoC escape**: skipping the template method is allowed but must be recorded
    as `Project type: PoC` in the brief *and* a decision-log entry, otherwise it
    is not a waiver.
  - **Lane 1 · Config** — runs `skills/setup-ai-workflows` when the project has
    no (or stale) `CONVENTIONS.md`, and offers the refresh after the
    architecture doc exists so the mapping is linked instead of re-derived.
  - **Lane 2 · Resources** (new) — design/prototype links, CMS instance,
    tracker, hosting, integrations and credential owners, brand/legal, test
    accounts — collected *before* any document is written, which is what keeps
    journeys and specs from being rewritten when the frames arrive.
  - **Lane 3 · Intent** — the existing harvest, four interview rounds, and the
    three documents. Round 2 now only *names* the journeys.
  - **Lane 4 · Journeys** — delegates to `skills/user-journeys`.
  - **Lane 5 · Plan** — slice candidates to `skills/backlog` /
    `skills/jira-ticket`, sized per `rules/mr-sizing.md`.
- `templates/project-brief.md` — new optional `Project Type` section that
  carries the PoC/spike waiver and points at its decision-log entry.

## [1.6.0] - 2026-07-29

### Changed

- **Renamed `init-project` → `setup-ai-workflows`** (skill, command runbook, and
  the generated Copilot prompt). The old name read as "initialize the project",
  which is not what it does: it generates `CONVENTIONS.md` and the tool
  adapters. Invocation changes to `/greenberry:setup-ai-workflows`; the old
  name no longer resolves.
- **Routing follows the meaning.** `init project`, `setup project`, and
  `initialize project` now route to `skills/start-project` — the project
  kickoff, which runs `setup-ai-workflows` as one of its lanes. The config
  workflow keeps `apply ai-workflows` and gains `setup ai-workflows`,
  `generate conventions`, and `refresh project config`.
- References updated across the mappings and generated adapters, `FEATURES.md`,
  the canonical-sources and pipeline-map registries, the skills-first migration
  plan, `README.md`, `scripts/sync.sh` and its smoke test, and the Copilot
  template's no-CONVENTIONS hint.

## [1.5.0] - 2026-07-29

### Added

- `skills/user-journeys` — the missing lane between a release spec and a
  backlog. One document per journey in `docs/journeys/`: actor, trigger, the
  main path step by step (surface, data touched, design frame per step),
  decision points, alternate and error paths, per-surface states, permissions,
  content/localisation, the keyboard route, the non-functionals that bite, and
  how completion is measured. It closes with **slice candidates** cut per
  `rules/mr-sizing.md`, walking skeleton marked — which is what
  `skills/backlog` writes items from. Four modes (spec-driven, design-driven,
  retrofit from a running app, interview-only), Figma frames read through the
  connector, and a two-way coverage check between spec rules and walked steps.
  Callable on its own, and the journeys lane of `skills/start-project`.
- `templates/user-journey.md` — the content contract for a journey document,
  with the same never-invent discipline as the brief and spec templates: an
  unstated step, state, role, or metric becomes an open question with an owner.

### Changed

- `templates/project-brief.md` — the `Core User Journeys` section now states
  that it lists journeys rather than specifying them, and points at
  `docs/journeys/<slug>.md` for the walked path.

## [1.4.0] - 2026-07-29

### Changed

- `templates/project-architecture.md` — restructured outside-in (system context →
  topology → request paths → read path and invalidation → layers → data →
  boundaries) and turned from a table-only skeleton into a **map**: it opens with
  a question-to-document link table and the rule that a rule wins when the two
  disagree, so no section restates what a rule or spec owns. Mermaid diagrams are
  now part of the contract (system context minimum; request paths once surfaces
  share a runtime; a read/invalidation pair once anything is cached
  cross-request). New sections: runtime constraints the topology implies, how the
  layer boundary is enforced and at which severity, auth surfaces, background
  jobs, media, and **Known Architectural Debt** — tracked deviations with the
  item that owns each one, kept separate from Open Questions. Distilled from the
  RefugeeWork website's `docs/architecture.md`, the first real instance of this
  document.
- `skills/start-project` — Round 4 now covers system context, the runtime paths,
  boundary enforcement, and known deviations; the harvest additionally reads
  middleware/route groups, cache tags, revalidation hooks, cron and queue config,
  import-boundary lint severity, and `docs/todo/` plus the backlog for debt that
  is already tracked. Writing rules gained the map-not-rulebook framing, the
  diagram requirement, outside-in ordering, and the rule that a retrofit with no
  recorded decisions ships an empty log and a full debt section rather than
  invented ADRs.
- `skills/architecture-review` — reads the new debt section and reports listed
  deviations as `Known` with their tracker instead of as fresh findings, so
  unseen problems stay visible. Two exceptions still surface: a deviation that
  outgrew its entry, and an entry whose tracker or path no longer exists.

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
