#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

SRC_COMMANDS="$ROOT_DIR/commands"
SRC_RULES="$ROOT_DIR/rules"
SRC_SKILLS="$ROOT_DIR/skills"
SRC_MCP="$ROOT_DIR/mcp"
SRC_CLAUDE_MD="$ROOT_DIR/CLAUDE.md"

TARGET_CURSOR="$HOME/.cursor"
TARGET_CURSOR_BUSINESS="$HOME/.cursor-business"
TARGET_ROO="$HOME/.roo"
TARGET_CODEX="$HOME/.codex"
TARGET_CLAUDE="$HOME/.claude"
TARGET_CURSOR_SKILLS_SUBPATH="skills-cursor/ai-workflows"
TARGET_CURSOR_MCP_SUBPATH="mcp/ai-workflows"

PROFILE="all"
DRY_RUN=0

usage() {
  cat << 'EOF_USAGE'
Usage: ./scripts/sync.sh [--profile all|personal|work] [--dry-run]

Profiles:
  all       Sync everything (default)
  personal  Sync .cursor, .roo, .codex
  work      Sync .cursor-business only
EOF_USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --profile)
      PROFILE="${2:-}"
      shift 2
      ;;
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

if [[ "$PROFILE" != "all" && "$PROFILE" != "personal" && "$PROFILE" != "work" ]]; then
  echo "Invalid profile: $PROFILE" >&2
  usage
  exit 1
fi

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

echo "Syncing ai-workflows from: $ROOT_DIR (profile=$PROFILE, dry-run=$DRY_RUN)"

if [[ -d "$SRC_COMMANDS" && ( "$PROFILE" == "all" || "$PROFILE" == "personal" ) ]]; then
  if [[ -d "$TARGET_CURSOR" ]]; then
    sync_dir "$SRC_COMMANDS" "$TARGET_CURSOR/commands"
  fi
fi

if [[ -d "$SRC_COMMANDS" && ( "$PROFILE" == "all" || "$PROFILE" == "work" ) ]]; then
  if [[ -d "$TARGET_CURSOR_BUSINESS" ]]; then
    sync_dir "$SRC_COMMANDS" "$TARGET_CURSOR_BUSINESS/commands"
  fi
fi

if [[ -d "$SRC_RULES" && -d "$TARGET_ROO" && ( "$PROFILE" == "all" || "$PROFILE" == "personal" ) ]]; then
  sync_dir "$SRC_RULES" "$TARGET_ROO/rules-code"
fi

# Roo: sync commands alongside rules so runbooks are available.
if [[ -d "$SRC_COMMANDS" && -d "$TARGET_ROO" && ( "$PROFILE" == "all" || "$PROFILE" == "personal" ) ]]; then
  sync_dir "$SRC_COMMANDS" "$TARGET_ROO/commands"
fi

# Claude Code CLI: copy CLAUDE.md to ~/.claude/CLAUDE.md.
if [[ -f "$SRC_CLAUDE_MD" && ( "$PROFILE" == "all" || "$PROFILE" == "personal" ) ]]; then
  if [[ -d "$TARGET_CLAUDE" ]]; then
    if [[ "$DRY_RUN" -eq 1 ]]; then
      echo "[dry-run] cp $SRC_CLAUDE_MD $TARGET_CLAUDE/CLAUDE.md"
    else
      cp "$SRC_CLAUDE_MD" "$TARGET_CLAUDE/CLAUDE.md"
      echo "Synced CLAUDE.md -> $TARGET_CLAUDE/CLAUDE.md"
    fi
  fi
fi

# Cursor: sync custom skills into a namespaced folder to avoid clobbering
# any existing skills in the root skills-cursor directory.
if [[ -d "$SRC_SKILLS" && ( "$PROFILE" == "all" || "$PROFILE" == "personal" ) ]]; then
  if [[ -d "$TARGET_CURSOR" ]]; then
    sync_dir "$SRC_SKILLS" "$TARGET_CURSOR/$TARGET_CURSOR_SKILLS_SUBPATH"
  fi
fi

if [[ -d "$SRC_SKILLS" && ( "$PROFILE" == "all" || "$PROFILE" == "work" ) ]]; then
  if [[ -d "$TARGET_CURSOR_BUSINESS" ]]; then
    sync_dir "$SRC_SKILLS" "$TARGET_CURSOR_BUSINESS/$TARGET_CURSOR_SKILLS_SUBPATH"
  fi
fi

# Cursor MCP definitions: sync into a namespaced folder. Users can merge
# these definitions into the active mcp.json as needed.
if [[ -d "$SRC_MCP" && ( "$PROFILE" == "all" || "$PROFILE" == "personal" ) ]]; then
  if [[ -d "$TARGET_CURSOR" ]]; then
    sync_dir "$SRC_MCP" "$TARGET_CURSOR/$TARGET_CURSOR_MCP_SUBPATH"
  fi
fi

if [[ -d "$SRC_MCP" && ( "$PROFILE" == "all" || "$PROFILE" == "work" ) ]]; then
  if [[ -d "$TARGET_CURSOR_BUSINESS" ]]; then
    sync_dir "$SRC_MCP" "$TARGET_CURSOR_BUSINESS/$TARGET_CURSOR_MCP_SUBPATH"
  fi
fi

# Codex: never touch system skills; sync only custom skills if present.
if [[ -d "$SRC_SKILLS" && -d "$TARGET_CODEX/skills" && ( "$PROFILE" == "all" || "$PROFILE" == "personal" ) ]]; then
  ensure_dir "$TARGET_CODEX/skills/custom"
  sync_dir "$SRC_SKILLS" "$TARGET_CODEX/skills/custom"
fi

echo "Sync complete."
