# Pipeline Map

Where every rule, skill, and command in this repo fires in the delivery process.

This repo already has two inventories **by type** — `docs/workflow-canonical-sources.md`
(which surface is canonical per workflow) and `FEATURES.md` (what exists). This
document is the inventory **by process**: for each phase of the delivery pipeline,
which surfaces run, which quality gate closes the phase, and whether that gate is
actually automated or only written down.

Read it to answer three questions:

1. I am at point X in the process — what should I invoke?
2. Which gates does a change pass before it reaches production?
3. Where does the pipeline still rely entirely on a human remembering?

## The pipeline

```mermaid
flowchart LR
  design["Design<br/><small>design → code</small>"]
  plan["Plan<br/><small>tickets</small>"]
  build["Build<br/><small>implement</small>"]
  qa["QA<br/><small>verify vs criteria</small>"]
  review["Review<br/><small>MR vs ticket</small>"]
  ship["Ship<br/><small>release</small>"]
  operate["Operate<br/><small>run + observe</small>"]

  design --> plan --> build --> qa --> review --> ship --> operate
  operate -. "feedback triage" .-> build

  g1(["Design readiness<br/>not automated"])
  g2(["Definition of ready<br/>partial"])
  g3(["Build health<br/>automated"])
  g4(["Release readiness<br/>automated, manually armed"])
  g5(["Deploy health<br/>not automated"])

  design -.- g1
  plan -.- g2
  qa -.- g3
  review -.- g4
  ship -.- g5

  classDef gate fill:#fff7ed,stroke:#c2751a,color:#7c3f04;
  classDef gap fill:#fef2f2,stroke:#b91c1c,color:#7f1d1d;
  class g2,g3,g4 gate;
  class g1,g5 gap;
```

## Quality gates

| Gate | Sits between | Enforced by | Status |
| --- | --- | --- | --- |
| Design readiness | Design → Plan | nothing | ❌ absent — a spec is written by hand or not at all |
| Definition of ready | Plan → Build | `skills/refinement` + `rules/backlog.md` | ⚠️ partial — encoded, never blocking |
| Build health | Build/QA → Review | `skills/run-checks`, plus `skills/migration-check` when the diff touches migrations | ✅ automated |
| Release readiness | Review → Ship | `skills/watch-mrs` — one `detailed_merge_status` field covers approval, pipeline result, conflicts and draft state | ✅ automated, ⚠️ armed by hand today |
| Deploy health | Ship → Operate | nothing | ❌ absent — no post-deploy verification surface |
| Workflow-asset review | any change to **this** repo | feature branch → GitLab MR → reviewer `wieteke.pots` (`shared/workflow-assets.md`) | ✅ policy, human-enforced |

## The improve loop

The seven-phase picture describes how work flows through a *product* repo. It does
not show how work re-enters *this* repo — which is the whole reason ai-workflows
exists. That is the eighth lane:

```mermaid
flowchart LR
  friction["Friction in any phase<br/><small>correction, retry, workaround</small>"]
  learn["skills/improve-skill<br/>skills/skill-opportunity"]
  upstream["skills/upstream-rules<br/>skills/upstream-to-unicore"]
  gate{{"GitLab MR<br/>reviewer wieteke.pots"}}
  ctx["Shared context layer<br/><small>rules · skills · commands · templates</small>"]

  friction --> learn --> upstream --> gate --> ctx
  ctx -. "loaded by every tool, in every phase" .-> friction
```

Every change to this repo passes that gate — a developer editing a rule by hand and
an agent running an upstream skill are treated identically. No direct pushes to
`main`, and the GitHub mirror is not a substitute.

## Phase by phase

### Design — design → code

Turning a design or a requirement into something implementable.

| Surface | Type | Role |
| --- | --- | --- |
| `skills/component-spec` | skill | Production-ready component spec: API, a11y requirements, keyboard + screen-reader behaviour, testing guidance, open questions |
| `rules/tailwind.md` | rule | Design tokens via `@theme`; how a design system maps onto utilities |
| `rules/accessibility.md` | rule | Semantics, contrast, keyboard behaviour — decided here, not patched in QA |
| `packages/accessibility` | package | Optional a11y preset bundle for a target project |
| Figma MCP | connector | `get_design_context`, `get_variable_defs`, `get_screenshot` — provided by the Figma connector, not by `mcp/servers.json` |

**Gate — Design readiness: absent.** Nothing checks that design tokens, states, and
a11y behaviour are settled before a ticket is written. See [Gaps](#gaps).

### Plan — tickets

Turning intent into work items with acceptance criteria.

| Surface | Type | Role |
| --- | --- | --- |
| `skills/refinement` | skill | Prep and record refinement: grouping, story points, conflicts, per-ticket questions — tracker read-only |
| `skills/sprint-planning` | skill | Sprint scope, spillover carry-in, dependency mapping, realism against velocity |
| `skills/backlog` | skill | Draft or update a local backlog item in `docs/backlog/` |
| `skills/jira-ticket` | skill | Create a Jira bug/story/task from a type-specific template — the one sanctioned tracker **write** |
| `skills/sprint-board` | skill | Opens the item on the per-sprint board and tracks it through every later status |
| `commands/refinement.md`, `commands/sprint-planning.md`, `commands/backlog.md` | commands | Fallback runbooks for tools that cannot use skills |
| `rules/backlog.md` | rule | User story, spec, and backlog-item structure |
| `docs/backlog/` | context | Local BLIs — the definition of done that `skills/work-backlog` consumes |

**Gate — Definition of ready: partial.** `skills/refinement` and `rules/backlog.md`
define readiness; nothing prevents an unready item from being picked up.

### Build — implement

| Surface | Type | Role |
| --- | --- | --- |
| `skills/work-backlog` | skill | Autonomous delivery of one BLI, WIP limit 1 — spans Plan → Review and calls the phases below |
| `skills/test-driven-development` | skill | Strict RED-GREEN-REFACTOR for a feature or bugfix |
| `skills/scaffold-component` | skill | New component with the project's file structure and conventions |
| `skills/commit-message` | skill | Conventional commit message from the diff |
| `commands/work-backlog.md`, `commands/scaffold-component.md`, `commands/commit-message.md`, `commands/safe-kill-port.md` | commands | Fallback runbooks; `safe-kill-port` is local-dev hygiene (`EADDRINUSE`) |
| `rules/project.md` | rule | Structure, naming, component architecture, function style |
| `rules/type-safety.md` | rule | Trust boundaries, strict TS posture, lint guardrails |
| `rules/clean-architecture.md` | rule | Layer boundaries and dependency direction |
| `rules/content-blocks.md`, `rules/payload.md` | rules | CMS-backed block architecture; Payload schemas, generated types, hooks |
| `rules/testing.md` | rule | Testing strategy and query priority while writing code |
| `rules/sustainability.md` | rule | Runtime, bundle, and asset cost as a build-time concern |
| `rules/stacks/nextjs-payload.md`, `rules/stacks/react-native-expo.md` | rules | Stack-specific conventions layered on the baseline |

**Gate — Build health: automated** via `skills/run-checks`.

### QA — verify vs criteria

Verifying the change against its acceptance criteria and the project's standards,
before another human is asked to look at it.

| Surface | Type | Role |
| --- | --- | --- |
| `skills/run-checks` | skill | Lint, type-check, stylelint, test, build in sequence; stops on failure for a decision |
| `skills/code-review` | skill | Severity-ordered self-review of the branch diff with explicit type-safety audit |
| `skills/architecture-review` | skill | Clean-architecture violations against the project's *actual* folder mapping |
| `skills/migration-check` | skill | Static check of a generated Payload/Postgres migration for snapshot drift — read-only, never runs `migrate` |
| `skills/wcag-audit` | skill | Static WCAG review against `rules/accessibility.md` (the automated production scan sits in Operate) |
| `skills/sustainable-review` | skill | Runtime, bundle, asset, dependency and CI cost of the change |
| `commands/run-checks.md`, `commands/review-code.md`, `commands/sustainable-review.md` | commands | Fallback runbooks |
| `rules/sonarqube.md` | rule | Quality-gate expectations for static analysis |

**Gate — Build health: automated.** Note the sustainability constraint: the full
sweep runs **once**, immediately before pushing — QA scopes checks narrowly while
building instead of re-running everything.

### Review — MR vs ticket

| Surface | Type | Role |
| --- | --- | --- |
| `skills/create-pr` | skill | Rebase onto base, push, open PR/MR with a description generated from the diff; pre-flight delegates to `skills/migration-check` |
| `commands/create-pr.md` | command | Fallback runbook |
| `skills/code-review` | skill | Review a branch, MR, or PR by URL; can post inline MR comments after a go-ahead |
| `skills/receiving-code-review` | skill | Evaluate incoming feedback with rigour — verify, push back where wrong, then apply |
| `skills/address-review-comments` | skill | Apply approved feedback, run checks, push, rebase, clean up |
| `skills/watch-mrs` | skill | Background loop over new comments and merge-readiness; opt-in auto-merge |
| `skills/sprint-board` | skill | Moves the item to *in review* / *rework* |

**Gate — Release readiness: automated but armed by hand.** `skills/watch-mrs` can
watch a MR the moment it exists, but nothing arms it — which is why a red pipeline
can sit unnoticed. See [Gaps](#gaps).

### Ship — release

| Surface | Type | Role |
| --- | --- | --- |
| `skills/watch-mrs` | skill | Merges once the MR is mergeable, when auto-merge was explicitly enabled for that invocation |
| `skills/close-sprint` | skill | Sprint changelog, gaps/spillover, delivered BLIs moved into a sprint folder |
| `skills/sprint-demo` | skill | Presenter runsheet plus a Marp deck for sprint review |
| `commands/close-sprint.md`, `commands/sprint-demo.md` | commands | Fallback runbooks |

**Gate — Deploy health: absent.** Nothing verifies a deploy, drafts release notes,
or hands the PO a way to test what shipped. See [Gaps](#gaps).

### Operate — run + observe

| Surface | Type | Role |
| --- | --- | --- |
| `skills/npm-maintenance` | skill | Dependency updates, `npm audit` remediation, researched major migrations |
| `skills/wcag-audit` | skill | axe-core/Playwright scan of the live site, combined with the static findings |
| `skills/sustainable-review` | skill | Production runtime, caching, asset and CI-cost audit |
| `skills/jira-ticket`, `skills/backlog` | skills | The landing point of feedback triage: an observation becomes a ticket or a BLI |

A broader periodic project-maintenance sweep (deps, runtime EOL, credential and
API-key currency, CI hygiene, doc drift) is in flight on another branch and lands
in this phase.

**Feedback triage** is the dotted arrow back into Build: is this actionable →
reproduce → fix → draft MR. Today it starts with a human reading a report; no
surface owns the triage step itself.

### Improve — maintaining the pipeline

| Surface | Type | Role |
| --- | --- | --- |
| `skills/improve-skill` | skill | Post-run retrospective: fold friction back into the skill's canonical source, or author a new skill |
| `skills/skill-opportunity` | skill | Decide from working sessions whether a new or updated skill is warranted |
| `skills/upstream-rules` | skill | Propose a rule/skill change back to this repo as a GitLab MR |
| `skills/upstream-to-unicore` | skill | Port a reusable change into `unicore-template` |
| `skills/init-project` | skill | Generate `CONVENTIONS.md`, thin tool adapters, and sync shared assets into a project |
| `commands/init-project.md`, `commands/new-device-setup.md` | commands | Fallback runbook; new-machine bootstrap |
| `scripts/sync.sh`, `scripts/generate-adapters.sh` | scripts | Distribute canonical sources to projects and regenerate derived adapters |
| `scripts/validate-ai-instructions.sh`, `scripts/validate-skills.mjs`, `scripts/install-hooks.sh`, `scripts/smoke-test-project-sync.sh` | scripts | Drift detection: CI and the pre-commit hook run the same validators |
| `docs/workflow-canonical-sources.md` | doc | Which surface is canonical per workflow |
| `docs/skills-first-migration-plan.md` | doc | Why skills are canonical and commands are the fallback |
| `shared/workflow-assets.md` | shared | What counts as a shared workflow asset, and how it lands |

## Shared context layer

The diagram's "Jira live · tokens, conventions & decisions in repo · read-only
snapshots pinned per branch", in real paths:

| Asset | What it carries |
| --- | --- |
| `CONVENTIONS.md` (per project) | The single source of project truth; every tool adapter points at it |
| `rules/rules.md` | Index — which rule file loads when |
| `rules/communication.md` | Tone and response style, tool-independent |
| `shared/core-rules.md`, `shared/command-mappings.md`, `shared/safety.md`, `shared/graphify.md` | Fragments injected into generated adapters, so every tool sees the same baseline |
| `templates/project-CLAUDE.md`, `templates/project-AGENTS.md`, `templates/project-copilot-instructions.md`, `templates/project-cursor-conventions.mdc`, `templates/project-cursor-graphify.mdc`, `templates/project-ai-workflows.md`, `templates/project-claude-settings.json` | Thin per-tool adapters generated into a project |
| `templates/pull_request_template.md` | Last-resort MR body skeleton for `skills/create-pr` |
| `packages/selection.md`, `packages/greenberry-base`, `packages/frontend`, `packages/nextjs`, `packages/payload`, `packages/testing` | Composable convention bundles per target project |
| `mcp/servers.json` | Canonical MCP server definitions (github, filesystem, context7) |
| `docs/backlog/` | Local backlog items — the contract `skills/work-backlog` delivers against |
| `docs/board/sprint-<N>-board.md` | Per-sprint work board (untracked, project-local) |
| `graphify-out/` | Generated knowledge graph over the repo, queried before re-reading files |

Live context — the Jira box in the diagram — is read through MCP at run time.
Every tracker-reading skill treats it as **read-only**; only `skills/jira-ticket`
writes, and only after explicit confirmation.

## Gaps

Ordered by how often they bite. Each is filed as a backlog item.

| # | Gap | What it costs today | Filed as |
| --- | --- | --- | --- |
| 1 | Nothing arms a monitor after the MR is opened; no review or ticket-drift pre-flight | A red pipeline sits unnoticed; a reviewer sees what a self-review would have caught | `docs/backlog/chore-create-pr-preflight-and-monitor.md` |
| 2 | No check that the ticket still says what it said when the branch started | AC changed or a comment moved the scope, and the MR silently misses it | `docs/backlog/feat-ticket-drift-check.md` |
| 3 | No surface triages a failing pipeline | The same CI failure recurs because nobody reads the job trace | `docs/backlog/feat-pipeline-triage.md` |
| 4 | `skills/watch-mrs` reports merge status, not pipeline detail, and hands off to nothing | You learn *that* it failed, not *which job* — and merge is a dead end | `docs/backlog/chore-watch-mrs-pipeline-and-merge-handoff.md` |
| 5 | The local check sweep is not derived from the CI job list | Green locally, red in CI | `docs/backlog/chore-run-checks-ci-parity.md` |
| 6 | Nothing happens after merge | The PO never gets a "how to test this"; the board and ticket drift | `docs/backlog/feat-mr-merged.md` |
| 7 | No policy or review dimension for stale comments and docs | Outdated comments mislead the next reader — human or agent | `docs/backlog/feat-doc-and-comment-freshness.md` |
| 8 | Project kickoff starts at stack detection, not at intent | Brief, spec and architecture decisions live in someone's head or in Slack | `docs/backlog/feat-start-project.md` |
| 9 | "Run `improve-skill` after a run that needed intervention" is prose, not a hook | The retrospective happens when someone remembers | `docs/backlog/chore-improve-skill-stop-hook.md` |

Known-open, not filed: **Design readiness** has no automation (a design-review
surface could diff Figma variables against `@theme` tokens), and **Operate** has no
observability or error-triage surface, so the feedback-triage arrow still begins
with a human reading a dashboard.

## Keeping this map accurate

`scripts/validate-skills.mjs` checks this file on every commit (via
`scripts/install-hooks.sh`) and in CI (via `scripts/validate-ai-instructions.sh`):

- a repo path named here that does not exist → **error**
- a path that exists but is untracked → **warning** (a work-in-progress surface)
- a tracked skill, command, or rule that appears nowhere in this file → **warning**

So adding a skill without placing it in the process is a visible warning, not a
silent omission. When a phase or gate itself changes, update the Mermaid diagram
and the gate table by hand — that structure is deliberately not generated.
