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
