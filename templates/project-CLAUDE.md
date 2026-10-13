# CLAUDE.md

@AGENTS.md

@CONVENTIONS.md

## Claude Code

`AGENTS.md` and the project's `CONVENTIONS.md` are imported above, so both are
in context from the start of every session. `AGENTS.md` is the adapter every
agent in this project shares; this file adds only what is specific to Claude
Code:

- Skills come from the `greenberry` plugin: prefer the matching plugin skill
  for a repeatable workflow (for example `/greenberry:create-pr`);
  natural-language triggers work through each skill's description.
- Use `commands/` as the fallback path when no skill exists, and keep `rules/`
  as the policy source of truth.
