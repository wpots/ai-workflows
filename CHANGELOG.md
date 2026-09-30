# Changelog

Release notes for the `greenberry` plugin — everything the plugin ships from
this repo: `skills/`, `commands/`, the `.claude-plugin/` manifests, `hooks/`
plus the scripts they run, and the ambient layer those hooks deliver
(`CLAUDE.md` and the universal `rules/` subset).

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions are
plain semver. Describe the change under `## [Unreleased]` **in the same MR**
whenever it alters what the plugin ships; do not touch the `version` in
`.claude-plugin/plugin.json` — the number is assigned after merge by
`scripts/assign-plugin-version.mjs` in its own release MR. See "Ship a plugin
release" in `docs/contributing.md`. Repo-internal changes (`README.md`,
`docs/`, CI) don't get an entry.

## [Unreleased]

### Changed

- `skills/mr-merged` — the squash-merge cleanup no longer stalls when the forge
  rebased the source branch right before merging, which makes the local head
  and the MR's source head differ for good. `git range-diff` against the squash
  commit decides whether the local branch holds anything the merge does not;
  `git patch-id` is ruled out, since shifted context lines change it.
- `skills/create-pr`, `commands/create-pr.md` — the read-back after opening the
  MR now includes the MR pipeline once its setup stage has finished, and a
  failed job is reported with its log tail instead of "pipeline running". The
  recap's Checks row carries the pipeline's state. Local checks cannot catch an
  `install` failure on a registry token that feature-branch pipelines do not
  receive, which only shows once a lockfile change empties the cache.
- `skills/mr-merged` — Step 5 reads the post-merge deploy back: the deploy
  job's log, not only its status, and where a CLI is at hand the deployment
  for the merge commit. A hook-only deploy job passes even when the hook
  refused, so a refused or missing deploy becomes a recap warning, and the
  retry stays the user's call.

## [2.3.0] - 2026-09-24

### Changed

- `skills/backlog`, `skills/refinement` — grounding reads a named reference
  implementation (proof of concept, sandbox) before any API is probed, and
  treats it as evidence to verify rather than a spec; it checks the touched
  files against the conventions that fire on touch (convert on touch,
  co-located tests) and measures that cost instead of estimating it; and a
  later slice is re-checked against the merged tree. Two backlog evals cover
  the first two.
- `skills/work-backlog` — an item with a criterion that can only be checked
  after merge keeps `in-progress` rather than going to `done` in the MR, and
  such an item still satisfies a dependency once its MR merged. Premises are
  re-checked against the tree before coding, and no code is written whose only
  job is producing evidence for a gate.
- `skills/mr-merged`, `skills/close-sprint` — a merge is not the delivery:
  read the item's `## Status`, match code to items rather than MRs, and check
  whether an item still marked open already sits in another item's merged
  diff.

## [2.2.0] - 2026-09-24

### Changed

- `skills/close-sprint` — a new Phase 5b clears out the sprint's working
  documents at close: the planning and refinement documents
  `skills/sprint-planning` and `skills/refinement` write, plus a project's own
  tracker, journal or spike notes under any spelling of the sprint folder.
  Until now nothing removed them — the close only added files and compaction
  only knew `docs/sprint-<N>/` — so they piled up for good. Each file is
  `consumed` (code, tests or config reference it: never removed, a permanent
  home is proposed in the gaps document), `durable` (holds a fact no BLI, ADR,
  spec or todo has: removed once it reaches that home) or `ephemeral` (removed,
  and listed with a retrieval recipe in the changelog's `## Archief`).
- `skills/compact-sprint` — also removes the sprint's gaps document, and
  sweeps working documents that a close from before Phase 5b left behind, with
  the same classification.

## [2.1.0] - 2026-09-24

### Added

- `hooks/` + `scripts/check_added_comments.py` — a `PostToolUse` hook on
  `Edit|Write` that prints a reminder when an edit adds a code comment
  carrying an MR/PR/ticket reference or wording that argues the change is
  correct. Both are classes `rules/documentation.md` already calls findings;
  what was missing was a trigger while the comment is being written, since the
  rule fires at review time and only `skills/code-review` and
  `skills/work-backlog` load it. It reads the added text only, never blocks,
  and does not measure comment volume — that same rule states no ratio of
  comment lines to code lines is a finding on its own.
- `rules/project.md` — "Harden What You Can Demonstrate": defensive code needs
  a failure you can point at, and if no test fails without the change that is
  the signal. Distinguishes this from boundary validation, which covers data
  whose shape is unknown by definition.
- `skills/code-review` — speculative hardening added as a review lens, citing
  that rule.
- `skills/payload-jobs` — audit or set up Payload's jobs queue on hosting with
  more than one instance: elect one runner (a platform cron guarded on
  `INSTANCE_NUMBER=0` for scheduled tasks, `autoRun` + `shouldAutoRun` for
  event-driven queues), close `jobs.access.run` (Payload defaults it to
  allow-all despite its JSDoc), recover runs killed mid-flight from the runner
  rather than from a task on the same queue, keep tasks idempotent, and weigh
  the poll cadence against the autoscaler. Ships the verified Payload 3.85
  internals and both reference runners. Pairs with the new "Jobs Queue" section
  in `rules/payload.md`.
- `skills/npm-maintenance/evals/evals.json` — the prior-revert check and the
  behavioural-regression procedure with positive control.
- `skills/backlog/evals/evals.json` — an untracked item from a parallel session
  is updated, not duplicated.

### Changed

- `rules/documentation.md` — new "When You Write One" section stating that the
  comment classes apply while writing, not only at review, plus the hook above
  under "Relation To Other Surfaces".

- `skills/address-review-comments` — stacked MRs now handle a squash-merged
  base without fetching its possibly deleted source branch or trusting the
  false conflicts from an ancestry-based merge preview: compare the old base
  and squash trees, then replay only the dependent commits with
  `git rebase --onto`.
- `skills/npm-maintenance` — §1 requires reading the project's own history for
  every package before proposing a bump (`git log -S` on the `package.json`
  line, `git log --grep=Revert`): a reverted bump of the same package is a hard
  stop until its reason is known. New section "Framework minors are behavioural
  changes": exact-version release-notes diff, flipped defaults between tags,
  the host's cost-sensitive metrics, request-volume measurement on a local
  production build against production, and a positive control on the known-bad
  version — a clean result without a reproduced failure proves nothing. Runtime
  step: run the package manager through the pinned Node binary
  (`…/npm-cli.js`), `--cache <scratch>` for a root-owned `~/.npm`. Validation:
  capture exit codes, not excerpts.
- `skills/backlog`, `commands/backlog.md` — the existing-item search also
  covers untracked files and a parallel session's branch or worktree; such an
  item is updated additively and left uncommitted.
- `CLAUDE.md` (Worktrees) — inside an EnterWorktree session git refuses
  `git -C <other checkout>`, so repo-level operations happen after
  `ExitWorktree`; shared-checkout hygiene (`git status`, `git worktree list`,
  `git fetch` before push, rebase-not-force after a force-push under you).
- `skills/improve-skill` — step 4 names the adapter regeneration the
  pre-commit hook performs when `commands/<name>.md` changes, so the blocked
  first commit is expected: stage the regenerated `.github/prompts/` file and
  commit again.
- `skills/maintenance` — lane F names the three jobs failures that leave no
  error anywhere (a row stuck at `processing: true` with `totalTried: 0`, a
  paused or missing heartbeat, `jobs.access.run` unset), asks for a
  single-runner check on multi-instance hosts, and hands the deep audit to
  `skills/payload-jobs`.

- `rules/project.md` (Naming & Formatting) — new "GraphQL Field Aliases":
  alias any GraphQL field whose name does not fit the codebase's conventions,
  most often an underscore-prefixed system field (`publishedAt: _publishedAt`,
  `typename: __typename`), so the foreign name stops at the query boundary
  instead of reaching transformers, typedefs, validators and fixtures.

### Fixed

- `skills/work-backlog`, `commands/work-backlog.md` — the WIP check no longer
  tells the agent to run `glab mr list --state opened`: `glab mr list` has no
  `--state` flag (glab 1.91.0 exits 1 with `Unknown flag: --state`), and open
  MRs are already its default. Every autonomous run tripped on this and had to
  retry without the flag.

## [2.0.1] - 2026-09-09

### Changed

- `scripts/project-sync-freshness.sh` — the stale/unknown SessionStart note now
  addresses the agent: offer to run the project sync (and commit the synced
  files as their own chore commit) instead of only naming the command, so a
  developer's whole job is saying yes. The hook itself still never writes into
  the project tree, and the smoke test asserts the offer wording. Because the
  script is part of the sync digest, every synced project shows one stale nudge
  after this ships — that nudge is the new offer.
- `skills/backlog`, `commands/backlog.md` — bug items get a `## Reproduction`
  section (template in `rules/backlog.md`): the shortest path that shows the
  defect, deterministic when a fixture allows it, placed before the acceptance
  criteria so the fix is checked against it and the first test is written from
  it. A fair attempt that finds no reliable path is recorded in the section,
  not dropped. Brings the local bug item in line with `skills/jira-ticket`,
  which already requires a repro path for a tracker bug.
- `skills/upstream-rules` — the committing gotchas in step 4 now cover adding a
  new `rules/<file>.md`: the validator also requires it in the `FEATURES.md`
  rules table and a `docs/pipeline-map.md` phase table, and pipeline-map's
  `docs/…` paths are link-checked against this repo, so project-relative paths
  (e.g. `docs/adr/`) fail the commit — describe project paths in words there.
- `skills/close-sprint` — new "Background runs (Claude Code)" section: when
  the background edit-guard blocks the shared checkout, don't attempt the
  `bgIsolation` opt-out from inside the session (the guard blocks that
  settings edit and the permission classifier blocks the shell fallback);
  instead run all phases in an EnterWorktree worktree, make one docs-only
  hand-off commit there, and let the user apply it with
  `git cherry-pick -n <sha>` so they still commit themselves. The
  never-`git commit` constraint now names this hand-off commit as its sole
  exception.

## [2.0.0] - 2026-09-01

### Removed

- `skills/skill-opportunity` — absorbed into `skills/improve-skill` as its
  "Deciding Whether a Skill Is Warranted" section (the 3-of-7 rubric, the
  smallest-durable-surface ladder, the skill brief). Two meta-skills answering
  "what did this session teach us" split the same lesson across two homes that
  drift, and both descriptions competed for the same trigger phrases. Same
  reasoning that removed `sprint-board` in 1.16.0: a skill description's cost
  is permanent — loaded into every session of every synced project — so
  overlapping meta-skills tax routing accuracy everywhere. All former triggers
  (`skill opportunity`, `learn from sessions`, `spot workflow patterns`,
  `should this be a skill`) now route to `skills/improve-skill`.

### Added

- Support mode for `skills/close-sprint` and `skills/compact-sprint` (and
  their runbooks): projects without sprints close a **calendar month**
  instead — delivered backlog items archive to `docs/support-<yyyy>-<mm>/`
  (e.g. `support-2026-08`; year plus zero-padded month, so folders sort
  chronologically and never collide across years), with matching changelog,
  gaps, status-line, and archive-tag conventions, a month-window tracker query
  in place of the sprint JQL, and a month-based retention guard for
  compaction. `CLAUDE.md` trigger lines route "close support month" /
  "support maand afsluiten" and "compact support months" to the same skills.
- Project-sync freshness stamp (`scripts/project-sync-freshness.sh`):
  `scripts/sync.sh --project` now writes `.claude/ai-workflows-stamp` into the
  project — a `cksum` digest of the exact source set project sync delivers
  (`rules/`, `commands/`, the shared fragments, the adapter templates, and the
  sync scripts themselves), tracked in git so drift is visible in review. A
  `SessionStart` hook shipped via `templates/project-claude-settings.json`
  compares that stamp against the plugin cache and, once per distinct
  mismatch (gated in `$CLAUDE_PLUGIN_DATA`, per project), names the exact fix:
  `bash "$CLAUDE_PLUGIN_ROOT"/scripts/sync.sh --project .`. A digest rather
  than a version for the same reason as the ambient sync: unbumped releases
  must still change the stamp. Missing stamp reports as unknown, not stale;
  the hook never writes into the project working tree, and stays fully
  offline. (`docs/backlog/feat-project-sync-freshness-stamp.md`, slice 1/2 —
  the CI-side drift check is slice 2/2.)
- `create-pr` — a recipe for splitting one working tree across several MRs:
  what to settle with the user first (stacked vs independent, pre-existing
  commits on the branch, ticket keys), the snapshot-branch technique so nothing
  is lost while shuffling branches, hand-reverting hunks for a file that spans
  two MRs, measuring each branch on its own, and a merge-the-union diff that
  proves nothing was dropped. Lives in
  `skills/create-pr/references/push-and-mr-mechanics.md`, anchored from the
  skill's pre-flight and summarised in the runbook. Born in the InnovatieRoute
  caching work: one session's changes became five MRs, two of them sharing
  files, with no guidance on how to separate them safely.
- `create-pr` — the two-step flow for an MR that needs both a file-based body
  **and** an assignee or reviewer: `glab mr create` with the username flags plus
  a placeholder description, then PUT the body from the file. Those flags take a
  username while the API POST takes numeric ids and silently drops
  `--field "assignee_ids[]=<id>"`. Also documents `--no-editor`, without which
  `glab mr create` can open an editor and hang a non-interactive session. The
  reviewer half of this existed; it now covers assignees and is stated as the
  general pattern rather than an `ai-workflows`-only workaround.
- `skills/compact-sprint` + `commands/compact-sprint.md` — compact old sprint
  documentation. Delivered BLIs mix ephemeral content (status, commits,
  how-to-test) with durable decisions; once a sprint is older than the
  previous one (retention guard — never the current or previous sprint), the
  lane flags durable content as `docs/todo/` follow-ups, rewrites the sprint
  changelog to the shared compact template, and removes the sprint folder
  behind a `sprint-<N>-bli-archive` git tag with a documented `git show`
  retrieval path. Born in RefugeeWork: five sprint folders ≈ 130 delivered
  BLIs polluting every search with stale acceptance criteria and outdated
  technical notes.
- `scripts/validate-skills.mjs` now budgets the pipeline-map's "enforced by
  nothing" policies (`ENFORCED_BY_NOTHING_BUDGET`): a new unenforced policy
  either ships its enforcement (hook, validator check, CI job) or raises the
  budget in the same MR with a tracked follow-up, and the validator warns when
  the budget can ratchet down. Honest labelling of unenforced policy only
  works while the pile cannot silently grow.
- `scripts/assign-plugin-version.mjs` assigns the plugin version after merge
  from whatever accumulated under `## [Unreleased]`, inferring MAJOR/MINOR/PATCH
  from the section headings (`--bump` / `--as` override, dry run by default).
  Skill validation now also fails when `## [Unreleased]` is missing or when the
  changelog documents a version above the manifest.
- Redundant-comment policy ("What A New Comment May Say" in
  `rules/documentation.md`): a comment added by a change must state something
  the code cannot show. Restating the adjacent code, arguing the change's
  correctness to the reviewer, file-header essays, and density that breaks the
  sibling register are findings, not style nitpicks — the justification moves
  to the MR description. Density of *existing* comments stays out of scope.
- Shared-layer placement rule ("Shared Layers Are Earned, Not Claimed" in
  `rules/project.md`, plus a Next.js DoD checkbox and review flag): files under
  `utils/`/`lib/`/`constants/` need at least two unrelated consumers —
  single-consumer helpers co-locate in the feature's module, promotion happens
  in the MR that adds the second consumer, and `utils/<feature>/` is named as
  the tell.

### Changed

- Comment-convention routing and edges: `rules/documentation.md` now loads at
  **authoring** time — `templates/project-CLAUDE.md` lists it among the focused
  rules and `rules/rules.md` trigger 15 fires on *adding* comments/JSDoc, not
  only on changing described code or reviewing. "Pointing at something that
  will not exist" explicitly exempts external references that are the durable
  fact (upstream issue, CVE, RFC); "One Home Per Fact" accepts the owning
  declaration's docblock as a valid home; `rules/testing.md` states that test
  files follow the same new-comment rules (neighbouring suites set the density
  register).
- `skills/mr-merged` now treats post-merge cleanup as one atomic worktree and
  branch batch: dirty worktrees are preserved, clean worktrees are removed
  before their local branch, squash-merged branch heads must still match the
  merged MR/PR source SHA, and completion verifies that neither stale object
  remains.
- `skills/upstream-rules` step 5 and `shared/upstream-mr.md` — the prescribed
  `glab mr create … --description "<generated body>"` cannot carry a real MR
  body, and the fragment's blanket "do not fall back to `glab api
  …/merge_requests`" sent the run to it anyway. There is no
  `--description-file` flag (`Unknown flag`), `-d` takes a string, and `-d -`
  opens an editor no agent can use — so any body with backticks or a table
  means mangling it or reaching for the command substitution and heredocs the
  autonomy rules forbid. Both surfaces now prescribe the path that works: body
  to a file, payload built by a script, `POST …/merge_requests` with `--input`
  and an explicit `Content-Type`, then `glab mr update --reviewer` as a second
  call. The `glab api` warning is narrowed to what actually breaks —
  `--field "reviewer_ids[]=<id>"` flattening the bracket into a literal JSON
  key — which two calls sidestep, since `--reviewer` takes a username and needs
  no id lookup. Creation returns `"reviewers": []`, so the skill now requires
  reading the reviewer back before reporting. Also records that GitLab
  *accepts* a review request from the MR author: on `ai-workflows` the mandated
  reviewer is usually the author, which reads as a contradiction against the
  never-assign-the-author line until someone says out loud that it is not.
- `skills/upstream-rules` step 4 gains this repo's commit mechanics: the
  pre-commit hook runs `scripts/generate-adapters.sh`, which calls `mktemp` in
  the real `TMPDIR`, so a sandboxed commit dies on `Operation not permitted`
  with **nothing committed** — check `git log -1` rather than trusting it. The
  same hook regenerates `.github/prompts/*.prompt.md` from `commands/`, and the
  adapters from `shared/`, so a first commit touching either fails on
  `Drift detected`: stage the regenerated files and commit again.
- `rules/documentation.md` gains **One Home Per Fact** and **JSDoc Attaches To
  A Declaration**, with matching review triggers in `skills/code-review`
  (step 6) and `commands/review-code.md`. The existing staleness triggers are
  all *diff-subject* based — a renamed thing still named, a changed default
  still documented — so they structurally cannot see a fact that was wrong on
  arrival in one copy of five. Three review passes over the same map component
  (`app-me-als-je-thuis-bent` !34/!35) produced the evidence: an SDK probe
  measurement sat verbatim in three files and its reasoning in five, and one
  copy claimed a story asserted a non-empty accessible name when that story
  deliberately leaves it to the a11y addon. Nothing keeps N copies in sync but
  a human remembering, and the wrong copy reads as authoritative because it
  sits next to the code. The paired finding is cheaper still: of seven stated
  contrast ratios in one module, the six asserted in a test were exact and the
  one only written in prose was out by 15%, so a measured number now either
  goes in a test or names its method. Placement is the other new trigger — a
  docblock above a props interface, or a file overview below the imports, reads
  correctly in a diff and documents nothing on hover, so it is only found by
  looking for it. Both surfaces also now say explicitly that comment **volume**
  and comment-to-code ratios are not findings: measured across eighteen files
  the ratio never once predicted whether a comment was worth keeping, and a
  threshold would only manufacture false positives against the existing
  "match your siblings' density" bullet. Adds one bullet to "What A New Comment
  May Say" for references that will not survive the MR ("raised in review of
  !34", "see the MR for the evidence"), which the existing
  justifying-the-change bullet covers in principle and demonstrably did not in
  practice.
- `commands/create-pr.md` — its GitLab body guidance now matches the skill. The
  runbook offered GitHub's `--body-file` without noting that `glab mr create`
  has no equivalent, which invites reasoning by analogy to `--description-file`
  and failing with `Unknown flag`. Both surfaces now name the absent flags
  (`--description-file`, `--body-file`, `-F`) explicitly. The skill already
  carried this warning — the runbook is the surface that gets served on
  prompt-first tools, so a divergence there costs a real round trip.
- `skills/create-pr` — the push-and-MR reference now says to read a hook's own
  output before believing its verdict. A hook step that wraps a project binary
  turns any non-zero exit into its own domain-level conclusion, so a missing
  tool and a real finding print the same headline: a pre-push migration check
  ran `payload migrate:status` through a dotenvx loader, the loader exited
  `dotenvx: not found` because the worktree had no `node_modules`, and the
  script rendered that as `Pending migrations detected` with instructions to
  generate a migration — on a commit that was one file rename with zero content
  lines changed. Acting on that headline means either generating a phantom
  migration or concluding the branch is broken. The gitignored-artifacts table
  gains the matching row, and the bypass guidance now asks for evidence in the
  hand-off (`git show --numstat` showing a rename, not the assertion "it is
  only docs").
- `skills/close-sprint` / `commands/close-sprint.md` — Phase 3 now writes the
  sprint changelog from an explicit compact template (new "Changelog template"
  section in the runbook, shared with `compact-sprint`) instead of "mirror the
  structure of sprint-1's changelog": one functional sentence per delivered
  row, deviations and accountability as bullets outside the tables, ticketless
  rows self-contained, target size under 15 KB. RefugeeWork's sprint-5
  changelog had grown to 60 KB because BLI and tracker content leaked into
  table cells.
- `skills/code-review` now reviews workflow-asset MRs (skills, commands,
  rules, hooks) through an explicit **Value & Maturity** lens, reported as an
  eighth output section: frequency × cost of the failure addressed, platform
  overlap, prevention vs recovery, ambient-context cost and trigger overlap,
  measurability, personal vs team surface, and reproducibility of the
  observation behind a new hard rule — grounded in current frontrunner
  practice (searched, not recalled). Prose that instructs agents is product
  code; the lens catches skill sprawl and platform-workaround patterns at
  review time instead of after they accrete.
- Content MRs no longer bump `.claude-plugin/plugin.json`; they describe the
  change under `## [Unreleased]` and the number is assigned in a separate
  release MR. Bumping inside a content MR made every concurrent MR edit the same
  manifest line at the same changelog position: on 2026-08-05 three open MRs
  claimed 1.19.0 at once, so whichever merged second conflicted and carried a
  version already on `main`.
- Verification is evidence, not claims — the Anthropic verification-loop
  discipline applied to the two remaining report seams:
  - `skills/run-checks` — the closing table names the exact commit verified
    and quotes the tail of each check's real output; a sweep that ran before
    later edits verified nothing.
  - `skills/address-review-comments` — the closing report shows, per
    comment, the change (`file:line`) plus the command and output tail that
    prove it on the pushed commit; wording-only fixes say so instead of
    borrowing the suite's green.
  (`skills/work-backlog` already got this in 1.8.0 via its evidence-based
  `How to verify`; `skills/create-pr` in 1.11.1 via the exact-commit hook
  rule.)
- `skills/code-review` executes the two new rules: step 6 flags reviewer-facing
  added comments, step 5 checks new shared-layer files for a second consumer,
  and the constraints section names both as substantive rather than style. The
  `commands/review-code.md` fallback mirrors both checks.
- `skills/work-backlog` step 7 (self-review) now names both classes as
  author-side fixes before the MR opens: strip reviewer-facing comments (the
  justification goes in the MR description) and move single-consumer
  `utils/`/`lib/`/`constants/` files into the feature module.
- The bundled PR/MR template (`templates/pull_request_template.md`) gained the
  sections `skills/work-backlog` requires but had no home for — `## How to
  verify` (absorbing `## Testing`), `## Backlog`, and `## Scope` — and both
  skills now pin that contract: work-backlog step 9 fills the resolved
  template's sections instead of stating free-form content requirements, and
  create-pr step 5 keeps the template's headings as the skeleton even when
  another skill layers description requirements on top. Root cause of agent
  MRs shipping with invented headings (observed on postergenerator-starter
  !15): the two contracts could not both be satisfied, so agents free-formed.
- `skills/create-pr` step 7 now reads the created PR/MR back (`glab mr view` /
  `gh pr view`) before reporting and repairs what the platform didn't store:
  the `ai:agent-authored` provenance label, the template's headings, the
  policy reviewer. The same !15 shipped with zero labels despite the label
  being mandated — a create-time instruction is not evidence; a read-back is.
  The recap gains a "Template followed" row. The `commands/create-pr.md` and
  `commands/work-backlog.md` fallbacks mirror all of the above, including the
  provenance label their create calls never carried.

### Fixed

- The changelog's own header still instructed bumping `version` in the same
  MR, contradicting the post-merge assignment flow adopted above; it now
  describes the `[Unreleased]` flow.
- The changelog-entry check matched a version anywhere in the file, so prose
  mentioning `## [1.2.3]` in backticks satisfied it and a missing release
  heading passed. Both it and the new `## [Unreleased]` check now match headings
  at line start only.

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
