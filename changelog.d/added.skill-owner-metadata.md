- `scripts/validate-skills.mjs` reads a nested `metadata:` map in skill
  frontmatter (the Agent Skills string-to-string map that Claude Code and Codex
  load without acting on) instead of folding its lines into one string, and
  accepts `metadata` as a known key. A skill without `metadata.owner` gets a
  warning for now.
