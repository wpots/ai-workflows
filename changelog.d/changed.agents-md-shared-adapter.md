- One project adapter for every agent: the `AGENTS.md` that sync and
  `setup-ai-workflows` write now carries the full adapter, including the
  mandatory load triggers and the `rules/project.md` line that only the Claude
  copy had, and the project `CLAUDE.md` shrinks to an `@AGENTS.md` import plus
  the Claude-specific lines. Claude Code reads a `CLAUDE.md` in place of an
  `AGENTS.md`, so the import gives Claude the same instructions as Codex
  without loading them twice. The six-row skill table in `AGENTS.md` is gone:
  each skill's description carries its triggers. The validator now requires
  the import and keeps shared fragments out of the `CLAUDE.md` template.
  The project `CLAUDE.md` also imports `CONVENTIONS.md`, so Claude has the
  project's conventions from the start of every session instead of only
  when it decides to open the file; Codex keeps the instruction in words,
  because it does not expand imports.
  Synced projects pick this up with their next sync.
