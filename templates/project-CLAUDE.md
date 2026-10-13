# CLAUDE.md

@AGENTS.md

## Claude Code

`AGENTS.md`, imported above, is the adapter every agent in this project
shares. This file adds only what is specific to Claude Code:

- Skills come from the `greenberry` plugin: prefer the matching plugin skill
  for a repeatable workflow (for example `/greenberry:create-pr`);
  natural-language triggers work through each skill's description.
- Use `commands/` as the fallback path when no skill exists, and keep `rules/`
  as the policy source of truth.
