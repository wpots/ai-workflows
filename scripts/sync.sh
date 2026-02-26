#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

SRC_COMMANDS="$ROOT_DIR/commands"
SRC_RULES="$ROOT_DIR/rules"
SRC_SKILLS="$ROOT_DIR/skills"
SRC_MCP="$ROOT_DIR/mcp"
SRC_CLAUDE_MD="$ROOT_DIR/CLAUDE.md"

TARGET_CURSOR="$HOME/.cursor"
TARGET_ROO="$HOME/.roo"
TARGET_CODEX="$HOME/.codex"
TARGET_CLAUDE="$HOME/.claude"
TARGET_CURSOR_SKILLS_SUBPATH="skills-cursor/ai-workflows"
TARGET_CURSOR_MCP_SUBPATH="mcp/ai-workflows"

DRY_RUN=0

usage() {
  cat << 'EOF_USAGE'
Usage: ./scripts/sync.sh [--dry-run]
EOF_USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

ensure_dir() {
  local dir="$1"
  mkdir -p "$dir"
}

sync_dir() {
  local src="$1"
  local dest="$2"
  ensure_dir "$dest"
  local -a cmd=(rsync -av --delete)
  if [[ "$DRY_RUN" -eq 1 ]]; then
    cmd+=(--dry-run)
  fi
  cmd+=("$src/" "$dest/")
  "${cmd[@]}"
}

echo "Syncing ai-workflows from: $ROOT_DIR (dry-run=$DRY_RUN)"

if [[ -d "$SRC_COMMANDS" && -d "$TARGET_CURSOR" ]]; then
  sync_dir "$SRC_COMMANDS" "$TARGET_CURSOR/commands"
fi

if [[ -d "$SRC_RULES" && -d "$TARGET_ROO" ]]; then
  sync_dir "$SRC_RULES" "$TARGET_ROO/rules-code"
fi

if [[ -d "$SRC_COMMANDS" && -d "$TARGET_ROO" ]]; then
  sync_dir "$SRC_COMMANDS" "$TARGET_ROO/commands"
fi

if [[ -d "$TARGET_CLAUDE" ]]; then
  if [[ -f "$SRC_CLAUDE_MD" ]]; then
    if [[ "$DRY_RUN" -eq 1 ]]; then
      echo "[dry-run] cp $SRC_CLAUDE_MD $TARGET_CLAUDE/CLAUDE.md"
    else
      cp "$SRC_CLAUDE_MD" "$TARGET_CLAUDE/CLAUDE.md"
      echo "Synced CLAUDE.md -> $TARGET_CLAUDE/CLAUDE.md"
    fi
  fi

  if [[ -d "$SRC_SKILLS" ]]; then
    ensure_dir "$TARGET_CLAUDE/skills"
    sync_dir "$SRC_SKILLS" "$TARGET_CLAUDE/skills"
  fi
fi

if [[ -d "$SRC_SKILLS" && -d "$TARGET_CURSOR" ]]; then
  sync_dir "$SRC_SKILLS" "$TARGET_CURSOR/$TARGET_CURSOR_SKILLS_SUBPATH"
fi

if [[ -d "$SRC_MCP" && -d "$TARGET_CURSOR" ]]; then
  sync_dir "$SRC_MCP" "$TARGET_CURSOR/$TARGET_CURSOR_MCP_SUBPATH"
fi

if [[ -d "$SRC_SKILLS" && -d "$TARGET_CODEX/skills" ]]; then
  ensure_dir "$TARGET_CODEX/skills/custom"
  sync_dir "$SRC_SKILLS" "$TARGET_CODEX/skills/custom"
fi

echo "Sync complete."
