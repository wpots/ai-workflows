#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

SHARED_DIR="$ROOT_DIR/shared"
COMMANDS_DIR="$ROOT_DIR/commands"

ADAPTER_FILES=(
  "$ROOT_DIR/AGENTS.md"
  "$ROOT_DIR/CLAUDE.md"
  "$ROOT_DIR/.github/copilot-instructions.md"
)

ERRORS=0

fail() {
  echo "ERROR: $1" >&2
  ERRORS=$((ERRORS + 1))
}

# ── Inject a shared fragment between markers ─────────────────────────────────

inject_shared() {
  local target="$1"
  local marker_name="$2"
  local fragment_file="$SHARED_DIR/${marker_name}.md"

  if [[ ! -f "$fragment_file" ]]; then
    fail "Missing shared fragment: $fragment_file"
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

  if ! mv "$tmp" "$target"; then
    rm -f "$tmp"
    fail "Could not write ${target#"$ROOT_DIR/"} (fragment: $marker_name)"
  fi
}

# ── Inject shared fragments into all adapter files ───────────────────────────

echo "Generating adapter files..."

for adapter in "${ADAPTER_FILES[@]}"; do
  if [[ ! -f "$adapter" ]]; then
    fail "Adapter file not found: $adapter"
    continue
  fi

  label="${adapter#"$ROOT_DIR/"}"

  for fragment in "$SHARED_DIR"/*.md; do
    marker_name="$(basename "$fragment" .md)"
    inject_shared "$adapter" "$marker_name"
  done

  echo "  [ok] $label"
done

# ── Generate .vscode/tasks.json from command mappings ────────────────────────
# This remains a generated convenience surface for local execution, not a
# primary project-model artifact like the adapters or project sync outputs.

echo "Generating .vscode/tasks.json..."

TASKS_FILE="$ROOT_DIR/.vscode/tasks.json"
MAPPINGS_FILE="$SHARED_DIR/command-mappings.md"

task_entries=()

while IFS= read -r line; do
  if [[ "$line" =~ commands/([a-z0-9_-]+)\.md ]]; then
    cmd="${BASH_REMATCH[1]}"
    task_entries+=("$cmd")
  fi
done < "$MAPPINGS_FILE"

# Generated content is built in a temp file and then copied into place, because
# `cp` reports a failed write and a redirection does not: bash 3.2 gives a
# compound command whose redirection failed an exit status of 0, so
# `{ … } > "$target"` can fail while the script prints [ok] and exits clean.
# That is how a stale generated file reaches CI while the local run looks green.
TASKS_TMP="$(mktemp)"

{
  printf '{\n'
  printf '  "version": "2.0.0",\n'
  printf '  "tasks": [\n'

  total=${#task_entries[@]}
  idx=0

  for cmd in "${task_entries[@]}"; do
    idx=$((idx + 1))
    printf '    {\n'
    printf '      "label": "%s",\n' "$cmd"
    printf '      "type": "shell",\n'
    printf '      "command": "cat commands/%s.md",\n' "$cmd"
    printf '      "presentation": {\n'
    printf '        "reveal": "always",\n'
    printf '        "panel": "shared"\n'
    printf '      },\n'
    printf '      "problemMatcher": []\n'
    printf '    },\n'
  done

  printf '    {\n'
  printf '      "label": "validate-ai-instructions",\n'
  printf '      "type": "shell",\n'
  printf '      "command": "./scripts/validate-ai-instructions.sh",\n'
  printf '      "presentation": {\n'
  printf '        "reveal": "always",\n'
  printf '        "panel": "shared"\n'
  printf '      },\n'
  printf '      "problemMatcher": []\n'
  printf '    }\n'

  printf '  ]\n'
  printf '}\n'
} > "$TASKS_TMP"

if cp "$TASKS_TMP" "$TASKS_FILE"; then
  echo "  [ok] .vscode/tasks.json"
else
  fail "Could not write .vscode/tasks.json"
fi
rm -f "$TASKS_TMP"

# ── Generate .github/prompts/*.prompt.md from commands ────────────────────────

PROMPTS_DIR="$ROOT_DIR/.github/prompts"
mkdir -p "$PROMPTS_DIR"

echo "Generating Copilot prompt files..."

for cmd_file in "$COMMANDS_DIR"/*.md; do
  cmd_name="$(basename "$cmd_file" .md)"
  heading="$(head -1 "$cmd_file" | sed 's/^# *//')"
  prompt_file="$PROMPTS_DIR/${cmd_name}.prompt.md"

  prompt_tmp="$(mktemp)"

  {
    printf -- '---\n'
    printf 'name: %s\n' "$cmd_name"
    printf 'description: "%s"\n' "$heading"
    printf -- '---\n\n'
    cat "$cmd_file"
  } > "$prompt_tmp"

  if cp "$prompt_tmp" "$prompt_file"; then
    echo "  [ok] .github/prompts/${cmd_name}.prompt.md"
  else
    fail "Could not write .github/prompts/${cmd_name}.prompt.md"
  fi
  rm -f "$prompt_tmp"
done

# ── Verify referenced command files exist ────────────────────────────────────

echo "Checking command files exist..."

while IFS= read -r line; do
  if [[ "$line" =~ commands/([a-z0-9_-]+\.md) ]]; then
    cmd_file="$COMMANDS_DIR/${BASH_REMATCH[1]}"
    if [[ ! -f "$cmd_file" ]]; then
      fail "Referenced command file missing: $cmd_file"
    else
      echo "  [ok] $cmd_file"
    fi
  fi
done < "$MAPPINGS_FILE"

# ── Summary ──────────────────────────────────────────────────────────────────

echo ""

if [[ "$ERRORS" -gt 0 ]]; then
  echo "Generation completed with $ERRORS error(s)." >&2
  exit 1
fi

echo "Generation complete. All adapter files up to date."
