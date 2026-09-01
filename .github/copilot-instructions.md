# Copilot Instructions

Use this repository as the single source of truth for shared AI workflows.

## Working Model

- Copilot reliably auto-loads this file, so important coding guidance must live here.
- Reusable workflows live in `commands/`; Copilot prompt wrappers are generated into `.github/prompts/`.
- In synced target projects, `CONVENTIONS.md` overrides this baseline.

## Technical Baseline

<!-- BEGIN SHARED:core-rules -->
Apply these as the default coding baseline when project-local conventions do not say otherwise.

## TypeScript And React

- Use TypeScript with strict, explicit types.
- Treat API payloads, `JSON.parse` results, env vars, database rows, files, queue messages, and third-party library data as untrusted until validated.
- Prefer `unknown` plus narrowing or validation at boundaries over `any` or asserted certainty.
- Avoid broad `as` assertions; prefer guards, validation, or better typing.
- Prefer discriminated unions over loose optional-state objects.
- Convert transport shapes into explicit trusted domain types after validation.
- Prefer `interface` for object contracts and `type` for unions/composition.
- Use named function declarations for exported functions and components.
- Use `const handleToggle = () => {}`-style arrow expressions for local callbacks and event handlers inside components.
- Do not use `React.FC`.
- Keep components focused; extract hooks or helpers when logic starts to sprawl.
- Define explicit props types/interfaces for components.
- Prefer composition over deep prop drilling.
- In Next.js projects, default to Server Components and only use `"use client"` for hooks, events, browser APIs, or client-only libraries.
- In Next.js projects, prefer server-side data loading over `useEffect` fetching when a server-rendered path exists.

## Architecture

- Keep presentation thin: rendering and UI state belong in components, not business rules.
- Dependencies flow inward: Presentation -> Application -> Infrastructure -> Domain.
- Presentation can use application-layer APIs and domain types, but not infrastructure directly.
- Domain code stays framework-free and side-effect free.
- Validate and map API, CMS, database, file, and other transport payloads at the boundary before they leak into the UI or domain.

## Avoid

- `any`, unchecked parsing, broad assertions, and anonymous exported APIs.
- Passing raw external payloads straight into domain or UI code.
- Direct fetch, database, or CMS calls inside UI components.
- Components that mix rendering, business logic, and data access.
- Introducing a new styling or component-library pattern that conflicts with project conventions.
- Ignoring `CONVENTIONS.md` or other project-local rules when they exist.
<!-- END SHARED:core-rules -->

## Command Mapping

When user intent matches one of these prompts, read and follow the
corresponding runbook:

<!-- BEGIN SHARED:command-mappings -->
- `create pr`, `open pr`, `submit pr` -> `commands/create-pr.md`
- `commit message`, `write commit`, `git commit` -> `commands/commit-message.md`
- `backlog item`, `user story`, `feature spec`, `bug item`, `bli` -> `commands/backlog.md`
- `close sprint`, `sluit sprint af`, `sprint afsluiten`, `close support month`, `support maand afsluiten` -> `commands/close-sprint.md`
- `compact sprint`, `compact old sprints`, `sprint compacten`, `oude sprints opruimen`, `compact support months` -> `commands/compact-sprint.md`
- `refinement`, `prepare refinement`, `refine tickets`, `refinement vastleggen` -> `commands/refinement.md`
- `sprint demo`, `demo voorbereiden`, `demo script`, `prepare demo` -> `commands/sprint-demo.md`
- `sprint planning`, `plan sprint`, `sprint start`, `start sprint`, `plan komende sprint` -> `commands/sprint-planning.md`
- `sustainable review`, `sustainability review`, `performance review`, `performance audit`, `green refactor`, `ci review`, `dependency review` -> `commands/sustainable-review.md`
- `run checks`, `run-checks`, `quality checks` -> `commands/run-checks.md`
- `review code`, `code review`, `review changes` -> `commands/review-code.md`
- `kill port`, `port 3000`, `eaddrinuse` -> `commands/safe-kill-port.md`
- `new component`, `scaffold`, `create component` -> `commands/scaffold-component.md`
- `new device`, `setup device`, `onboarding` -> `commands/new-device-setup.md`
- `apply ai-workflows`, `setup ai-workflows`, `generate conventions`, `refresh project config` -> `commands/setup-ai-workflows.md`
- `work backlog`, `work the backlog`, `next backlog item`, `autonomous delivery` -> `commands/work-backlog.md`
<!-- END SHARED:command-mappings -->

Do not assume command files auto-run. Select and execute them when intent
matches.

## Shared Workflow Assets Land via MR

<!-- BEGIN SHARED:upstream-mr -->
This is a hard rule, not a preference. It applies whenever you work in a
canonical config repo (`ai-workflows`, `unicore-template`) **or** run an
upstream skill (`upstream-rules`, `upstream-to-unicore`) from any project.

- NEVER commit or push to `main` (or the template's target branch) directly —
  not for a one-line doc fix, not even when the push would succeed.
- Always: feature branch off the latest remote base → commit → push → open a
  **GitLab MR** on the canonical GitLab remote (resolve that remote by URL,
  never by assuming its name).
- `ai-workflows` is the **only** repo whose reviewer is named in the rules:
  request review from the maintainer, `wieteke.pots`, on an `ai-workflows` MR —
  `glab mr create … --reviewer wieteke.pots`, or on an MR that already exists
  `glab mr update <iid> -R greenberrynl/config/ai-workflows --reviewer wieteke.pots`.
  Everywhere else — `unicore-template`, client projects, anything — open the MR
  with **no `--reviewer` flag** and let the human assign one. Never infer a
  reviewer from CODEOWNERS, repo members, or git history, and never assign the
  MR author; only pass `--reviewer` when the user named that person.
- Pass **both** `-R <canonical-repo>` and `-H <canonical-repo>` to
  `glab mr create`, and `-R` to every follow-up `glab mr update`/`view`. `-R`
  sets only the target; the head (source) project and the MR lookup still
  default to the **current directory's** git remote. Run these from the
  originating project — normal, and unavoidable for an agent that may not `cd`
  — and MR creation fails with
  `422 [Source project is not a fork of the target project]`. Do not fall back
  to `glab api …/merge_requests`: `--field "reviewer_ids[]=<id>"` sends the
  bracket as a literal JSON key and silently opens the MR with no reviewer.
- When the MR changes what the `greenberry` plugin ships or how it behaves —
  `skills/`, `commands/`, `.claude-plugin/`, `hooks/`, a script a hook runs, or
  the ambient layer (`CLAUDE.md`, `rules/communication.md`,
  `rules/project.md`, `rules/clean-architecture.md`) — describe it under
  `## [Unreleased]` in `CHANGELOG.md` and **do not touch the `version` in
  `.claude-plugin/plugin.json`**. The number is assigned after merge, by
  `node scripts/assign-plugin-version.mjs --write` in its own small release MR.
  Claiming a version inside a content MR is what makes concurrent MRs collide:
  every one of them edits the same manifest line and inserts at the same
  changelog position, so whoever merges second conflicts and carries a number
  that is already on `main` — and a version that goes backwards is invisible in
  `/plugin`, since the install path is version-keyed.
- An `ai-workflows` MR without that reviewer is not done. Confirm it with
  `glab mr view <iid> -R greenberrynl/config/ai-workflows` before reporting, and
  report the real MR URL — never claim an MR or a reviewer the CLI did not
  confirm.
- The GitHub mirror is not a substitute: these repos are reviewed on GitLab
  (GitHub also refuses a review request from the PR author).
<!-- END SHARED:upstream-mr -->

## Safety

<!-- BEGIN SHARED:safety -->
- Prefer concrete execution over long planning.
- Do not modify code unless requested.
- Ask before destructive actions (force kill, reset, delete) unless explicitly requested.
- **Never terminate Visual Studio Code without explicit approval for the exact
  target.** This includes `Code`, `Code Helper` (renderer, plugin/extension
  host, GPU, and pty host), and equivalent VS Code processes. The gate applies
  to every signal and termination mechanism, including `TERM`, `KILL`,
  `kill`, `pkill`, `killall`, `taskkill`, and application quit/force-quit
  commands. A broad request such as "free the port", "stop dev servers", or
  "clean up processes" is not approval to terminate VS Code.
- Before terminating a process, resolve patterns to exact PIDs and inspect each
  PID's command. Do not use a pattern-based kill when its full match set has not
  been inspected. If a target is VS Code or its identity is ambiguous, show the
  PID and command and wait for approval before sending any signal.
- Always summarize what was run and what changed.
<!-- END SHARED:safety -->
