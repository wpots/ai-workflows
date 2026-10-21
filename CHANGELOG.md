# Changelog

Release notes for the `greenberry` plugin — everything the plugin ships from
this repo: `skills/`, `commands/`, the `.claude-plugin/` manifests, `hooks/`
plus the scripts they run, and the ambient layer those hooks deliver
(`CLAUDE.md` and the universal `rules/` subset).

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions are
plain semver. Describe a change that alters what the plugin ships **in the same
MR**, as a fragment `changelog.d/<section>.<slug>.md` — not here, and without
touching the `version` in `.claude-plugin/plugin.json`. The release is cut
after merge by the `release_train` CI job via `scripts/assign-plugin-version.mjs`,
which assembles the fragments (and anything still under `## [Unreleased]`) into
the version section. See "Ship a plugin release" in `docs/contributing.md`.
Repo-internal changes (`README.md`, `docs/`, CI) don't get an entry.

## [Unreleased]

## [2.11.0] - 2026-10-21

### Action required

- Working in a project that checks in a `.jira.yml`: add
  `export JIRA_LOGIN=<Atlassian email>` to your shell profile once. The file
  carries no login, and without it every `jira` command fails with "The tool
  needs a Jira API token".
  <!-- slack: Project met `.jira.yml`? Zet eenmalig `export JIRA_LOGIN=<email>` in je shell profile -->

### Added

- `skills/service-cli`: a project on another Jira key or board than the
  machine default checks its `jira` config in as `.jira.yml` (the
  `jira init -c .jira.yml` output minus `login`); every command passes
  `-c .jira.yml` after the subcommand so allowlist prefixes still match, and
  the login comes from `JIRA_LOGIN`. Replaces the "own config via
  `JIRA_CONFIG_FILE`" advice; `jira-ticket`, `setup-ai-workflows` and the
  machine setup follow it.
  <!-- slack: Jira-config per project in de repo als `.jira.yml`, met `-c .jira.yml` en `JIRA_LOGIN` -->

### Changed

- `skills/create-pr` writes the MR description for the reviewer only: what the
  change does, why, and what to check, in plain sentences that one read is
  enough for. No links to Notion pages, Google Docs or Slack messages, no "as
  discussed" and no colleagues' names; when a change answers someone's
  question, the description states the question or reason itself. The same
  goes for the title and the commit messages, and the bundled MR template says
  so too.
  <!-- slack: create-pr | MR-beschrijving bevat alleen wat de reviewer nodig heeft: geen Notion-, Docs- of Slack-links, geen namen -->
- Release cadence is enforced: the release MR opens as a draft and a Monday
  07:00 pipeline schedule (`release_ready`) marks it ready and requests
  review, so a week of merges ships as one version and one post. A fix
  someone is waiting on: mark the MR ready by hand and merge. Scheduled
  pipelines skip the other release jobs.
  <!-- slack: Releases | Release-MR blijft draft tot maandagochtend; daarna één versie en één post per week -->
- `release-notes`: the notes get an Onderhoud section (Maintenance in English)
  for upkeep nobody requested or reported: framework and dependency updates,
  security patches, cleanups. A fixed line under the heading says it is not a
  ticket and not a bug, so customers stop asking which ticket a line belongs
  to. `release` puts those items last in the live mail, and the Copilot prompt
  is regenerated from the runbook.
  <!-- slack: Klantnotes en live-mail krijgen een sectie Onderhoud voor werk zonder ticket of bug -->
- `skills/run-checks` now runs what CI runs. In a project that includes the
  CI v4 component `node-npm` or `node-pnpm` from `ci-components`, it runs
  exactly the names in that include's `scripts` input, in order, or the
  default `lint:check`, `type-check`, `test`. It reports
  `CI parity: exact (ci-components <version>)` and the names `package.json`
  lacks before it runs anything.
  Projects on `config/ci` keep the convention sweep, now labelled
  `CI parity: approximate (config/ci <ref>)`.
  Either way, the summary lists drift against `.husky/pre-push` (CI v4 only)
  and the project's own CI jobs as `project job, not covered`.
  `skills/run-checks/scripts/ci-parity.mjs` reads `.gitlab-ci.yml`. It never
  runs a job or anything from a job's `before_script`.
  <!-- slack: run-checks | draait in een CI v4-project precies de scripts van de verify-job en meldt de CI-pariteit -->
- `skills/watch-mrs` can act on new review comments instead of only relaying
  them (asked once per invocation, or settled by the user's memory): it
  evaluates them with `receiving-code-review`, applies the ones without a
  crucial decision through `address-review-comments`, puts a 👍 on each comment
  it picks up and posts `replied` / `pushed changes` in the MR's Slack thread. A
  crucial decision goes to the user as that one question.
- `skills/watch-mrs` pauses at night: between 23:00 and 06:00, after two
  polls without an event, it stops polling until 06:00, with the quiet count
  kept in a state file so a re-armed Monitor keeps it.
- `skills/watch-mrs` can post an MR in a Slack channel once it is ready apart
  from approvals: a reply in the MR's existing thread, else a new message,
  once per head SHA.
- `skills/receiving-code-review`: feedback that changes a template MR's
  approach is traced to the projects that ported the change or plan to.

### Fixed

- MRs opened outside `skills/create-pr` now carry the `ai:agent-authored`
  provenance label as well. The upstream MR rule names it for both routes,
  `glab mr create` and the `--input` JSON, and its read-back confirms the label
  and adds it when it is missing. The MR recipes in `upstream-rules`,
  `upstream-to-unicore` and `service-cli` set it too. Before this fix, 17 of 53
  MRs on `ai-workflows` went without the label, so `delivery-metrics` counted
  too little agent work.
- `scripts/validate-skills.mjs` now also checks `shared/`, fenced
  `glab mr create` snippets and `-X POST` MR creation, and `--input` payloads
  that never set the label.
- `create-pr`: a commit or push hook that fails with `Operation not permitted`
  in a sandboxed shell is re-run with the sandbox bypass, never with
  `--no-verify`, and a bypass prompt that is denied or closes unanswered ends in
  a status report (branch, staged, not committed) instead of a silent stop.
- `skills/create-pr` no longer tells the agent to add `--no-verify` to every
  push from a git worktree. A push keeps its hooks on, and `--no-verify` is
  allowed only for the two cases `references/worktrees.md` names: a hook that
  cannot execute in the worktree, and a hook whose git-calling tests do not
  drop `GIT_*`. Even then, the agent first runs that hook's commands by hand.
  This makes the push step agree with the sandbox rule above it, which says to
  re-run a blocked hook with the bypass, never with `--no-verify`.
- `skills/watch-mrs` no longer claims `.detailed_merge_status` covers
  conflicts: it names only the first failing check, and `not_approved` comes
  first, so the watcher tracks `.has_conflicts` on its own.
- `skills/watch-mrs` marks an MR's first pass with its own `initialized` file:
  deriving it from the merge-status file kept an MR stuck on `unchecked` in
  first-pass mode, which marked its new comments as seen without reporting
  them.
- `skills/watch-mrs` says how to tell a sleeping laptop from a hung call
  (`pmset -g log`), and that a `glab` timeout needs SIGKILL, since the Go
  binary ignores SIGALRM.
- `watch-mrs`: the watcher keeps its state in `~/.worktrees/.mr-watch/`
  instead of `~/.claude/state`, which a sandbox never lets a `Monitor` write.
  `~/.worktrees` is already writable for the worktree flow and survives a
  reboot. `/tmp/claude/mr-watch/` stays as the fallback, and the skill now
  says it loses comments that arrive across a reboot.
  <!-- slack: watch-mrs | state staat nu in ~/.worktrees/.mr-watch, overleeft ook een reboot -->

## [2.10.2] - 2026-10-20

### Fixed

- `skills/create-pr/references/worktrees.md` now covers a worktree without the
  hook manager's generated directory (`.husky/_`): with a relative
  `core.hooksPath` git then runs no hooks, with no warning. It says how to
  check, that copying the directory from the main checkout makes the hooks
  run, and to read the hooks first: a hook whose tests shell out to git
  without dropping `GIT_*` is run by hand and skipped with `--no-verify`,
  especially on a push with the sandbox bypass. After a failed git-calling
  test in a hook, `core.bare` and `git status` come first; the recovery adds
  the sandbox bypass and restoring a fixture-overwritten tracked file.

## [2.10.1] - 2026-10-20

### Fixed

- `skills/create-pr/references/worktrees.md` drops the hook's `GIT_*`
  variables with `Reflect.deleteProperty`, because `delete process.env[key]`
  fails `@typescript-eslint/no-dynamic-delete` in projects on
  `@greenberry/linting-config`. For Jest it now says to build an explicit
  `env` as a `{ ...process.env }` copy: a `Object.fromEntries(…)` filter fails
  the type check in a Next project, where `NODE_ENV` is required on
  `ProcessEnv`.

## [2.10.0] - 2026-10-20

### Action required

- In a pnpm project whose `.claude/settings.json` already exists, add
  `"Bash(pnpm run *)"`, `"Bash(pnpm test *)"`, `"Bash(pnpm exec *)"` and
  `"Bash(pnpm install --frozen-lockfile*)"` to `permissions.allow`. The sync
  never overwrites an existing settings file, so only new projects get the
  rules from the template.
  <!-- slack: .claude/settings.json | zet de vier pnpm-regels onder permissions.allow als je pnpm-project al een settings.json heeft -->

### Added

- The plugin asks before every Jira status change. A PreToolUse hook
  (`scripts/require_ticket_transition_approval.py`) puts up a permission
  prompt for `jira issue move` (also `transition` and `mv`) and for a
  connector `transitionJiraIssue`, even where `Bash(jira *)` is allowed; a
  headless run is denied. This enforces `skills/service-cli` § Ticket status
  in every project with the plugin, so the manual `permissions.ask` edit per
  project is no longer needed.
  <!-- slack: Jira-status | de plugin vraagt nu altijd om een go voordat een ticket van status wisselt -->

### Changed

- pnpm projects run without permission prompts.
  `templates/project-claude-settings.json` allows `pnpm run`, `pnpm test`,
  `pnpm exec` and `pnpm install --frozen-lockfile`, next to the npm rules.
  `pnpm dlx` and a bare `pnpm *` stay off the list: `add`, `remove`, `update`
  and `publish` keep asking. `CLAUDE.md` and `skills/run-checks` take the
  package manager from the lockfile and spell its commands out in full
  (`pnpm run lint`, not `pnpm lint`), because the shorthand matches no allow
  rule. `commands/new-device-setup` checks for pnpm, which unicore-template v4
  and every project created from it use.
  <!-- slack: pnpm | pnpm run/test/exec staan in de project-allowlist; agents schrijven `pnpm run <script>` voluit -->

## [2.9.8] - 2026-10-20

### Action required

- In a Next.js 16.4+ project, add `agentRules: false` to `next.config.ts` and
  remove the block between `<!-- BEGIN:nextjs-agent-rules -->` and
  `<!-- END:nextjs-agent-rules -->` from `AGENTS.md` if it is there.
  unicore-template sets the option for new projects.
  <!-- slack: next.config.ts | zet `agentRules: false` en haal het nextjs-agent-rules blok uit AGENTS.md -->

### Changed

- `rules/stacks/nextjs-payload.md` sends agents to the docs that ship with the
  installed Next.js (`node_modules/next/dist/docs/`, Next 16.4 and later) for
  an API they are not sure of, and asks projects to set `agentRules: false` in
  `next.config.ts`, so `next dev` started by an agent no longer writes its own
  `nextjs-agent-rules` block into the synced `AGENTS.md`. Reviews flag that
  block.
  <!-- slack: Next.js stack rule | agents lezen de Next-docs uit node_modules; `agentRules: false` houdt AGENTS.md schoon -->

## [2.9.7] - 2026-10-20

### Changed

- `skills/watch-mrs` no longer reports GitLab's `unchecked`/`checking`
  merge-status recomputes, which fired for every watched MR each time the
  target branch moved. It also reports a reviewer's `requested_changes` that
  outlives its resolved thread as the remaining merge blocker, and notes that
  a running watcher script must be stopped before it is edited and that macOS
  bash 3.2 has no `mapfile`.
  <!-- slack: watch-mrs | geen ruis meer als de target-branch verschuift; meldt blijvende "requested changes" -->

### Fixed

- `start-project`: Deleting the MRs a new project copied from the template
  before its first own MR does give the number back. On trimbos-website the
  first own MR got `!1` after the copied `!1` was deleted. Lane 0 and row 3a no
  longer say the number is lost. Row 3a now proposes deleting the copies while
  the project has no own MR yet.
- `create-pr` worktrees reference: Under Jest, deleting the `GIT_*`
  variables at the top of a test file does not protect the real repository.
  Jest gives each test file its own copy of `process.env`, and child processes
  get the real environment. The reference now says to drop them in a
  `globalSetup` or to pass an explicit `env`, as the-greenhouse/unicore-template
  !85 does. It also notes that a linked worktree passes an absolute `GIT_DIR`
  to the pre-push, which is why the damage tends to appear only from a worktree.
  <!-- slack: create-pr | Jest-tests met git: haal GIT_* weg in een globalSetup, niet bovenaan het testbestand -->

## [2.9.6] - 2026-10-20

### Action required

- In a project whose `.claude/settings.json` allows `Bash(jira *)`, add
  `"Bash(jira issue move *)"` to `permissions.ask`. The sync never overwrites
  an existing settings file, so only new projects get the rule from the
  template.
  <!-- slack: .claude/settings.json | zet "Bash(jira issue move *)" onder permissions.ask als je project Bash(jira *) toestaat -->

### Changed

- No skill changes a Jira ticket's status on its own any more. Jira's
  automation moves tickets from the pipeline, and a transition runs only on
  the user's go per ticket (`skills/service-cli` § Ticket status).
  `skills/release` sets versions or labels and reads the status back instead
  of moving shipped tickets to Done; asked to move them, it lists them with
  their current status and waits for a go on that list. `skills/mr-merged`
  reads the ticket status back and no longer proposes a transition. A
  critical ticket created after its MR merged (`npm-maintenance`,
  `dependency-hotfix`) is reported, not moved.
  `templates/project-claude-settings.json` puts `Bash(jira issue move *)`
  under `ask`, so the `Bash(jira *)` allow rule no longer lets a transition
  through without a prompt.
  <!-- slack: Jira-status | skills zetten geen tickets meer door; dat doet de pipeline of jij, met een go per ticket -->

## [2.9.5] - 2026-10-20

### Changed

- Release announcements: `announce_release` posts in the dedicated Slack
  channel `#ai-workflows` instead of `#development`, which was getting several
  release posts a week. The channel is set by the `SLACK_WEBHOOK_URL` CI/CD
  variable; the docs, the `upstream-rules` skill and the script messages now
  name the new channel, and `keep-current.md` tells developers to join it.
  <!-- slack: Release-posts | Staan voortaan hier in #ai-workflows in plaats van in #development -->
- `start-project`: Lane 0 now checks the template for MRs and issues before
  Create from template. GitLab Import/Export copies them into the new project
  and advances its MR counter, which is how one project's first real MR became
  `!50`. A new row, 3a, reports MRs and issues that were already copied into an
  existing project.
  <!-- slack: start-project | Checkt vóór Create from template dat de template 0 MR's/issues heeft, zodat je eerste MR !1 is -->
- `upstream-to-unicore`: The lineage note now says what
  `project-templates/unicore-template` actually supplies: only the GitLab
  settings. The code is a clone of `the-greenhouse/unicore-template`, so
  `.unicore.json` always names a commit there. The note also forbids code
  maintenance, MRs and issues in the copy.
- `upstream-to-unicore`: A harvest no longer drops a change as
  project-specific only because the template lacks what it depends on (a
  `next.config.ts` flag, the Payload API path, a dependency): it asks first
  whether that is the team's direction, and if so upstreams the missing piece
  with the changes that depend on it. Step 5 adds the checks that caught what
  CI misses: `check-presets.js lint:check type-check test`, and a `next build`
  plus requests on a generated project for changes to `next.config.ts`,
  layouts, route handlers and segment config. The hook list matches the
  template's current hooks (gitleaks, `scripts/husky/index.js`, the per-preset
  pre-push), a worktree with its own `pnpm install` runs them, the push goes
  from the worktree, and the clone is fetched with `--prune`.
  <!-- slack: upstream-to-unicore | Vraagt eerst of iets teamrichting is, en bouwt de template bij config- en routewijzigingen -->
- Release cadence: the release MR merges once a week, on Monday morning, so a
  week of merges ships as one version with one post. A fix someone is waiting
  on still goes out the same day. `docs/contributing.md` and the release MR
  body say so.
  <!-- slack: Releases | Eén keer per week, op maandagochtend; een fix waar je op wacht komt direct -->

### Fixed

- `watch-mrs`: under a Claude Code sandbox, the watcher keeps its state in
  `/tmp/claude/mr-watch/` when `~/.claude/state` is not writable. A `Monitor`
  command has no sandbox bypass, so the prescribed path failed with
  `Operation not permitted`. The Monitor also declares `gitlab.com` in
  `allowed_domains`, so `glab` reaches the API without a bypass.
  <!-- slack: watch-mrs | Werkt nu ook in de sandbox: state in /tmp/claude/mr-watch en gitlab.com in allowed_domains -->

## [2.9.4] - 2026-10-19

### Changed

- `work-backlog`: Checks that only run in CI are verified on the MR
  pipeline. The run opens the MR as a draft, with the close-out already
  pushed, and blocks in the foreground until the pipeline on the final head
  finishes. It marks the MR ready only when that pipeline is green, and never
  hands back while a pipeline runs, because a background wait dies with a
  subagent's run. A one-off transient job failure gets one `glab ci retry`, not
  retry code. A criterion left unticked in the MR keeps the item
  `in-progress`. A `draft` field is ignored when the MR is created through the
  API, so the title carries the `Draft: ` prefix instead. An MR that reports
  `need_rebase` on a fast-forward project is rebased server-side. Two new eval
  cases cover the done-status and the pipeline wait.
- `watch-mrs`: Where `Monitor` has no `persistent` option, it expires after 30
  minutes and is re-armed. A single event is watched with a background script
  that exits on it.
- `service-cli`: The glab reference names the harmless `operation not
  permitted` config-write warning that glab prints inside the sandbox.
- Ambient `CLAUDE.md`: `git push -u` fails on recording the upstream inside
  the sandbox; push without `-u`.

## [2.9.3] - 2026-10-16

### Changed

- `upstream-to-unicore`: v4 replaced v3 on the template's `development`
  (unicore-template!77), so `development` is the target and v3 is the frozen
  tag `v3.0.0`. A v3 project's base is estimated against that tag instead of
  `development`, and Step 5 says the template's hooks do not run in the
  worktree and names the per-preset type-check to run by hand.

### Fixed

- `upstream-to-unicore`: Step 5 names the hook checks to run by hand in the
  template worktree (`lint` and `lint:styles` with their fixes, the preset
  type-check, `test` from pre-push) and says to skip
  `scripts/husky/index.js`, whose clean-history and README checks fail
  inside the template itself.
- `upstream-to-unicore`: the base estimate for a v3 project also looks at the
  CMS variant branches `development-payloadcms` and `development-prepr`, next
  to the tag `v3.0.0`, and names the ref the base came from. A Payload project
  started from its variant branch, whose commits are not on the tag, so the
  estimate against the tag alone picked the wrong base.

## [2.9.2] - 2026-10-16

### Changed

- `improve-skill` says how to watch a skill edit fail and pass before merge:
  run the situation with `claude -p "<prompt>" --plugin-dir <checkout>` on the
  base and on the branch, since the checkout's plugin loads over the installed
  one. Skill body only: no description, routing or digest change.

## [2.9.1] - 2026-10-15

### Changed

- `watch-mrs`: on a failed pipeline it no longer offers a `pipeline-triage`
  skill that was never built. It now offers two next steps: reproduce the
  failure locally with `run-checks`, or use **Fix pipeline with Duo** on the
  failing pipeline.

### Fixed

- `greenberry:<skill>` loads the skill again for the 14 skills that also have a
  runbook in `commands/` (backlog, create-pr, work-backlog, sprint-planning,
  refinement, close-sprint and eight more). Claude Code registered every runbook
  as a plugin command, and a command named like a skill shadowed it: the Skill
  tool handed out the fallback runbook instead of `SKILL.md`, so whatever only
  the skill says never loaded. The plugin now registers only the runbooks no
  skill covers (`new-device-setup`, `safe-kill-port`); `/greenberry:review-code`
  is gone, `/greenberry:code-review` is the skill. `validate-skills.mjs` errors
  when a registered command shares a skill's name.
  <!-- slack: Skills zoals backlog, create-pr en work-backlog laden weer hun eigen instructies in plaats van de fallback-runbook -->

## [2.9.0] - 2026-10-13

### Added

- `backlog` gains a ready check: asked whether an item or a sprint's items are
  ready, it holds them against the new Definition of Ready in
  `rules/backlog.md`, puts open product questions to the developer one at a
  time, and writes a `Blocked on:` and `Next step:` line on every item that is
  not ready. It proposes the rest; the developer confirms the flip to `ready`,
  the gate after which `work-backlog` may build unattended. Description change;
  `backlog` has no routing cases.

## [2.8.0] - 2026-10-13

### Added

- `skills/create-pr` (and its fallback `commands/create-pr.md`) gets a routing-eval
  step in the pre-flight, next to the migration check. When the repository has
  routing eval cases and the branch adds a skill, changes a skill's `name`,
  `description` or `when_to_use`, or changes a routing case, the suite runs
  before the first push and the MR description carries one result line
  (`Routing evals: 10/10 pass ($1.81, 2026-10-13)`). A failing case stops the MR
  until it passes or the user accepts it; a run that cannot happen says
  `not run — <reason>` instead of a pass. The trigger test, the command and the
  result lines live in `evals/README.md` ("Before a skill MR"); the upstream MR
  rule (`skills/upstream-rules/references/upstream-mr.md`, which
  `skills/improve-skill` reads) points at the same section. In every other
  repository the step does nothing.

### Changed

- One project adapter for every agent: the `AGENTS.md` that sync and
  `setup-ai-workflows` write now carries the full adapter, including the
  mandatory load triggers and the `rules/project.md` line that only the Claude
  copy had, and the project `CLAUDE.md` shrinks to an `@AGENTS.md` import plus
  the Claude-specific lines. Claude Code reads a `CLAUDE.md` in place of an
  `AGENTS.md`, so the import gives Claude the same instructions as Codex
  without loading them twice. The six-row skill table in `AGENTS.md` is gone:
  each skill's description carries its triggers. The validator now requires
  the import and keeps shared fragments out of the `CLAUDE.md` template.
  The project `CLAUDE.md` also imports `CONVENTIONS.md`, so Claude has the
  project's conventions from the start of every session instead of only
  when it decides to open the file; Codex keeps the instruction in words,
  because it does not expand imports.
  Synced projects pick this up with their next sync.
- `backlog` checks that an item's acceptance criteria can all hold before the
  item is marked `ready`: it runs criteria that search the tree and names the
  hits that stay, and reads criteria against each other and `Out of Scope`. An
  item that fails the check stays `draft`. Skill body only: no description,
  routing or digest change.
- `skills/work-backlog` — a `Depends on:` link whose file is gone from
  `docs/backlog/` on the default branch counts as satisfied when an archive
  step took it: `skills/close-sprint` moving it into a sprint or support
  folder, or a release cut removing it. The commit that took it is the
  evidence; a link to a file that never existed stays unmet. Before, such a
  dependency had no `Status` to read, so its dependents were never eligible.
- `setup-ai-workflows` now detects the project's language (TypeScript,
  JavaScript only, or mixed) and asks for every deviation from the global
  rules whether it is **accepted** (the project stays this way) or
  **migrating** (a target, a rule for new code, and how existing code follows).
  `CONVENTIONS.md` records that status on each deviation line, so an agent in a
  JavaScript project moving to TypeScript writes new files in TypeScript
  instead of copying the files next to it. The rationale stays in the decision
  log of `docs/architecture.md` when that exists.
- `setup-ai-workflows` also writes `.claude/settings.json` from the project
  template when the project has none, as `sync.sh --project` already did, so a
  project set up through the skill gives teammates the plugin install prompt
  too.
- The setup docs no longer say a local clone is needed to set up a project:
  on Claude Code the skills read the templates from the plugin. The clone is
  for Codex, the `sync.sh --project` script and changes to the shared config.
- `skills/create-pr` — the worktree reference names the git state every session
  shares: base a worktree on `<remote>/<base>` with `--no-track`, never on
  `FETCH_HEAD`, and drop a stash only after checking it is yours. A test that
  creates a git repo first drops the `GIT_*` variables a hook exports, since a
  pre-commit run that inherited them set `core.bare=true` in the shared config;
  `validate-skills.mjs` errors on a `scripts/` test that does not. The
  stacked-MR recipe adds the rebase and full re-check once the lower MR merges.
  <!-- slack: Worktree vanaf `gitlab/main` in plaats van `FETCH_HEAD`; na merge van een gestapelde MR rebasen en hertesten -->
- `templates/project-ai-workflows.md`, the `AI-WORKFLOWS.md` every synced project
  gets, now says Cursor is not used by the Greenberry team and its adapters are
  still generated but get no further work; the Claude, Codex and Copilot rows are
  unchanged. The template is part of the project-sync freshness digest, so each
  synced project is reported stale once, with the usual note naming
  `sync.sh --project`, until its next re-sync.
- `docs/org-managed-plugin-settings.md` — the org-managed settings now only
  register the `ai-workflows` marketplace with auto-update for every teammate;
  the `greenberry` plugin is no longer force-enabled (no `enabledPlugins`), so
  it stays enabled per project by the synced `.claude/settings.json` and a
  teammate can still disable it. Force-enabling moves to a "Later" section with
  the conditions for revisiting it. The `new-device-setup` runbook and
  `docs/setup-machine.md` follow: with the managed marketplace in place, run
  `/plugin install greenberry@ai-workflows` and skip the auto-update step.
- The plugin's `SessionStart` sync no longer writes `~/.claude/CLAUDE.md`: the
  baseline (this repo's `CLAUDE.md`) now lands as
  `~/.claude/rules/ai-workflows.md`, next to the universal rules, so
  `~/.claude/CLAUDE.md` stays the developer's own. A copy an earlier version
  wrote there is handled once: removed when nobody edited it, otherwise moved to
  `~/.claude/CLAUDE.md.ai-workflows-backup`, and the session says which. A file
  without the baseline's opening line is never touched. `./scripts/sync.sh`
  behaves the same, and the docs, `improve-skill` and the smoke tests follow.
- The `#development` release post is Block Kit now: an overview of what to do,
  the update steps, a "Projecten syncen" block with the commands only when the
  release changed a file a project sync delivers, an "Eenmalig" block, and one
  table of the changes. A changelog entry gets a table row through a Dutch
  `<!-- slack: … -->` continuation line under its bullet; entries without one
  are counted under the table. `skills/upstream-rules` asks for that note when
  it writes a fragment, and `validate-skills.mjs` errors on a note that is not
  indented under its bullet.
  <!-- slack: release-post | Releasepost met kopjes en een tabel; sync-instructies alleen als je projecten moet syncen -->
- New fragment type `changelog.d/action.<slug>.md` for a step developers take
  once after updating. It lands under `### Action required` and in the post's
  "Eenmalig" block, and does not bump the version on its own.
  <!-- slack: changelog | Nieuw fragmenttype `action` voor eenmalige stappen na een update -->
- Project sync and `setup-ai-workflows` stop generating Cursor files: no more
  `.cursor/rules/conventions.mdc`, `.cursor/rules/graphify.mdc` or
  `.cursor/mcp.json`, and the global `sync.sh` no longer copies commands and
  skills into `~/.cursor`. Files an earlier sync left in a project's `.cursor/` or
  in `~/.cursor/` stay where they are; delete them by hand if you want them gone.
  The shared rules, commands and project guide no longer name Cursor, so each
  synced project is reported stale once, with the usual note naming
  `sync.sh --project`, until its next re-sync.
- Eight skills (`close-sprint`, `compact-sprint`, `refinement`, `release-notes`,
  `sprint-demo`, `sprint-planning`, `improve-skill` and `service-cli`) no longer
  name Cursor among the tools they are shared with. Wording only: no behaviour
  or routing change, and synced projects are not reported stale.
- `skills/upstream-to-unicore` targets the template's release lines instead of
  the archived `experimental-new-setup`: v4 (`feat/declarative-cms-presets`)
  or v3 (`development`), chosen per change with the user until the team
  decides how the lines relate, and CMS code goes to `src/vendor/<cms>/` on
  v4. It reads the target line's conventions (package
  manager, env wrapper, agent instructions) at run time instead of carrying a
  hardcoded dotenvx recipe, finds the project's base from `.unicore.json` (v4)
  or estimates it (v3), and adds a harvest mode that lists the template-owned
  changes a project made since that base. Every run starts with the open
  template MR queue and ends by offering `skills/watch-mrs`, because the
  finish line is a merged MR.
- `skills/mr-merged` and `skills/close-sprint` propose that harvest when a
  merged MR or a sprint touched template-owned files, so upstreaming no longer
  waits for someone to ask; `skills/start-project` checks a project's template
  lineage through `.unicore.json` rather than a merge-base the template's own
  hook makes impossible.

## [2.7.0] - 2026-10-12

### Added

- A `Stop` hook (`scripts/improve_skill_retrospective.py`, registered in
  `hooks/hooks.json`) that turns the "run `improve-skill` after a run that needed
  intervention" rule into a prompt. After a Greenberry skill ran and the user
  stepped in — an interrupt, an explicit tool rejection, or typing right after a
  failed tool call that was the run's latest outcome — it blocks the stop once
  per session and asks Claude to offer the retrospective. It never runs
  `improve-skill` or edits a skill. It reads the transcript by entry structure,
  so notes that quote those phrases do not trigger it, and fails open on any
  error.
- `docs/org-managed-plugin-settings.md`: step-by-step for the Teams Owner to
  register the `ai-workflows` marketplace and force-enable
  `greenberry@ai-workflows` for every teammate through server-managed settings
  on claude.ai, with the JSON to paste, verification, rollback, and
  `strictKnownMarketplaces` as a separate opt-in. The `new-device-setup` runbook
  and `docs/setup-machine.md` now check for the org-managed plugin first and keep
  the manual marketplace install as the fallback.
- `scripts/validate-skills.mjs` reads a nested `metadata:` map in skill
  frontmatter (the Agent Skills string-to-string map that Claude Code and Codex
  load without acting on) instead of folding its lines into one string, and
  accepts `metadata` as a known key. A skill without `metadata.owner` gets a
  warning for now.

### Changed

- `CLAUDE.md` — the `## Command Mapping` block keeps only the two commands that
  have no skill (`safe-kill-port`, `new-device-setup`); the 15 rows a skill row
  already routes as its fallback are gone from the ambient layer (1.6 KB).
  `AGENTS.md` and the Copilot adapter keep the full command block.
- `shared/skill-mappings.md` — `sustainable-review` gains `performance review`,
  the one trigger that only its command row carried.
- `scripts/validate-skills.mjs` — a covered command row's triggers must all be in
  its skill row, an uncovered one must be in `CLAUDE.md` verbatim, and
  `CLAUDE.md` may not route a covered command in a command row.
- `skills/improve-skill` — new trigger phrases go into the shared fragments, no
  longer into "the `## Command Mapping` section of `CLAUDE.md`".
- `CLAUDE.md` — the 4 KB "Shared Workflow Assets Land via MR" rule leaves the
  ambient layer that loads in every session of every project; a four-line
  pointer stays. The full rule now loads where it applies: inside
  `ai-workflows` from the repo-only `.claude/rules/upstream-mr.md` (never
  synced to `~/.claude/`), for Codex from `AGENTS.md` as before, and for the
  upstream skills from `skills/upstream-rules/references/upstream-mr.md`. Both
  new copies are generated from `shared/upstream-mr.md`.
- `skills/upstream-rules`, `skills/upstream-to-unicore`, `skills/improve-skill`
  — read that reference before they branch.
- `scripts/validate-skills.mjs` — fails when `CLAUDE.md` carries the
  `upstream-mr` fragment again, or when the repo-only rule, the skill reference
  or `AGENTS.md` loses it.
- `CLAUDE.md` — the "Worktrees: cheap by default" section (3 KB) leaves the
  ambient layer. A four-line pointer keeps the non-negotiables in every
  session: root `~/.worktrees/<repo>-<slug>` and never inside the repo, a
  symlinked `node_modules` by default, `git worktree remove --force` right after
  the push.
- `skills/create-pr` — the full worktree rules now live in one reference,
  `references/worktrees.md`: the `CLAUDE.md` section merged with the worktree
  caveat that `references/push-and-mr-mechanics.md` carried (that file now
  points at it). `address-review-comments`, `dependency-hotfix`, `wcag-audit`
  and `start-project` point at it instead of at `CLAUDE.md`.
- `scripts/validate-skills.mjs` — a repo path that `CLAUDE.md` points at must
  be a tracked file, so a renamed reference cannot drop a moved rule silently.
- Browser verification now chooses tools by purpose: available native
  browser control for one-off UI checks, existing browser MCP as fallback,
  and the project test runner for reusable regression and CI. The policy
  lives in `rules/testing.md`; project adapters, the Copilot baseline and
  the global Claude adapter load it before browser work. Installed
  Playwright dependencies no longer imply a standalone script, and browser
  spot-checks explicitly complement required automated checks.
- `CLAUDE.md` — new "Git inside the sandbox" section under Shell Usage. Three
  sandbox denials that read as something else: a blocked `.git/config` write
  makes `git checkout -b <new> <remote>/<base>` exit 1 *after* creating the
  branch and *without* switching to it (so the next commit lands on the old
  branch — use `git switch -c … --no-track` and verify with
  `git branch --show-current`); SSH `fetch`/`push` fail with GitLab's "correct
  access rights" message because `~/.ssh` is unreadable; and a merge or rebase
  that must rewrite a protected path such as `.vscode/` dies mid-checkout,
  leaving `HEAD` in place over a half-written tree. Plus: don't pipe a command
  whose failure matters through `head`/`tail` in an `&&` chain — the chain
  reads the pager's exit status and continues.
- `skills/create-pr` — the reference gains "Carving one MR out of a dirty
  tree": stash by path, `git switch -c … --no-track` off the base, verify the
  switch, stage by path, never `git add -A`. Step 3 points at it, and the
  split-into-several-MRs recipe uses the same branch-creation form. The
  file-based `glab api` MR call now carries `labels=ai:agent-authored` and
  `remove_source_branch=true`, so the long-body route stops shipping MRs
  without the one provenance signal that survives a squash merge; the skill
  validator now fails on an MR-creation snippet that omits the label. Same two
  changes, compactly, in `commands/create-pr.md`.
- `skills/dependency-hotfix`, `skills/npm-maintenance` — maintenance work
  no longer creates Jira subtasks. A critical on production gets its own
  Task with label `maintenance:critical`: the hotfix reuses the open one the
  dependency scanner filed through gb-dashboard, or creates it, and the MR
  closes it. Everything else (highs within two weeks, moderate, low, other
  upkeep) only names the quarter's maintenance ticket, as `Part of <KEY>`
  and never with `Closes`, so the merge leaves that ticket open for a human.
  `references/maintenance-ticket.md` holds both procedures. Eval
  `dependency-hotfix-4` now checks the critical ticket instead of two
  subtasks, and `dependency-hotfix-6` covers reusing the scanner's ticket.
- `start-project` and the architecture template now prescribe draw.io instead
  of Mermaid: one `docs/diagrams/<name>.drawio.svg` per diagram, embedded with
  a Markdown image link, so GitLab renders it and draw.io edits it. Inline
  ```` ```drawio ```` blocks are ruled out because GitLab shows them as raw XML.
  The skill says how to write one without an editor (model in the SVG's
  `content` attribute, render drawn from the same coordinates) and sets layout
  rules: 10px grid, orthogonal edges, no crossings, one colour per role with a
  legend.
- `skills/npm-maintenance` — a major of the package manager itself
  (`packageManager`, such as pnpm 10 → 11) is a hosting decision, not a
  dependency update. Maintenance never proposes it and inventory mode reports
  it as held; a requested bump first checks that every host the project deploys
  to builds with the new lockfile. pnpm 11 and 12 are the current case: Vercel
  could not read their lockfile in October 2026 (vercel/vercel#17434).
- `skills/improve-skill`, `skills/setup-ai-workflows` and `skills/create-pr` no
  longer send a developer to the maintainer's checkout path. They say
  `<ai-workflows>`: `improve-skill` defines it as your local clone of the repo
  (`~/Web/ai-workflows` by default, asking for the path when it is not there,
  never the plugin cache), and `setup-ai-workflows` reads the shared rules and
  templates from the installed plugin first and a local clone second.
  `scripts/validate-skills.mjs` now rejects `~/Web/ai-workflows` in a skill
  outside the five that document the default clone location.
- Every skill names its owner in its frontmatter (`metadata:` /
  `owner: wieteke.pots`), and `scripts/validate-skills.mjs` now errors on a
  skill without `metadata.owner`. The `improve-skill` creation checklist and
  `docs/contributing.md` tell authors of new skills to add it.
- Project templates (`project-CLAUDE.md`, `project-AGENTS.md`,
  `project-copilot-instructions.md`, `project-ai-workflows.md`) — the
  "Shared Workflow Assets Land via MR" rule no longer lands in every synced
  project. The generated `CLAUDE.md`, `AGENTS.md` and Copilot adapter each get
  3,929 bytes smaller (`AI-WORKFLOWS.md` 3,873). One line in the shared-assets
  section now says the `upstream-rules` skill shares a change and carries the
  MR rule. The next project sync removes the old section, because sync
  overwrites those four files.
- `scripts/validate-skills.mjs` — fails when a project template carries the
  `upstream-mr` fragment again, the same way it already did for `CLAUDE.md`.
- `skills/service-cli/references/glab.md` — points at
  `skills/upstream-rules/references/upstream-mr.md` for the MR rule instead of
  a `CLAUDE.md` section that synced projects no longer carry.

### Fixed

- `skills/jira-ticket`, `skills/migration-check`, `skills/release-notes` — the
  `description:` was a plain YAML value containing `: ` ("Project-agnostic:",
  "Read-only:", "Draft only:"), which a strict YAML parser rejects with
  "mapping values are not allowed here". Claude Code loaded the skills anyway;
  a tool that parses the same SKILL.md strictly (Codex may) would not. Each
  value is now double-quoted with its text unchanged.
- `scripts/validate-skills.mjs` errors when shipped frontmatter (skill
  `SKILL.md`, `commands/`, `agents/`, `templates/*SKILL*.md`) has a plain value
  containing `: ` or ` #` or starting with a YAML indicator, or a quoted value
  that does not close. The description-length check now counts the unquoted
  text.
- The project `verify` skill told Claude to save UI screenshots in the system
  temp directory, which the Playwright MCP refuses: it writes only inside the
  project and its own `.playwright-mcp/` folder. The live check of MR !165
  ended in a `mv` out of the repository that only `auto` mode let through.
  The template now takes screenshots without a file name and reports the path
  the browser tool printed, or `inline`; `scripts/sync.sh --project` appends
  `.playwright-mcp/` to the project's `.gitignore` once. A project that already
  has `.claude/skills/verify/SKILL.md` keeps the old text: delete the file (or
  replace step 2.3 by hand when the project edited it) and re-sync.
- `commands/work-backlog.md` — the fallback runbook's WIP rule said an open MR
  from a previous run means "stop and report", while the skill makes reworking
  that MR's unresolved reviewer comments the run's work. The new
  `work-backlog-3` eval case caught a run quoting the runbook and stopping
  instead of reworking; rule 3 and the WIP-check step now match the skill.

## [2.6.0] - 2026-10-08

### Added

- `skills/greenberry-maintenance` — repeats the Greenberry portfolio inventory
  across GitLab, the existing Notion Code metrics register, scanner/updater
  configuration, successful scan artifacts and dependency-channel messages.
  A read-only Python/glab collector records immutable default-branch snapshots;
  the workflow compares configuration, execution and production evidence
  separately. Records dated reports and explicit coverage limits without
  starting scans, syncs, updates or deploys. Adds routing and inventory entries.
- `templates/project-verify-SKILL.md`, emitted by `scripts/sync.sh --project` and
  `skills/setup-ai-workflows` to `.claude/skills/verify/SKILL.md` when a project
  has none. Claude Code runs a project skill named `verify` before each commit
  (docs-only and tests-only ones excepted); a plugin skill does not count, so it
  lives in the project and is never overwritten. It runs the project checks via
  `greenberry:run-checks` and, for a UI change, opens the affected routes in a
  browser and reports screenshot paths.

### Changed

- `skills/close-sprint` — never closes the sprint in the tracker, also not
  after a go for other tracker writes: a go covers the writes it names. The
  close reports which tickets a tracker close would carry out of the sprint
  (those outside the board's last column) and leaves that close to the user.
  When both closes come up, every sentence names the system: "sprint sluiten"
  on its own was read as the repo close, and the tracker sprint got closed on
  that misread. The description now also fires on a request to close the
  sprint in the tracker, and states the rule, since a run after the repo close
  answered without loading the skill. When the changelog is already on the
  integration branch, the skill reports instead of rerunning the phases.
  Eval 6.
- `skills/compact-sprint` — the retention guard follows its reason instead of
  a sprint count. A sprint is eligible once its close is pushed (its changelog
  is on the integration branch's remote); the last-closed sprint also waits
  for the next planning, which reads its gaps document. The old rule (only
  sprints ≤ N-2) blocked a sprint nothing read any more. Phase 0 now counts
  the links into the folder from living docs and recommends waiting while
  ADRs, architecture docs, a register or open backlog items still lean on
  it, since each link becomes a retrieval recipe. Support months keep their
  month-based guard. Evals 1 and 2, the first for this skill.
- `skills/npm-maintenance`, `skills/dependency-hotfix` — a maintenance MR
  hangs under the tracker's maintenance ticket of the current quarter, as its
  own subtask. A critical hotfix and the regular maintenance after it are
  separate MRs, so they get separate subtasks. The subtask is created before
  its MR, so the MR carries the key and the GitLab–Jira integration closes
  it. Only subtasks are written; the quarterly parent stays under human
  control, and an automation move of the parent is reported, never undone.
  No ticket for the quarter means asking, never creating it. The procedure
  lives in the new `skills/npm-maintenance/references/maintenance-ticket.md`,
  with eval 4 in `dependency-hotfix`.
- `skills/npm-maintenance` — direct dependencies are installed at the exact
  target version, since a range picked up a framework minor published that
  week. Transitive fixes move by name with `npm update <pkg>` instead of a
  plain `npm audit fix`, which re-resolves dependents declared as `latest`.
  Before and after are counted in unique advisories, since `npm audit`'s
  totals also count dependents. A test timeout is checked against machine
  load and the sandbox before the bump is blamed. A code generator whose
  engine moved is run and its output diffed.
- `skills/improve-skill` — the "add an eval" step now points at the cases under
  `evals/<skill>/` that `claude plugin eval` runs, instead of
  `skills/<skill>/evals/evals.json`, which nothing could run. The 42 existing
  cases moved there; the repo gains an `evals/` directory at the plugin root
  (never loaded into context).
- `rules/communication.md` — when a result leaves manual steps for the
  developer (a token to create, a setting to flip, a UI action), ask whether
  they want a step-by-step, and give one on yes: the navigation path, every
  field value and flag, what gets copied where, and the verification step.
  The first one lives in `docs/contributing.md`, for the two CI variables the
  release automation needs.
- `skills/npm-maintenance` §4 handles a finding from an external scanner.
  OSV-Scanner may read the production ref instead of the working tree, so §4
  audits that lockfile through `git archive`. The scanner can also call an
  advisory critical while `npm audit` and GitHub call it high, so §4 asks
  `api.osv.dev` for the finding instead of filtering `npm audit`. And OSV and
  GitHub can give different publication dates, so §4 reports both. A one-package
  bump now writes only the lockfile with `--package-lock-only` and diffs it
  entry by entry, because a plain install over a stale `node_modules` dropped
  the optional wasm runtimes. A new step 6 offers the dev team a mail once the
  fix is live: subject `OSV scan (PATCHED) - <project> - <GHSA-id>`, sent to
  `development@greenberry.nl` and the recipients of the previous such mail, with
  one opening sentence and a facts table. It is created as a draft through the
  mail connector first, and given paste-ready only when the connector refuses.
  It is never sent. The template is in the new `references/advisory-mail.md`.
- `skills/npm-maintenance` — every MR that moves a dependency now carries a
  risk analysis per package (`references/risk-analysis.md`), replacing what
  Renovate's MR body used to give and adding project context Renovate never
  had. The block covers:
  - the exact range, including production's version when it differs;
  - the runtime-relevant entries in every release in between, plus a diff of
    the framework defaults;
  - where this project uses each change (`path:line`);
  - the hosting metric it can move;
  - maturity: release age with a 7-day flag, adoption per version from the
    npm downloads API, and open upstream regressions;
  - the package's own revert history;
  - a Low, Medium or High verdict with what to watch after deploy and the
    rollback.

  Everything comes from CLIs and public APIs, so headless runs produce it too.
  High keeps the MR in Draft until the request-volume measurement has run. The
  former "Framework minors are behavioural changes" section is now
  "Behavioural changes need a measurement" and also starts on a High verdict.
  Its positive control applies when a known-bad version exists. Origin: a
  next 16.2 → 16.3 bump that passed lint, tests and the build and raised
  hosting cost about 7×. Adds eval case `npm-maintenance-3`.
- `skills/dependency-hotfix` — the plan, the MR description and the recap
  carry the risk verdict. The Slack parent mentions a High verdict, and the
  "live" thread reply names the metric to watch. When development's version
  sits on a later minor than the lowest fix and that extra range rates High,
  the hotfix takes the lowest fix; the back-merge keeps development's
  version. A High verdict never delays the hotfix. The measurement runs when
  it fits the 24–72 hour window, and otherwise the plan says "not measured".
  Adds eval case `dependency-hotfix-5` and a risk condition to
  `dependency-hotfix-1`.
- `skills/setup-ai-workflows` and `commands/setup-ai-workflows.md` —
  `CONVENTIONS.md` gains a `## Hosting` section. It records the platform, its
  cost-sensitive metrics and a baseline the developer confirms. The risk
  analysis reads its cost surface from there.
- Changelog entries are fragments now: a content MR adds one file
  `changelog.d/<section>.<slug>.md` (`added`, `changed`, `fixed`, …) with its
  `- ` bullets instead of editing `## [Unreleased]`, so two MRs never conflict
  on the changelog again. `scripts/assign-plugin-version.mjs` assembles the
  fragments (and any entries still under Unreleased) into the `## [x.y.z]`
  section in Keep a Changelog order and deletes them; the `release_train` job
  stages that; `validate-skills.mjs` rejects a misnamed or empty fragment. The
  MR rule in `CLAUDE.md`/`AGENTS.md` and `docs/contributing.md` describe it.

## [2.5.0] - 2026-10-07

### Added

- `skills/release` — runs a production release around the project's own
  release runbook, which keeps deciding the mechanics. Up front it asks who
  gets the release mails, proposing the recipients of the previous release
  mail, and whether to share in the project's Slack channel. It drafts a
  "release is starting" mail with a one-hour indication and waits until the
  user has sent it before the promotion. After the runbook's promotion, tag
  and back-sync, it hands the notes to `skills/release-notes` and drafts the
  "release is live" reply in the same thread, with the overview of changes.
  Mail is drafted, never sent. Tickets from the range are classified as
  shipped, context or partial, so a ticket with an open MR or an unanswered
  PO question stays open. Shipped tickets get the version and move to Done.
  Without the Jira rights to create a version, they get the label `vX.Y.Z`
  instead. It ends by checking whether `skills/close-sprint` ran for the
  period and by cleaning up stale branches and worktrees after per-item
  approval. Also covers the after-the-fact case of versioning and closing
  the tickets of an earlier tag. On a project without versions it proposes
  introducing them once, as a setup MR plus a baseline tag, so the next
  release is the first versioned one. It records the decision in
  `CONVENTIONS.md`, also when the answer is "no versions"
  (`references/introduce-versioning.md`). Jira goes CLI first through
  `skills/service-cli`; only version creation uses the connector. Adds
  evals 1–4.
- `skills/dependency-hotfix` — picks up a critical from the Greenberry
  dependency scanner and ships it as a hotfix in one run. It reads the
  scanner's `report.json` through the GitLab artifacts API, since the report
  site sits behind Pages access control. It bumps to the lowest fixing version
  in the same major, preferring the version development already runs. The MR
  to production gets GitLab auto-merge on the reviewed head, and the deploy is
  read back. Production is then back-merged into acceptance and development.
  When `squash_option` is `always`, that back-merge is a fast-forward or a
  two-parent merge-commit push, because a squashed MR would break the
  ancestry the next release needs; otherwise it is an MR with auto-merge and
  squash off. A thread in `#merge_requests` follows the transitions, Monitor
  loops watch the MR, the deploy and the back-merges, and cleanup ends the
  run. One go covers every write, and a later invocation resumes from
  GitLab's state. Majors, migrations and source-code conflicts stop the run.
  Adds evals 1–3. After the first real run (RefugeeWork): it installs exact
  versions, since a caret range picked up a framework minor published that
  week. The production build runs against a scratch database migrated with
  the production branch's migrations, since the developer's database carries
  another branch's schema. Local validation runs before the go, and the
  Slack thread always goes to `#merge_requests`. The back-merge commit is
  prepared while production builds and pushed only when the target has not
  moved. When the resolved tree differs from the target only in version and
  changelog, that diff replaces a re-run of the checks. The platform
  read-back is a background until-loop with the sandbox off, since a Monitor
  cannot leave the sandbox. Cleanup reports the orphaned build workers that
  hold the scratch database open, and drops it with `dropdb --force`.
- `rules/git-flow.md` — names that back-merge push as the one exception to
  "never push to a protected long-lived branch" and "never merge with a merge
  commit".
- `skills/service-cli` — the recipes behind the CLI-first rule: install and
  auth checks, the read-only subcommand set, `--raw | jq` projections, the
  write commands, and the connector-only remainder for GitLab (`glab`), Jira
  (`jira`) and Axiom (`axiom`). The tracker-reading skills and `jira-ticket`
  link here instead of carrying their own snippets.
- `hooks/hooks.json` + `scripts/prefer_service_cli.py` — a PreToolUse hook on
  `mcp__*` that denies an Atlassian or Axiom connector call with a CLI
  equivalent while that CLI is installed, naming the command to run instead.
  Everything else passes through (Confluence, Teamwork Graph, Axiom monitors,
  a missing CLI); `AIW_ALLOW_MCP=1` switches it off for a session. Tests in
  `scripts/test_prefer_service_cli.py`.

### Changed

- `CLAUDE.md` — new "Service access: CLI first" section under Shell Usage:
  GitLab, Jira and Axiom go through their CLI before any connector tool, with
  the connector-only remainder per service spelled out and the hook named.
- `skills/close-sprint`, `skills/sprint-planning`, `skills/refinement`,
  `skills/sprint-demo` and their command runbooks — the tracker precondition
  now reads CLI first (`jira`, recipes in `skills/service-cli`), connector
  only when the CLI is not installed; the connector was "preferred" before,
  against the doctrine in `docs/tooling.md`.
- `skills/jira-ticket` — creates through `jira issue create` (body from the
  template file, `jira sprint add` for the sprint); the connector path with
  its cloudId, account-id and sprint-field discovery is the fallback, not the
  default.
- `skills/mr-merged` — posts the product-owner comment with
  `jira issue comment add`; the degrade step names the CLI.
- `skills/address-review-comments` — a bare MR number no longer resolves to
  the cwd remote only: when `!<n>` there is merged, closed, or someone else's,
  Step 1 searches the user's open MRs across GitLab and finds the matching
  repo's local checkout. New Step 9 hands the MR back after the final push:
  threads stay open for the reviewer, each addressed note gets a 👍 through
  the award-emoji API, and one top-level note names the pushed sha. Step 3's
  proposal names that hand-back, so one go-ahead covers it. Step 6 gains three
  pitfalls: linting a checkout outside the session's working dirs (ESLint
  follows `process.cwd()`, not `--prefix`), `node_modules` installed for
  another branch failing a repo-wide `tsc` hook on untouched files, and a
  crashed jest worker that is not a failing test. Adds evals 1 and 2.
- `skills/close-sprint`, `commands/close-sprint.md` — an interactive close runs
  in the user's own checkout, never in a worktree: the user edits the
  changelog, gaps document and moved BLIs in their editor during the review.
  A dirty tree is a question to ask (Phase 0 names each dirty file and the
  ones the close will move), and the background-run worktree fallback is the
  only exception.
- `skills/close-sprint`, `commands/close-sprint.md` — Phase 5 snapshots the tree
  before the BLI moves and afterwards sweeps the relative links the moves
  broke, in all three directions: into `docs/backlog/` from ADRs, todos and
  the backlog index, from moved items to siblings that stayed, and back. Links
  that were broken before the close are left alone; a code comment naming a
  moved path goes to the gaps document as a follow-up. The status rewrite
  keeps the evidence that followed `done`, and a placeholder ticket key is
  replaced when a tracker ticket names the item. Adds evals 4 and 5.

## [2.4.2] - 2026-10-05

### Fixed

- `skills/mr-merged` — Step 5 no longer lets `git branch -d` decide whether a
  merge-commit branch is merged: `-d` checks the branch's upstream or the
  current `HEAD`, not the default branch, so in a shared checkout that sits on
  another session's branch it refuses a fully merged branch. The run now
  proves it itself (the head equals the merged source SHA, and
  `git merge-base --is-ancestor` against the default branch succeeds) and
  deletes with `git branch -D`. Adds eval 3.

## [2.4.1] - 2026-10-05

### Changed

- `skills/sprint-demo`, `commands/sprint-demo.md` — a slide left out of the
  deck moves to `parked-slides.md` instead of being commented out: a comment
  that swallows its `---` leaves no empty slide, but its text lands in the
  presenter notes of the slide before it. The Phase 8 consistency pass now
  searches the rendered notes for parked text, since a clean slide count does
  not prove it is gone. The pptx build script is kept in the demo folder as
  `build-pptx.py`, with its run command in the runsheet, so a later sync can
  regenerate instead of patching slide XML by hand. The `qlmanage` preview
  step names its preconditions.
- `skills/sprint-demo`, `commands/sprint-demo.md`, `skills/close-sprint`,
  `commands/close-sprint.md` — the shareable pptx leaves the repo at the final
  step, since the demo-folder copy is ignored and close-sprint deletes it: into
  the Google Drive folder through Google Drive for desktop when it is mounted,
  otherwise into a local folder the user names, and the runsheet header
  records where. A remote Drive connector is not the upload route, because it
  cannot read the disk. close-sprint checks that destination before deleting
  the copy and moves the pptx instead when the destination does not hold it,
  so the only copy of the client's deck is never deleted.
- `skills/sprint-demo`, `commands/sprint-demo.md`, `skills/close-sprint`,
  `commands/close-sprint.md` — the demo folder stays out of git again: the
  team does not want the full deck in git. sprint-demo adds a folder-wide
  `docs/demo/` ignore rule in place of the 2.4.0 rendered-file rules, and
  proposes `git rm -r --cached` for demo files an earlier run committed.
  close-sprint flattens the folder into `docs/sprint-<N>/demo.md`, the only
  demo record git keeps, then deletes it after asking, never offering a commit
  to keep the deck; the `## Archief` demo line drops its `git show` recipe.

## [2.4.0] - 2026-10-01

### Added

- `skills/release-notes` + `commands/release-notes.md` — release notes a
  customer can read, for a release range or a closed sprint. Sources by trust
  (sprint changelog, demo runsheet, tracker, git), a classification that
  phrases security fixes as outcomes and folds internal work into one line, an
  ancestor check against the production ref before anything is called live,
  `docs/releases/<key>.md` from a normative template plus a paste-ready block,
  and a review pause — draft only, never posted. `skills/close-sprint` and
  `skills/sprint-demo` name it in their wrap-up. This reopens the
  "per-release notes" row the pipeline map had closed: the team decided on
  2026-09-30 to share release notes with clients, as a first step towards
  standardised releases.

### Changed

- `skills/sprint-demo`, `commands/sprint-demo.md` — the run opens with an
  intake: the scope (full sprint, own stories, or one shared deck per person),
  the client's previous demo format, a shareable version, status and outlook,
  and an architecture before/after only when the sprint changed how systems
  connect. The scope slide splits planned from extra delivered by created date
  against the sprint start, a backlog slide lists what the sprint found but did
  not fix, and demo slides carry screenshots and links into the demo
  environment. The shareable pptx is built on the client's own deck without
  notes, since Marp's `--pptx` carries them, and is synced from `deck.md` with a
  two-way comparison. Phase 8 checks release claims against the release branch
  before the summary. `docs/demo/` is now tracked; only the rendered
  `deck.html` and the shareable pptx are ignored, and the pptx goes to the
  client via the shared drive. The run replaces a folder-wide ignore rule with
  those two and ends by suggesting `close-sprint`.
- `skills/close-sprint`, `commands/close-sprint.md` — a new Phase 5c flattens
  `docs/demo/sprint-<N>/` into `docs/sprint-<N>/demo.md`: what each slide
  showed, the tickets, the demo URLs and the expected questions, without the
  klikpad, checklists or screenshots. The folder is then removed with `git rm`
  and listed under `## Archief`. The ignored rendered files left on disk are
  deleted once the user confirms the pptx is on the drive. When git does not
  track the folder at all, the run asks before deleting it.
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
  receive, which only shows once a lockfile change empties the cache. The wait
  is one bounded poll of about 10 minutes; a slower pipeline is reported at
  the stage it reached and handed to `watch-mrs`.
- `skills/mr-merged` — Step 5 reads the post-merge deploy back: the deploy
  job's log, not only its status, and where a CLI is at hand the deployment
  for the merge commit. A hook-only deploy job passes even when the hook
  refused, so a refused or missing deploy becomes a recap warning, and the
  retry stays the user's call. The wait is one bounded poll of about 10
  minutes; a deploy job that has not run by then is reported as pending.
- `skills/start-project` — lane 3a first checks whether the kickoff already
  ran: `git worktree list` and `git stash list` (including `stash@{n}^3` for
  files stashed with `-u`), read before interviewing, and a found prior run is
  reconciled with the user before anything is written. The harvest also globs
  widely for a requirements or scope document and treats it as the authority.
  Lane 2 enumerates prior implementations in the GitLab group instead of
  accepting the count someone remembered.

### Fixed

- `skills/start-project`, `skills/maintenance` — the merge-settings and
  delivery-metrics scripts no longer run from `~/Web/ai-workflows/`, which only
  a clone has; on a plugin-only install the check came out `unknown`. They
  resolve from the skill's base directory first (the installed plugin version
  exactly, never a glob over a cache that keeps old versions) and fall back to
  the checkout. `scripts/validate-skills.mjs` now fails on any skill, command
  or rule that runs a script through the checkout path.

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
