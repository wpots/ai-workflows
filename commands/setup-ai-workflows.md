# Set Up AI Workflows In A Project

This runbook is the compatibility and fallback surface for the canonical
`setup-ai-workflows` skill. It configures tooling in an existing project; a
whole new project starts with `skills/start-project/SKILL.md`, which calls this
workflow as its configuration lane.

Preferred path:

1. If the current tool supports skills reliably, use
   `skills/setup-ai-workflows/SKILL.md` as the primary workflow.
2. Use this runbook when the tool is prompt/runbook-oriented or when the skill
   path is unavailable.

## Fallback Workflow

1. Validate the target directory exists.
2. Check whether these project-owned files already exist and ask before
   overwriting them:
   - `CONVENTIONS.md`
   - `CLAUDE.md`
   - `AGENTS.md`
3. Read `package.json` when present and detect:
   - stack
   - scripts
   - lint/test/styling tooling
   - language: TypeScript, JavaScript only, or mixed
   - TypeScript strictness posture and unsafe-type linting
   - boundary-validation approach for API, env, JSON, database, file, and queue inputs
   - notable dependencies
   - hosting platform (`vercel.json`, `netlify.toml`, `clevercloud/`) and its
     cost-sensitive metrics, recorded under `## Hosting` in `CONVENTIONS.md`
     with a baseline from the developer (never a guess) — dependency MRs read
     it for their risk analysis
4. Probe the project structure and map folders to clean-architecture layers.
5. Detect deviations from the shared baseline, including JavaScript where the
   baseline expects TypeScript, weaker `tsconfig` posture, missing unsafe-type
   lint rules, or missing trust-boundary validation patterns. Ask the
   developer for each one whether it is **accepted** (stays; record the
   reason) or **migrating** (record the target, the rule for new code, and how
   existing code follows). The rationale lives in the decision log of
   `docs/architecture.md` when that exists; `CONVENTIONS.md` links to it.
6. Create or update `CONVENTIONS.md` as the project-specific source of truth.
   When relevant, surface:
   - TypeScript strictness posture
   - unsafe-type lint posture
   - boundary validation conventions
   - each deviation from the global rules with its status (accepted or
     migrating)
7. Sync the project-facing workflow files:
   - `AI-WORKFLOWS.md`
   - `CLAUDE.md`
   - `AGENTS.md`
   - `rules/`
   - `commands/`

   Cursor and Copilot are not supported: generate nothing under `.cursor/` or
   `.github/` for them, and leave the project's existing files there as they
   are.
8. Emit project tooling: write a checked-in, env-var-based `.mcp.json`
   for detected needs — Playwright in
   devDependencies → `playwright`, live-browser debugging →
   `chrome-devtools`. Also probe GitLab remote, ticket refs, Figma links,
   and CMS token needs (Payload/Prepr), and record everything — servers,
   CLIs, connectors, env vars — in the `## Tooling` section of
   `CONVENTIONS.md`. Skip existing files; merge manually. Doctrine:
   `docs/tooling.md` in ai-workflows. Write `.claude/settings.json` from
   `templates/project-claude-settings.json` when the project has none.
9. Summarize:
   - detected stack and language
   - created or updated files
   - deviations from global rules, with their status
   - notable type-safety posture or trust-boundary gaps

## Constraints

- Do not modify existing source code.
- Do not install dependencies.
- Do not overwrite `CONVENTIONS.md` without asking first.
- Keep `CONVENTIONS.md` concise and project-owned.
