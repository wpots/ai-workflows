- `CLAUDE.md` — the `## Command Mapping` block keeps only the two commands that
  have no skill (`safe-kill-port`, `new-device-setup`); the 15 rows a skill row
  already routes as its fallback are gone from the ambient layer (1.6 KB).
  `AGENTS.md` and the Copilot adapter keep the full command block.
- `shared/skill-mappings.md` — `sustainable-review` gains `performance review`,
  the one trigger that only its command row carried.
- `scripts/validate-skills.mjs` — a covered command row's triggers must all be in
  its skill row, an uncovered one must be in `CLAUDE.md` verbatim, and
  `CLAUDE.md` may not route a covered command in a command row.
- `skills/improve-skill` — new trigger phrases go into the shared fragments, no
  longer into "the `## Command Mapping` section of `CLAUDE.md`".
