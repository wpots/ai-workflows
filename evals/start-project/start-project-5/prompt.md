---
tags: [start-project, runnable]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "Before lane 2, the run proposes the first-run lane: the path a developer takes on day one, actually run — prerequisites (Docker, gitleaks, a free database port), install from the lockfile, the tests, `db:up` (only after a go, because it starts a container), the migrations left to the developer (the agent never runs a migrate script), the build and the hooks. A failure is reported as a finding: a template fix through upstream-to-unicore when the failing file is template-owned, a backlog item otherwise. It is not fixed inside the kickoff."
---

Kickoff for bakkerij-jansen-website, a production site. Lane 0 came back ok: it was made with Create from template in the client group, and `.unicore.json` records unicore-template v4 with the Payload preset. Lane 1 ran, so `CONVENTIONS.md` and the adapters exist.

Nobody has run the project yet; it was only cloned. `package.json` pins pnpm and has the scripts `test`, `build`, `lint:check`, `type-check`, `env:keys`, `db:up` (Docker Compose, local Postgres on 5432), `migrate:status` and `migrate`. `.husky/pre-push` runs `lint:check`, `type-check` and `test`.

What does the kickoff do next, before we collect the design and service resources?
