---
name: compact-sprint
description: Compact old sprint documentation — flag durable decisions from delivered BLIs as docs/todo/ follow-ups, rewrite the sprint changelog to the compact template, and remove the sprint folder behind a git-tag archive anchor. Never touches the current or previous sprint. Support-mode archives (docs/support-<yyyy>-<mm>/) compact the same way with a month-based retention guard. Use when the user asks to compact sprints or support months, prune or clean up old sprint or support folders, or reduce sprint documentation noise ("sprint compacten", "oude sprints opruimen").
---

# Compact Sprint Skill

Use this skill when the user asks to compact, prune, or clean up old sprint
documentation.

The canonical step-by-step runbook lives at `commands/compact-sprint.md`. This
skill is a thin wrapper around that runbook so Codex, Cursor, and Claude Code
share the same workflow; Copilot follows the runbook directly.

## Workflow

1. Read `commands/compact-sprint.md` (project root, or the synced `commands/`
   dir).
2. Follow every phase in order: preconditions (retention guard), flag-only
   harvest, link sweep, changelog rewrite, folder removal, review pause and
   handover.
3. The compact changelog template lives in `commands/close-sprint.md` under
   "Changelog template" — close-sprint writes new changelogs from it,
   compact-sprint rewrites old ones to it.

## Constraints

- **Retention guard:** only sprints older than the previous one (≤ N-2) are
  eligible; refuse the current and previous sprint. In support mode the guard
  counts calendar months: refuse the current and previous month.
- Harvest is **flag-only**: durable decisions become `docs/todo/` items with a
  source recipe; nothing moves into specs/conventions/rules in this run.
- Never run `git commit`, `git tag`, or `git push` — hand the user the exact
  commands. The archive tag must land on the pre-compaction commit, so the tag
  command comes before the commit in the handover.
- The issue tracker is not touched; delivery verification already happened at
  sprint close. A sprint without a changelog is not compactable — run
  `close-sprint` first.

## Output

Per compacted sprint: `docs/todo/harvest-sprint-<M>-*.md` flags, a rewritten
compact `docs/sprint-<M>-changelog.md` (including an `## Archief` retrieval
section), the removed `docs/sprint-<M>/` folder and `docs/sprint-<M>-gaps.md`,
plus any working documents an older close left behind — all in one reviewable
diff — plus the tag and push commands for the user.
