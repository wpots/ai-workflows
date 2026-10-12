# CLAUDE.md

Read `AI-WORKFLOWS.md` for how this project's AI workflow files are intended to work together.
Read `CONVENTIONS.md` for project-specific context, stack, structure, and conventions.
Read `rules/` for baseline coding standards (shared across all projects).
Load only the relevant focused rule files for the task:

- `rules/tailwind.md` for styling and design-token work
- `rules/testing.md` before browser verification, tests, and test reviews
- `rules/accessibility.md` for interactive UI and accessibility checks
- `rules/type-safety.md` for TypeScript-heavy work, trust boundaries, and runtime validation checks
- `rules/adr.md` when recording an architecture decision, creating `docs/adr/` or `docs/architecture.md`, or changing something a recorded decision covers
- `rules/backlog.md` for user stories, specs, and backlog work
- `rules/content-blocks.md` for CMS-backed block architecture, transforms, and block-specific checklists
- `rules/payload.md` for Payload schema, generated-type, and integration work
- `rules/project.md` for component and module work (prop-types in `types.ts`, named handlers, no `React.FC`, etc.)
- `rules/sonarqube.md` when addressing a SonarQube/SonarLint finding or writing code that could trip an opted-in Sonar rule
- the appropriate `rules/stacks/*` file after detecting the stack from `package.json`

### Mandatory load triggers (by path)

Load these **before** writing or editing the matching files — not after, and not
only when it "feels architectural". The path is the trigger:

- Touching a route/page/layout file or a page-level template → load the detected
  `rules/stacks/*` rule for the route → data-access seam → template contract and
  its Definition of Done.
- Adding or changing a component or module → load `rules/project.md` (prop-types
  in `types.ts`, named handlers, no `React.FC`, component design).
- Writing or editing **any** source file → load `rules/documentation.md`, which
  governs both the comments the change adds and the ones it makes stale. It is
  mandatory rather than task-scoped because "when adding a comment" only becomes
  true while the comment is being written — after the moment it had to be
  loaded. Nearly every change adds or invalidates one, so a rule that waits for
  that signal is a rule that never loads.

## Precedence

1. `CONVENTIONS.md` (project-specific conventions)
2. `rules/` (baseline coding standards)
3. This file (tool adapter)

When CONVENTIONS.md conflicts with rules/, CONVENTIONS.md wins.

## Shared Workflow Source

When a change touches shared workflow assets in a reusable way, suggest
upstreaming it to the
[ai-workflows](https://gitlab.com/greenberrynl/config/ai-workflows) repo rather
than keeping it only in this synced target repo. The `upstream-rules` skill
does that, and carries the rule for landing it via a GitLab MR.

Shared workflow assets:

<!-- BEGIN SHARED:workflow-assets -->
<!-- END SHARED:workflow-assets -->

## Workflow Strategy

On Claude, skills are first-class:

- prefer the matching `greenberry` plugin skill for repeatable workflows
  (for example `/greenberry:create-pr`); natural-language triggers work
  through each skill's description
- use `commands/` as the compatibility and fallback path when no skill exists
- keep `rules/` as the policy source of truth

## Command Mapping

When user intent matches one of these triggers, read and follow the corresponding runbook in `commands/`:

<!-- BEGIN SHARED:command-mappings -->
<!-- END SHARED:command-mappings -->

Do not assume command files auto-run. Select and execute them when intent matches.

## Safety

<!-- BEGIN SHARED:safety -->
<!-- END SHARED:safety -->

## Knowledge Graph (graphify)

<!-- BEGIN SHARED:graphify -->
<!-- END SHARED:graphify -->
