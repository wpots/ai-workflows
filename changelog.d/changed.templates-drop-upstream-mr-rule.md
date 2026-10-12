- Project templates (`project-CLAUDE.md`, `project-AGENTS.md`,
  `project-copilot-instructions.md`, `project-ai-workflows.md`) — the
  "Shared Workflow Assets Land via MR" rule no longer lands in every synced
  project. The generated `CLAUDE.md`, `AGENTS.md` and Copilot adapter each get
  3,929 bytes smaller (`AI-WORKFLOWS.md` 3,873). One line in the shared-assets
  section now says the `upstream-rules` skill shares a change and carries the
  MR rule. The next project sync removes the old section, because sync
  overwrites those four files.
- `scripts/validate-skills.mjs` — fails when a project template carries the
  `upstream-mr` fragment again, the same way it already did for `CLAUDE.md`.
- `skills/service-cli/references/glab.md` — points at
  `skills/upstream-rules/references/upstream-mr.md` for the MR rule instead of
  a `CLAUDE.md` section that synced projects no longer carry.
