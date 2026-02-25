#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

SRC_COMMANDS="$ROOT_DIR/commands"
SRC_RULES="$ROOT_DIR/rules"
SRC_SKILLS="$ROOT_DIR/skills"

TARGET_CURSOR="$HOME/.cursor"
TARGET_CURSOR_BUSINESS="$HOME/.cursor-business"
TARGET_ROO="$HOME/.roo"
TARGET_CODEX="$HOME/.codex"

ensure_dir() {
  local dir="$1"
  mkdir -p "$dir"
}

sync_dir() {
  local src="$1"
  local dest="$2"
  ensure_dir "$dest"
  rsync -av --delete "$src/" "$dest/"
}

echo "Syncing ai-workflows from: $ROOT_DIR"

if [[ -d "$SRC_COMMANDS" ]]; then
  if [[ -d "$TARGET_CURSOR" ]]; then
    sync_dir "$SRC_COMMANDS" "$TARGET_CURSOR/commands"
  fi

  if [[ -d "$TARGET_CURSOR_BUSINESS" ]]; then
    sync_dir "$SRC_COMMANDS" "$TARGET_CURSOR_BUSINESS/commands"
  fi
fi

if [[ -d "$SRC_RULES" && -d "$TARGET_ROO" ]]; then
  sync_dir "$SRC_RULES" "$TARGET_ROO/rules-code"
fi

# Codex: never touch system skills; sync only custom skills if present.
if [[ -d "$SRC_SKILLS" && -d "$TARGET_CODEX/skills" ]]; then
  ensure_dir "$TARGET_CODEX/skills/custom"
  sync_dir "$SRC_SKILLS" "$TARGET_CODEX/skills/custom"
fi

echo "Sync complete."
