# Initialize Project With ai-workflows

This runbook is the compatibility and fallback surface for the canonical
`experimental.init-project` skill.

Preferred path:

1. If the current tool supports skills reliably, use
   `skills/experimental.init-project/SKILL.md` as the primary workflow.
2. Use this runbook when the tool is prompt/runbook-oriented or when the skill
   path is unavailable.

## Fallback Workflow

1. Validate the target directory exists.
2. Check whether these project-owned files already exist and ask before
   overwriting them:
   - `CONVENTIONS.md`
   - `CLAUDE.md`
   - `AGENTS.md`
   - `.cursor/rules/conventions.mdc`
3. Read `package.json` when present and detect:
   - stack
   - scripts
   - lint/test/styling tooling
   - TypeScript strictness posture and unsafe-type linting
   - boundary-validation approach for API, env, JSON, database, file, and queue inputs
   - notable dependencies
4. Probe the project structure and map folders to clean-architecture layers.
5. Detect deviations from the shared baseline, including weaker `tsconfig`
   posture, missing unsafe-type lint rules, or missing trust-boundary
   validation patterns.
6. Create or update `CONVENTIONS.md` as the project-specific source of truth.
   When relevant, surface:
   - TypeScript strictness posture
   - unsafe-type lint posture
   - boundary validation conventions
   - rationale for intentional deviations from `rules/type-safety.md`
7. Sync the project-facing workflow files:
   - `AI-WORKFLOWS.md`
   - `CLAUDE.md`
   - `AGENTS.md`
   - `.github/copilot-instructions.md`
   - `.cursor/rules/conventions.mdc`
   - `rules/`
   - `commands/`
   - `.github/prompts/`
8. Summarize:
   - detected stack
   - created or updated files
   - deviations from global rules
   - notable type-safety posture or trust-boundary gaps

## Constraints

- Do not modify existing source code.
- Do not install dependencies.
- Do not overwrite `CONVENTIONS.md` without asking first.
- Keep `CONVENTIONS.md` concise and project-owned.
