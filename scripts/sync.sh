#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

SRC_COMMANDS="$ROOT_DIR/commands"
SRC_RULES="$ROOT_DIR/rules"
SRC_SKILLS="$ROOT_DIR/skills"
SRC_PACKAGES="$ROOT_DIR/packages"
SRC_MCP="$ROOT_DIR/mcp"
SRC_SHARED="$ROOT_DIR/shared"
SRC_TEMPLATES="$ROOT_DIR/templates"
SRC_AI_WORKFLOWS_TEMPLATE="$ROOT_DIR/templates/project-ai-workflows.md"
SRC_CLAUDE_MD="$ROOT_DIR/CLAUDE.md"

TARGET_CURSOR="$HOME/.cursor"
TARGET_ROO="$HOME/.roo"
TARGET_CODEX="$HOME/.codex"
TARGET_CLAUDE="$HOME/.claude"
TARGET_CURSOR_SKILLS_SUBPATH="skills-cursor/ai-workflows"
TARGET_CURSOR_MCP_SUBPATH="mcp/ai-workflows"

DRY_RUN=0
PROJECT_DIR=""
INCLUDE_EXPERIMENTAL=0

usage() {
  cat << 'EOF_USAGE'
Usage: ./scripts/sync.sh [--dry-run] [--project <path>] [--include-experimental]

Modes:
  (no flags)          Sync to global agent folders (~/.cursor, ~/.claude, etc.)
  --project <path>    Sync project-level ai-workflows files into a project

Project sync copies:
  AI-WORKFLOWS.md                   (developer guide for tool loading behavior)
  CLAUDE.md / AGENTS.md             (thin adapters for Claude, Codex, Cursor)
  .github/copilot-instructions.md   (Copilot adapter with conventions inlined)
  .cursor/rules/conventions.mdc     (Cursor conventions adapter)
  rules/ and commands/              (shared baseline rules and runbooks)
  .github/prompts/*.prompt.md       (attachable via #file: in Copilot chat)

Package selection:
  When the project root contains .ai-workflows.yaml with a `packages:` list
  (see packages/selection.md), only the rules and commands included by the
  selected packages (plus their `requires:` dependencies) are synced; files
  belonging to deselected packages are removed and adapter references to them
  are filtered out. Without a manifest, everything is synced (legacy mode).

Options:
  --dry-run                Show what would be synced without writing
  --include-experimental   Include experimental.* commands and skills
  -h, --help               Show this help message
EOF_USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --include-experimental)
      INCLUDE_EXPERIMENTAL=1
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
  if [[ "$INCLUDE_EXPERIMENTAL" -eq 0 ]]; then
    cmd+=(--exclude='experimental.*')
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
  if [[ "$INCLUDE_EXPERIMENTAL" -eq 0 ]]; then
    cmd+=(--exclude='experimental.*')
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

remove_file() {
  local target="$1"
  if [[ ! -e "$target" ]]; then
    return
  fi
  if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "[dry-run] rm $target"
  else
    rm -f "$target"
    echo "Removed $target"
  fi
}

# --- Package selection (project sync) ---

manifest_packages() {
  # Print package names listed under the top-level `packages:` key in $1
  awk '
    /^packages:[[:space:]]*$/ { in_list = 1; next }
    /^[^[:space:]]/ { in_list = 0 }
    in_list && /^[[:space:]]*-[[:space:]]*/ {
      line = $0
      sub(/^[[:space:]]*-[[:space:]]*/, "", line)
      sub(/[[:space:]]*(#.*)?$/, "", line)
      if (line != "") print line
    }
  ' "$1"
}

pkg_yaml_requires() {
  # Print entries of the top-level `requires:` list in package.yaml $1
  awk '
    /^requires:[[:space:]]*$/ { in_list = 1; next }
    /^[^[:space:]]/ { in_list = 0 }
    in_list && /^[[:space:]]*-[[:space:]]*/ {
      line = $0
      sub(/^[[:space:]]*-[[:space:]]*/, "", line)
      sub(/[[:space:]]*$/, "", line)
      if (line != "") print line
    }
  ' "$1"
}

pkg_yaml_includes() {
  # Print entries of the includes.<kind> list in package.yaml $1 ($2 = kind)
  awk -v kind="$2:" '
    /^includes:[[:space:]]*$/ { in_inc = 1; next }
    /^[^[:space:]]/ { in_inc = 0; in_kind = 0 }
    in_inc && in_kind && /^[[:space:]]*-[[:space:]]*/ {
      line = $0
      sub(/^[[:space:]]*-[[:space:]]*/, "", line)
      sub(/[[:space:]]*$/, "", line)
      if (line != "") print line
      next
    }
    in_inc && $1 == kind { in_kind = 1; next }
    in_inc && /^[[:space:]]+[A-Za-z_]+:/ { in_kind = 0 }
  ' "$1"
}

resolve_selected_packages() {
  # $1 = space-separated requested package names.
  # Echoes the transitively resolved set (requires: followed), space-separated.
  local pending="$1"
  local resolved=""
  local changed=1
  local pkg dep yaml
  while [[ "$changed" -eq 1 ]]; do
    changed=0
    for pkg in $pending; do
      case " $resolved " in *" $pkg "*) continue ;; esac
      yaml="$SRC_PACKAGES/$pkg/package.yaml"
      if [[ ! -f "$yaml" ]]; then
        echo "Error: unknown package '$pkg' in .ai-workflows.yaml (expected $yaml)" >&2
        exit 1
      fi
      resolved="$resolved $pkg"
      changed=1
      for dep in $(pkg_yaml_requires "$yaml"); do
        pending="$pending $dep"
      done
    done
  done
  echo "${resolved# }"
}

sync_selected_tree() {
  # $1 = tree name (rules|commands), $2 = newline-separated allowed repo-relative paths.
  # Copies the allowed files into the project and prunes everything else in the tree.
  local tree="$1"
  local allowed="$2"
  local effective=""
  local path base existing rel

  while IFS= read -r path; do
    [[ -z "$path" ]] && continue
    case "$path" in "$tree"/*) ;; *) continue ;; esac
    base="$(basename "$path")"
    if [[ "$INCLUDE_EXPERIMENTAL" -eq 0 && "$base" == experimental.* ]]; then
      continue
    fi
    if [[ ! -f "$ROOT_DIR/$path" ]]; then
      echo "  [warn] selected package lists missing file: $path" >&2
      continue
    fi
    effective="$effective
$path"
  done <<< "$allowed"

  while IFS= read -r path; do
    [[ -z "$path" ]] && continue
    sync_file "$ROOT_DIR/$path" "$PROJECT_DIR/$path"
  done <<< "$effective"

  if [[ -d "$PROJECT_DIR/$tree" ]]; then
    while IFS= read -r existing; do
      rel="${existing#$PROJECT_DIR/}"
      if ! printf '%s\n' "$effective" | grep -qxF "$rel"; then
        remove_file "$existing"
      fi
    done < <(find "$PROJECT_DIR/$tree" -type f)
    if [[ "$DRY_RUN" -eq 0 ]]; then
      find "$PROJECT_DIR/$tree" -type d -empty -delete 2>/dev/null || true
    fi
  fi
}

filter_deselected_rule_refs() {
  # Remove lines that reference deselected rules files from generated adapter $1,
  # so adapters never point at rules that are not synced into the project.
  local target="$1"
  [[ -f "$target" ]] || return 0
  [[ -n "${DESELECTED_RULES//[[:space:]]/}" ]] || return 0
  local tmp="${target}.tmp"
  local rel
  cp "$target" "$tmp"
  while IFS= read -r rel; do
    [[ -z "$rel" ]] && continue
    grep -vF "$rel" "$tmp" > "${tmp}.filtered" || true
    mv "${tmp}.filtered" "$tmp"
  done <<< "$DESELECTED_RULES"
  mv "$tmp" "$target"
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

  # Resolve package selection from .ai-workflows.yaml (see packages/selection.md)
  MANIFEST_FILE="$PROJECT_DIR/.ai-workflows.yaml"
  SELECTION_ACTIVE=0
  SELECTED_PACKAGES=""
  ALLOWED_RULES=""
  ALLOWED_COMMANDS=""
  DESELECTED_RULES=""
  if [[ -f "$MANIFEST_FILE" ]]; then
    REQUESTED_PACKAGES="$(manifest_packages "$MANIFEST_FILE" | tr '\n' ' ')"
    if [[ -z "${REQUESTED_PACKAGES//[[:space:]]/}" ]]; then
      echo "Error: $MANIFEST_FILE exists but lists no packages under 'packages:'" >&2
      exit 1
    fi
    SELECTED_PACKAGES="$(resolve_selected_packages "$REQUESTED_PACKAGES")"
    for pkg in $SELECTED_PACKAGES; do
      pkg_yaml="$SRC_PACKAGES/$pkg/package.yaml"
      ALLOWED_RULES="$ALLOWED_RULES
$(pkg_yaml_includes "$pkg_yaml" rules)"
      ALLOWED_COMMANDS="$ALLOWED_COMMANDS
$(pkg_yaml_includes "$pkg_yaml" commands)"
    done
    while IFS= read -r rel; do
      if ! printf '%s\n' "$ALLOWED_RULES" | grep -qxF "$rel"; then
        DESELECTED_RULES="$DESELECTED_RULES
$rel"
      fi
    done < <(cd "$ROOT_DIR" && find rules -type f -name '*.md' | sort)
    SELECTION_ACTIVE=1
    echo "  [ok] package selection: $SELECTED_PACKAGES"
  else
    echo "  [info] no .ai-workflows.yaml found — syncing all rules and commands"
  fi

  # Generate AI-WORKFLOWS.md from template
  if [[ -f "$SRC_AI_WORKFLOWS_TEMPLATE" ]]; then
    if [[ "$DRY_RUN" -eq 1 ]]; then
      echo "[dry-run] generate AI-WORKFLOWS.md from template"
    else
      cp "$SRC_AI_WORKFLOWS_TEMPLATE" "$PROJECT_DIR/AI-WORKFLOWS.md"
      for fragment in "$SRC_SHARED"/*.md; do
        marker_name="$(basename "$fragment" .md)"
        inject_shared "$PROJECT_DIR/AI-WORKFLOWS.md" "$marker_name"
      done
      echo "  [ok] AI-WORKFLOWS.md (developer guide)"
    fi
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
      echo "  [ok] .github/copilot-instructions.md (CONVENTIONS.md + core rules inlined)"
    fi
  fi

  # Filter references to deselected rules out of the generated adapters
  if [[ "$SELECTION_ACTIVE" -eq 1 && "$DRY_RUN" -eq 0 ]]; then
    filter_deselected_rule_refs "$PROJECT_DIR/AI-WORKFLOWS.md"
    filter_deselected_rule_refs "$PROJECT_DIR/CLAUDE.md"
    filter_deselected_rule_refs "$PROJECT_DIR/AGENTS.md"
    filter_deselected_rule_refs "$PROJECT_DIR/.github/copilot-instructions.md"
    echo "  [ok] adapters filtered for deselected rules"
  fi

  # Sync rules/ to project root (single copy, all tools reference it)
  if [[ -d "$SRC_RULES" ]]; then
    if [[ "$SELECTION_ACTIVE" -eq 1 ]]; then
      sync_selected_tree "rules" "$ALLOWED_RULES"
      echo "  [ok] rules/ (selected packages only)"
    elif [[ "$DRY_RUN" -eq 1 ]]; then
      echo "[dry-run] sync rules -> rules/"
    else
      sync_dir "$SRC_RULES" "$PROJECT_DIR/rules"
      echo "  [ok] rules/ (shared rules directory)"
    fi
  fi

  # Generate Cursor conventions adapter pointing to rules/ and CONVENTIONS.md
  if [[ -f "$SRC_TEMPLATES/project-cursor-conventions.mdc" ]]; then
    if [[ "$DRY_RUN" -eq 1 ]]; then
      echo "[dry-run] generate .cursor/rules/conventions.mdc"
    else
      ensure_dir "$PROJECT_DIR/.cursor/rules"
      cp "$SRC_TEMPLATES/project-cursor-conventions.mdc" "$PROJECT_DIR/.cursor/rules/conventions.mdc"
      echo "  [ok] .cursor/rules/conventions.mdc"
    fi
  fi

  # Sync commands/ to project root (single copy, all tools reference it)
  if [[ -d "$SRC_COMMANDS" ]]; then
    if [[ "$SELECTION_ACTIVE" -eq 1 ]]; then
      sync_selected_tree "commands" "$ALLOWED_COMMANDS"
      echo "  [ok] commands/ (selected packages only)"
    elif [[ "$DRY_RUN" -eq 1 ]]; then
      echo "[dry-run] sync commands -> commands/"
    else
      sync_dir "$SRC_COMMANDS" "$PROJECT_DIR/commands"
      echo "  [ok] commands/ (shared command runbooks)"
    fi
  fi

  # Generate .github/prompts/ from commands/ (Copilot needs frontmatter)
  if [[ -d "$SRC_COMMANDS" ]]; then
    ensure_dir "$PROJECT_DIR/.github/prompts"
    if [[ "$DRY_RUN" -eq 1 ]]; then
      echo "[dry-run] generate .github/prompts/ from commands/"
    else
      # Remove existing generated prompts
      rm -f "$PROJECT_DIR/.github/prompts/"*.prompt.md
      for cmd_file in "$PROJECT_DIR/commands/"*.md; do
        [[ -f "$cmd_file" ]] || continue
        _basename="$(basename "$cmd_file" .md)"
        # Skip experimental files
        if [[ "$INCLUDE_EXPERIMENTAL" -eq 0 && "$_basename" == experimental.* ]]; then
          continue
        fi
        # Extract title from first heading
        _title="$(head -1 "$cmd_file" | sed 's/^# //')"
        _prompt_file="$PROJECT_DIR/.github/prompts/${_basename}.prompt.md"
        {
          echo "---"
          echo "name: ${_basename}"
          echo "description: \"${_title}\""
          echo "---"
          echo ""
          cat "$cmd_file"
        } > "$_prompt_file"
      done
      echo "  [ok] .github/prompts/ (generated from commands/)"
    fi
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
    sync_file "$SRC_RULES/communication.md" "$TARGET_CLAUDE/rules/communication.md"
    sync_file "$SRC_RULES/project.md" "$TARGET_CLAUDE/rules/project.md"
    sync_file "$SRC_RULES/clean-architecture.md" "$TARGET_CLAUDE/rules/clean-architecture.md"

    remove_file "$TARGET_CLAUDE/rules/rules.md"
    remove_file "$TARGET_CLAUDE/rules/tailwind.md"
    remove_file "$TARGET_CLAUDE/rules/testing.md"
    remove_file "$TARGET_CLAUDE/rules/accessibility.md"
    remove_file "$TARGET_CLAUDE/rules/backlog.md"
    remove_file "$TARGET_CLAUDE/rules/stacks/nextjs-payload.md"
    remove_file "$TARGET_CLAUDE/rules/stacks/react-native-expo.md"
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
