#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

SRC_COMMANDS="$ROOT_DIR/commands"
SRC_RULES="$ROOT_DIR/rules"
SRC_SKILLS="$ROOT_DIR/skills"
SRC_SHARED="$ROOT_DIR/shared"
SRC_TEMPLATES="$ROOT_DIR/templates"
SRC_AI_WORKFLOWS_TEMPLATE="$ROOT_DIR/templates/project-ai-workflows.md"
SRC_CLAUDE_SETTINGS="$ROOT_DIR/templates/project-claude-settings.json"
SRC_VERIFY_SKILL="$ROOT_DIR/templates/project-verify-SKILL.md"
SRC_FRESHNESS="$ROOT_DIR/scripts/project-sync-freshness.sh"

TARGET_CODEX="$HOME/.codex"
TARGET_CLAUDE="$HOME/.claude"

DRY_RUN=0
PROJECT_DIR=""

usage() {
  cat << 'EOF_USAGE'
Usage: ./scripts/sync.sh [--dry-run] [--project <path>]

Modes:
  (no flags)          Sync to global agent folders (~/.claude, ~/.codex)
  --project <path>    Sync project-level ai-workflows files into a project

Project sync copies:
  AI-WORKFLOWS.md                   (developer guide for tool loading behavior)
  CLAUDE.md / AGENTS.md             (thin adapters for Claude and Codex)
  rules/ and commands/              (shared baseline rules and runbooks;
                                     rules/payload.md and the pointers to it
                                     only when package.json depends on Payload)
  .claude/skills/verify/SKILL.md    (pre-commit verification; only when missing)
  .gitignore                        (appends .playwright-mcp/ once; rest untouched)

Options:
  --dry-run     Show what would be synced without writing
  -h, --help    Show this help message
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
  shift 2
  ensure_dir "$dest"
  local -a cmd=(rsync -av --delete "$@")
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

remove_dir() {
  local target="$1"
  if [[ ! -d "$target" ]]; then
    return
  fi
  if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "[dry-run] rm -r $target"
  else
    rm -rf "$target"
    echo "Removed $target"
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

# A project uses Payload when package.json depends on `payload` or any
# `@payloadcms/*` package. Without it, rules/payload.md and the lines marked
# payload-only are noise, so project sync leaves them out.
project_uses_payload() {
  local package_json="$1/package.json"
  [[ -f "$package_json" ]] || return 1
  grep -Eq '"(payload|@payloadcms/[^"]+)"[[:space:]]*:' "$package_json"
}

# A Payload-only line in a template or rules/rules.md ends in this marker, so
# the optional part is visible to whoever edits the source. Keep a marked entry
# on one line: a wrapped continuation would stay behind.
PAYLOAD_ONLY_MARKER="<!-- payload-only -->"

strip_payload_only_lines() {
  local target="$1"
  [[ -f "$target" ]] || return 0
  local status=0
  grep -vF "$PAYLOAD_ONLY_MARKER" "$target" > "${target}.tmp" || status=$?
  # Status 1 only means nothing was left to print; anything above is a read
  # error, and moving the partial output over the adapter would truncate it.
  if (( status > 1 )); then rm -f "${target}.tmp"; return "$status"; fi
  mv "${target}.tmp" "$target"
}

# --- Project sync mode ---
if [[ -n "$PROJECT_DIR" ]]; then
  echo "Syncing ai-workflows into project: $PROJECT_DIR (dry-run=$DRY_RUN)"

  CONVENTIONS_FILE="$PROJECT_DIR/CONVENTIONS.md"

  USES_PAYLOAD=0
  if project_uses_payload "$PROJECT_DIR"; then
    USES_PAYLOAD=1
  else
    echo "  [ok] no Payload dependency — skipping rules/payload.md and its pointers"
  fi

  # Check for CONVENTIONS.md — never overwrite, just warn if missing
  if [[ -f "$CONVENTIONS_FILE" ]]; then
    echo "  [ok] CONVENTIONS.md exists (preserved — project-owned)"
  else
    echo "  [warn] No CONVENTIONS.md found. Run setup-ai-workflows to generate one."
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
      echo "  [ok] CLAUDE.md (imports AGENTS.md)"
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
      echo "  [ok] AGENTS.md (shared adapter)"
    fi
  fi

  # Sync rules/ to project root (single copy, all tools reference it)
  if [[ -d "$SRC_RULES" ]]; then
    if [[ "$DRY_RUN" -eq 1 ]]; then
      echo "[dry-run] sync rules -> rules/"
    else
      rules_args=()
      if [[ "$USES_PAYLOAD" -eq 0 ]]; then
        # --delete-excluded also removes a payload.md an earlier sync left behind
        rules_args=(--exclude /payload.md --delete-excluded)
      fi
      sync_dir "$SRC_RULES" "$PROJECT_DIR/rules" ${rules_args[@]+"${rules_args[@]}"}
      echo "  [ok] rules/ (shared rules directory)"
    fi
  fi

  if [[ "$USES_PAYLOAD" -eq 0 && "$DRY_RUN" -eq 0 ]]; then
    for adapter in AI-WORKFLOWS.md AGENTS.md rules/rules.md; do
      strip_payload_only_lines "$PROJECT_DIR/$adapter"
    done
  fi

  # Sync commands/ to project root (single copy, all tools reference it)
  if [[ -d "$SRC_COMMANDS" ]]; then
    if [[ "$DRY_RUN" -eq 1 ]]; then
      echo "[dry-run] sync commands -> commands/"
    else
      sync_dir "$SRC_COMMANDS" "$PROJECT_DIR/commands"
      echo "  [ok] commands/ (shared command runbooks)"
    fi
  fi

  # Install graphify Claude hooks only when the project has no settings.json
  # yet (never clobber project-owned Claude settings; merge manually otherwise)
  if [[ -f "$SRC_CLAUDE_SETTINGS" ]]; then
    if [[ -f "$PROJECT_DIR/.claude/settings.json" ]]; then
      echo "  [ok] .claude/settings.json exists (preserved — merge graphify + sync-freshness hooks manually if needed)"
      # Older templates wrote the marketplace source as "url", which Claude Code
      # only accepts for a direct marketplace.json address — a git@ URL under it
      # fails with 'invalid url'. We never clobber project settings, so warn.
      if grep -q '"source": *"url"' "$PROJECT_DIR/.claude/settings.json"; then
        echo "  [warn] .claude/settings.json has a marketplace \"source\": \"url\" — change it to \"git\" (see README > Existing projects)"
      fi
    elif [[ "$DRY_RUN" -eq 1 ]]; then
      echo "[dry-run] write .claude/settings.json (graphify hooks)"
    else
      ensure_dir "$PROJECT_DIR/.claude"
      cp "$SRC_CLAUDE_SETTINGS" "$PROJECT_DIR/.claude/settings.json"
      echo "  [ok] .claude/settings.json (graphify hooks)"
    fi
  fi

  # Emit the verify skill only when the project has none: Claude Code runs a
  # project skill named `verify` before each commit (a plugin skill would not
  # count), and the project owns the file once it exists.
  if [[ -f "$SRC_VERIFY_SKILL" ]]; then
    if [[ -f "$PROJECT_DIR/.claude/skills/verify/SKILL.md" ]]; then
      echo "  [ok] .claude/skills/verify/SKILL.md exists (preserved — project-owned)"
    elif [[ "$DRY_RUN" -eq 1 ]]; then
      echo "[dry-run] write .claude/skills/verify/SKILL.md"
    else
      ensure_dir "$PROJECT_DIR/.claude/skills/verify"
      cp "$SRC_VERIFY_SKILL" "$PROJECT_DIR/.claude/skills/verify/SKILL.md"
      echo "  [ok] .claude/skills/verify/SKILL.md (pre-commit verification)"
    fi
  fi

  # Keep the Playwright MCP's default output folder out of git. The server
  # writes screenshots, console logs and page snapshots to .playwright-mcp/ in
  # the project on every navigation, and refuses paths outside the project and
  # that folder, so the verify skill leaves its screenshots there. Append once;
  # never rewrite the project's other lines.
  GITIGNORE_FILE="$PROJECT_DIR/.gitignore"
  if [[ -f "$GITIGNORE_FILE" ]] && grep -Eq '^/?\.playwright-mcp/?[[:space:]]*$' "$GITIGNORE_FILE"; then
    echo "  [ok] .gitignore already ignores .playwright-mcp/"
  elif [[ "$DRY_RUN" -eq 1 ]]; then
    echo "[dry-run] append .playwright-mcp/ to .gitignore"
  else
    if [[ -s "$GITIGNORE_FILE" && -n "$(tail -c 1 "$GITIGNORE_FILE")" ]]; then
      echo >> "$GITIGNORE_FILE"
    fi
    printf '%s\n' "# Playwright MCP output: screenshots, console logs, page snapshots (ai-workflows sync)" ".playwright-mcp/" >> "$GITIGNORE_FILE"
    echo "  [ok] .gitignore (appended .playwright-mcp/)"
  fi

  # Freshness stamp: a digest of the exact source set this run delivered, so
  # the SessionStart hook (and CI, slice 2/2) can tell current from stale.
  # Tracked in git on purpose -- drift belongs in review, not in a temp dir.
  if [[ -x "$SRC_FRESHNESS" ]]; then
    if [[ "$DRY_RUN" -eq 1 ]]; then
      echo "[dry-run] write .claude/ai-workflows-stamp"
    else
      ensure_dir "$PROJECT_DIR/.claude"
      "$SRC_FRESHNESS" --digest --source "$ROOT_DIR" > "$PROJECT_DIR/.claude/ai-workflows-stamp"
      echo "  [ok] .claude/ai-workflows-stamp (sync freshness digest — keep it tracked)"
    fi
  fi

  echo "Project sync complete: $PROJECT_DIR"
  exit 0
fi

# --- Global sync mode ---
echo "Syncing ai-workflows from: $ROOT_DIR (dry-run=$DRY_RUN)"

if [[ -d "$TARGET_CLAUDE" ]]; then
  # The ambient layer (CLAUDE.md + universal rules subset) is owned by
  # sync-ambient.sh, because the plugin's SessionStart hook delivers the same
  # files without waiting for a manual sync. One owner, no drift.
  ambient_args=(--source "$ROOT_DIR")
  [[ "$DRY_RUN" -eq 1 ]] && ambient_args+=(--dry-run)
  "$ROOT_DIR/scripts/sync-ambient.sh" "${ambient_args[@]}"

  # Claude skills and commands ship via the greenberry plugin (see
  # .claude-plugin/). Remove copies left behind by earlier syncs so they
  # cannot shadow or duplicate the plugin-provided versions. Only names
  # owned by this repo are touched; personal skills/commands are kept.
  if [[ -d "$SRC_COMMANDS" && -d "$TARGET_CLAUDE/commands" ]]; then
    for cmd_file in "$SRC_COMMANDS"/*.md; do
      [[ -f "$cmd_file" ]] || continue
      remove_file "$TARGET_CLAUDE/commands/$(basename "$cmd_file")"
    done
  fi

  if [[ -d "$SRC_SKILLS" && -d "$TARGET_CLAUDE/skills" ]]; then
    for skill_dir in "$SRC_SKILLS"/*/; do
      [[ -d "$skill_dir" ]] || continue
      remove_dir "$TARGET_CLAUDE/skills/$(basename "$skill_dir")"
    done
  fi

  echo "Claude skills/commands are served by the greenberry plugin (auto-updating),"
  echo "which also refreshes the ambient layer above at every session start."
  echo "If it is not installed yet, run inside Claude Code:"
  echo "  /plugin marketplace add git@gitlab.com:greenberrynl/config/ai-workflows.git"
fi

if [[ -d "$SRC_SKILLS" && -d "$TARGET_CODEX/skills" ]]; then
  ensure_dir "$TARGET_CODEX/skills/custom"
  sync_dir "$SRC_SKILLS" "$TARGET_CODEX/skills/custom"
fi

echo "Sync complete."
