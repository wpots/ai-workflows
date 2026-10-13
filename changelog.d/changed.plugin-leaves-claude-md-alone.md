- The plugin's `SessionStart` sync no longer writes `~/.claude/CLAUDE.md`: the
  baseline (this repo's `CLAUDE.md`) now lands as
  `~/.claude/rules/ai-workflows.md`, next to the universal rules, so
  `~/.claude/CLAUDE.md` stays the developer's own. A copy an earlier version
  wrote there is handled once: removed when nobody edited it, otherwise moved to
  `~/.claude/CLAUDE.md.ai-workflows-backup`, and the session says which. A file
  without the baseline's opening line is never touched. `./scripts/sync.sh`
  behaves the same, and the docs, `improve-skill` and the smoke tests follow.
