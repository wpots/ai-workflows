#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SYNC_SCRIPT="$ROOT_DIR/scripts/sync.sh"

TMP_DIR="$(mktemp -d /tmp/ai-workflows-project-sync.XXXXXX)"
trap 'rm -rf "$TMP_DIR"' EXIT

assert_exists() {
  local path="$1"
  if [[ ! -e "$path" ]]; then
    echo "Missing expected path: $path" >&2
    exit 1
  fi
}

assert_contains() {
  local path="$1"
  local pattern="$2"
  if ! grep -Fq "$pattern" "$path"; then
    echo "Expected '$pattern' in $path" >&2
    exit 1
  fi
}

assert_prompt_alignment() {
  local project_dir="$1"
  local cmd_file=""
  local cmd_name=""
  local prompt_file=""

  for cmd_file in "$project_dir/commands/"*.md; do
    [[ -f "$cmd_file" ]] || continue
    cmd_name="$(basename "$cmd_file" .md)"
    prompt_file="$project_dir/.github/prompts/${cmd_name}.prompt.md"
    assert_exists "$prompt_file"
    assert_contains "$prompt_file" "name: ${cmd_name}"
  done
}

echo "Smoke test: project sync without CONVENTIONS.md"
WITHOUT_CONVENTIONS="$TMP_DIR/no-conventions"
mkdir -p "$WITHOUT_CONVENTIONS"
cat > "$WITHOUT_CONVENTIONS/package.json" <<'EOF_PACKAGE'
{
  "name": "sync-smoke-no-conventions",
  "private": true
}
EOF_PACKAGE

"$SYNC_SCRIPT" --project "$WITHOUT_CONVENTIONS" >/dev/null

assert_exists "$WITHOUT_CONVENTIONS/AI-WORKFLOWS.md"
assert_exists "$WITHOUT_CONVENTIONS/CLAUDE.md"
assert_exists "$WITHOUT_CONVENTIONS/AGENTS.md"
assert_exists "$WITHOUT_CONVENTIONS/.github/copilot-instructions.md"
assert_exists "$WITHOUT_CONVENTIONS/.cursor/rules/conventions.mdc"
assert_exists "$WITHOUT_CONVENTIONS/rules"
assert_exists "$WITHOUT_CONVENTIONS/commands"
assert_exists "$WITHOUT_CONVENTIONS/.github/prompts"
assert_contains "$WITHOUT_CONVENTIONS/.github/copilot-instructions.md" "No CONVENTIONS.md found. Run init-project to generate one."
assert_prompt_alignment "$WITHOUT_CONVENTIONS"

echo "Smoke test: project sync with existing CONVENTIONS.md"
WITH_CONVENTIONS="$TMP_DIR/with-conventions"
mkdir -p "$WITH_CONVENTIONS"
cat > "$WITH_CONVENTIONS/package.json" <<'EOF_PACKAGE'
{
  "name": "sync-smoke-with-conventions",
  "private": true
}
EOF_PACKAGE
cat > "$WITH_CONVENTIONS/CONVENTIONS.md" <<'EOF_CONVENTIONS'
# CONVENTIONS.md

## Project

Smoke test project

## Conventions

- Prefer explicit service modules for API calls.
EOF_CONVENTIONS

"$SYNC_SCRIPT" --project "$WITH_CONVENTIONS" >/dev/null

assert_exists "$WITH_CONVENTIONS/AI-WORKFLOWS.md"
assert_exists "$WITH_CONVENTIONS/CLAUDE.md"
assert_exists "$WITH_CONVENTIONS/AGENTS.md"
assert_exists "$WITH_CONVENTIONS/.github/copilot-instructions.md"
assert_exists "$WITH_CONVENTIONS/.cursor/rules/conventions.mdc"
assert_exists "$WITH_CONVENTIONS/rules"
assert_exists "$WITH_CONVENTIONS/commands"
assert_exists "$WITH_CONVENTIONS/.github/prompts"
assert_contains "$WITH_CONVENTIONS/.github/copilot-instructions.md" "Smoke test project"
assert_contains "$WITH_CONVENTIONS/AI-WORKFLOWS.md" "Shared Workflow Assets"
assert_prompt_alignment "$WITH_CONVENTIONS"

echo "Project sync smoke test passed."
