#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

SRC_COMMANDS="$ROOT_DIR/commands"
SRC_RULES="$ROOT_DIR/rules"
SRC_SKILLS="$ROOT_DIR/skills"
SRC_MCP="$ROOT_DIR/mcp"
SRC_SHARED="$ROOT_DIR/shared"
SRC_TEMPLATES="$ROOT_DIR/templates"
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

# --- Shared fragment injection (reused from generate-adapters pattern) ---

inject_shared() {
  local target="$1"
  local marker_name="$2"
  local fragment_file="$SRC_SHARED/${marker_name}.md"

  if [[ ! -f "$fragment_file" ]]; then
    return
  fi

  local begin_marker="<!-- BEGIN SHARED:${marker_name} -->"
  local end_marker="<!-- END SHARED:${marker_name} -->"
  local tmp="${target}.tmp"
  local in_block=0
  local found=0

  while IFS= read -r line || [[ -n "$line" ]]; do
    if [[ "$line" == "$begin_marker" ]]; then
      echo "$line"
      cat "$fragment_file"
      in_block=1
      found=1
      continue
    fi
    if [[ "$line" == "$end_marker" ]]; then
      in_block=0
      echo "$line"
      continue
    fi
    if [[ "$in_block" -eq 0 ]]; then
      echo "$line"
    fi
  done < "$target" > "$tmp"

  if [[ "$found" -eq 0 ]]; then
    rm -f "$tmp"
    return
  fi

  mv "$tmp" "$target"
}

inject_conventions() {
  local target="$1"
  local conventions_file="$2"

  local begin_marker="<!-- BEGIN CONVENTIONS -->"
  local end_marker="<!-- END CONVENTIONS -->"
  local tmp="${target}.tmp"
  local in_block=0
  local found=0

  while IFS= read -r line || [[ -n "$line" ]]; do
    if [[ "$line" == "$begin_marker" ]]; then
      echo "$line"
      if [[ -f "$conventions_file" ]]; then
        cat "$conventions_file"
      else
        echo "No CONVENTIONS.md found. Run init-project to generate one."
      fi
      in_block=1
      found=1
      continue
    fi
    if [[ "$line" == "$end_marker" ]]; then
      in_block=0
      echo "$line"
      continue
    fi
    if [[ "$in_block" -eq 0 ]]; then
      echo "$line"
    fi
  done < "$target" > "$tmp"

  if [[ "$found" -eq 0 ]]; then
    rm -f "$tmp"
    return
  fi

  mv "$tmp" "$target"
}

# --- Project sync mode ---
if [[ -n "$PROJECT_DIR" ]]; then
  echo "Syncing ai-workflows into project: $PROJECT_DIR (dry-run=$DRY_RUN)"

  CONVENTIONS_FILE="$PROJECT_DIR/CONVENTIONS.md"

  # Check for CONVENTIONS.md — never overwrite, just warn if missing
  if [[ -f "$CONVENTIONS_FILE" ]]; then
    echo "  [ok] CONVENTIONS.md exists (preserved — project-owned)"
  else
    echo "  [warn] No CONVENTIONS.md found. Run init-project to generate one."
  fi

  # Generate CLAUDE.md from template
  if [[ -f "$SRC_TEMPLATES/project-CLAUDE.md" ]]; then
    if [[ "$DRY_RUN" -eq 1 ]]; then
      echo "[dry-run] generate CLAUDE.md from template"
    else
      cp "$SRC_TEMPLATES/project-CLAUDE.md" "$PROJECT_DIR/CLAUDE.md"
      for fragment in "$SRC_SHARED"/*.md; do
        marker_name="$(basename "$fragment" .md)"
        inject_shared "$PROJECT_DIR/CLAUDE.md" "$marker_name"
      done
      echo "  [ok] CLAUDE.md (thin adapter)"
    fi
  fi

  # Generate AGENTS.md from template
  if [[ -f "$SRC_TEMPLATES/project-AGENTS.md" ]]; then
    if [[ "$DRY_RUN" -eq 1 ]]; then
      echo "[dry-run] generate AGENTS.md from template"
    else
      cp "$SRC_TEMPLATES/project-AGENTS.md" "$PROJECT_DIR/AGENTS.md"
      for fragment in "$SRC_SHARED"/*.md; do
        marker_name="$(basename "$fragment" .md)"
        inject_shared "$PROJECT_DIR/AGENTS.md" "$marker_name"
      done
      echo "  [ok] AGENTS.md (thin adapter)"
    fi
  fi

  # Generate copilot-instructions.md from template with CONVENTIONS.md inlined
  if [[ -f "$SRC_TEMPLATES/project-copilot-instructions.md" ]]; then
    if [[ "$DRY_RUN" -eq 1 ]]; then
      echo "[dry-run] generate .github/copilot-instructions.md from template"
    else
      ensure_dir "$PROJECT_DIR/.github"
      cp "$SRC_TEMPLATES/project-copilot-instructions.md" "$PROJECT_DIR/.github/copilot-instructions.md"
      inject_conventions "$PROJECT_DIR/.github/copilot-instructions.md" "$CONVENTIONS_FILE"
      for fragment in "$SRC_SHARED"/*.md; do
        marker_name="$(basename "$fragment" .md)"
        inject_shared "$PROJECT_DIR/.github/copilot-instructions.md" "$marker_name"
      done
      echo "  [ok] .github/copilot-instructions.md (CONVENTIONS.md inlined)"
    fi
  fi

  # Generate Cursor conventions adapter if .cursor/ exists
  if [[ -d "$PROJECT_DIR/.cursor" && -f "$SRC_TEMPLATES/project-cursor-conventions.mdc" ]]; then
    if [[ "$DRY_RUN" -eq 1 ]]; then
      echo "[dry-run] generate .cursor/rules/conventions.mdc"
    else
      ensure_dir "$PROJECT_DIR/.cursor/rules"
      cp "$SRC_TEMPLATES/project-cursor-conventions.mdc" "$PROJECT_DIR/.cursor/rules/conventions.mdc"
      echo "  [ok] .cursor/rules/conventions.mdc"
    fi
  fi

  # Sync prompt files
  if [[ -d "$SRC_PROMPTS" ]]; then
    sync_dir_merge "$SRC_PROMPTS" "$PROJECT_DIR/.github/prompts"
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
