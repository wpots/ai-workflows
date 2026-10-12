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
