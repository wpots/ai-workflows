#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

SRC_COMMANDS="$ROOT_DIR/commands"
SRC_RULES="$ROOT_DIR/rules"
SRC_SKILLS="$ROOT_DIR/skills"
SRC_MCP="$ROOT_DIR/mcp"
SRC_PROMPTS="$ROOT_DIR/.github/prompts"
SRC_CLAUDE_MD="$ROOT_DIR/CLAUDE.md"
SRC_COPILOT_MD="$ROOT_DIR/.github/copilot-instructions.md"
SRC_AGENTS_MD="$ROOT_DIR/AGENTS.md"

TARGET_CURSOR="$HOME/.cursor"
TARGET_ROO="$HOME/.roo"
TARGET_CODEX="$HOME/.codex"
TARGET_CLAUDE="$HOME/.claude"
TARGET_CURSOR_SKILLS_SUBPATH="skills-cursor/ai-workflows"
TARGET_CURSOR_MCP_SUBPATH="mcp/ai-workflows"
TARGET_CURSOR_PROMPTS_SUBPATH="prompts/ai-workflows"

DRY_RUN=0
PROJECT_DIR=""

usage() {
  cat << 'EOF_USAGE'
Usage: ./scripts/sync.sh [--dry-run] [--project <path>]

Modes:
  (no flags)          Sync to global agent folders (~/.cursor, ~/.claude, etc.)
  --project <path>    Sync Copilot instructions and prompt files into a project

Project sync copies:
  .github/copilot-instructions.md   (auto-loaded by Copilot)
  .github/prompts/*.prompt.md       (attachable via #file: in Copilot chat)
  AGENTS.md                         (read by Cursor, Claude CLI, Codex)

Options:
  --dry-run           Show what would be synced without writing
  -h, --help          Show this help message
EOF_USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --project)
      if [[ -z "${2:-}" ]]; then
        echo "Error: --project requires a path argument" >&2
        usage
        exit 1
      fi
      PROJECT_DIR="$(cd "$2" 2>/dev/null && pwd)" || {
        echo "Error: directory does not exist: $2" >&2
        exit 1
      }
      shift 2
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

sync_dir_merge() {
  local src="$1"
  local dest="$2"
  ensure_dir "$dest"
  local -a cmd=(rsync -av)
  if [[ "$DRY_RUN" -eq 1 ]]; then
    cmd+=(--dry-run)
  fi
  cmd+=("$src/" "$dest/")
  "${cmd[@]}"
}

sync_file() {
  local src="$1"
  local dest="$2"
  ensure_dir "$(dirname "$dest")"
  if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "[dry-run] cp $src -> $dest"
  else
    cp "$src" "$dest"
    echo "Synced $src -> $dest"
  fi
}

# --- Project sync mode ---
if [[ -n "$PROJECT_DIR" ]]; then
  echo "Syncing ai-workflows into project: $PROJECT_DIR (dry-run=$DRY_RUN)"

  if [[ -f "$SRC_COPILOT_MD" ]]; then
    sync_file "$SRC_COPILOT_MD" "$PROJECT_DIR/.github/copilot-instructions.md"
  fi

  if [[ -d "$SRC_PROMPTS" ]]; then
    sync_dir_merge "$SRC_PROMPTS" "$PROJECT_DIR/.github/prompts"
  fi

  if [[ -f "$SRC_AGENTS_MD" ]]; then
    sync_file "$SRC_AGENTS_MD" "$PROJECT_DIR/AGENTS.md"
  fi

  echo "Project sync complete: $PROJECT_DIR"
  exit 0
fi

# --- Global sync mode ---
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

  if [[ -d "$SRC_COMMANDS" ]]; then
    sync_dir "$SRC_COMMANDS" "$TARGET_CLAUDE/commands"
  fi

  if [[ -d "$SRC_RULES" ]]; then
    ensure_dir "$TARGET_CLAUDE/rules"
    sync_dir "$SRC_RULES" "$TARGET_CLAUDE/rules"
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

if [[ -d "$SRC_PROMPTS" && -d "$TARGET_CURSOR" ]]; then
  sync_dir "$SRC_PROMPTS" "$TARGET_CURSOR/$TARGET_CURSOR_PROMPTS_SUBPATH"
fi

if [[ -d "$SRC_SKILLS" && -d "$TARGET_CODEX/skills" ]]; then
  ensure_dir "$TARGET_CODEX/skills/custom"
  sync_dir "$SRC_SKILLS" "$TARGET_CODEX/skills/custom"
fi

echo "Sync complete."
