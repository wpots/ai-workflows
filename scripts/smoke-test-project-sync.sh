#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SYNC_SCRIPT="$ROOT_DIR/scripts/sync.sh"
FRESHNESS_SCRIPT="$ROOT_DIR/scripts/project-sync-freshness.sh"

TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/ai-workflows-project-sync.XXXXXX")"
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
assert_exists "$WITHOUT_CONVENTIONS/commands/run-checks.md"
assert_exists "$WITHOUT_CONVENTIONS/commands/review-code.md"
assert_exists "$WITHOUT_CONVENTIONS/commands/setup-ai-workflows.md"
assert_exists "$WITHOUT_CONVENTIONS/rules/stacks/react-native-expo.md"
assert_contains "$WITHOUT_CONVENTIONS/.github/copilot-instructions.md" "No CONVENTIONS.md found. Run setup-ai-workflows to generate one."
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
assert_exists "$WITH_CONVENTIONS/commands/scaffold-component.md"
assert_exists "$WITH_CONVENTIONS/.github/prompts/scaffold-component.prompt.md"
assert_contains "$WITH_CONVENTIONS/.github/copilot-instructions.md" "Smoke test project"
assert_contains "$WITH_CONVENTIONS/AI-WORKFLOWS.md" "Shared Workflow Assets"
assert_prompt_alignment "$WITH_CONVENTIONS"

# --- Freshness stamp + SessionStart hook ---

# The hook writes its once-per-mismatch bookkeeping into $CLAUDE_PLUGIN_DATA;
# each scenario that must fire gets a fresh data dir so an earlier note does
# not gate a later one.
run_hook() {
  local project_dir="$1"
  local data_dir="$2"
  CLAUDE_PROJECT_DIR="$project_dir" \
    CLAUDE_PLUGIN_ROOT="$ROOT_DIR" \
    CLAUDE_PLUGIN_DATA="$data_dir" \
    bash "$FRESHNESS_SCRIPT" --hook
}

STAMP_FILE="$WITH_CONVENTIONS/.claude/ai-workflows-stamp"

echo "Smoke test: sync writes the freshness stamp"
assert_exists "$STAMP_FILE"
EXPECTED_DIGEST="$(bash "$FRESHNESS_SCRIPT" --digest --source "$ROOT_DIR")"
if [[ "$(cat "$STAMP_FILE")" != "$EXPECTED_DIGEST" ]]; then
  echo "Stamp does not match the source digest" >&2
  exit 1
fi

echo "Smoke test: re-sync with identical content leaves the stamp unchanged"
"$SYNC_SCRIPT" --project "$WITH_CONVENTIONS" >/dev/null
if [[ "$(cat "$STAMP_FILE")" != "$EXPECTED_DIGEST" ]]; then
  echo "Stamp changed on a re-sync with identical content" >&2
  exit 1
fi

echo "Smoke test: a matching stamp keeps the hook silent"
HOOK_OUT="$(run_hook "$WITH_CONVENTIONS" "$TMP_DIR/data-match")"
if [[ -n "$HOOK_OUT" ]]; then
  echo "Hook emitted output for a matching stamp: $HOOK_OUT" >&2
  exit 1
fi

echo "Smoke test: a mismatched stamp is detected and the note names the fix"
echo "0 0" > "$STAMP_FILE"
HOOK_OUT="$(run_hook "$WITH_CONVENTIONS" "$TMP_DIR/data-mismatch")"
echo "$HOOK_OUT" | grep -Fq "additionalContext" || { echo "No hook JSON on mismatch" >&2; exit 1; }
echo "$HOOK_OUT" | grep -Fq "stale" || { echo "Mismatch not reported as stale" >&2; exit 1; }
echo "$HOOK_OUT" | grep -Fq "sync.sh' --project ." || { echo "Note does not name the fix command" >&2; exit 1; }
echo "$HOOK_OUT" | grep -Fq "offer to refresh" || { echo "Note does not tell the agent to offer the sync" >&2; exit 1; }
echo "$HOOK_OUT" | python3 -c "import json,sys; json.load(sys.stdin)" || { echo "Hook output is not valid JSON" >&2; exit 1; }

echo "Smoke test: the note fires once per distinct mismatch"
HOOK_OUT="$(run_hook "$WITH_CONVENTIONS" "$TMP_DIR/data-mismatch")"
if [[ -n "$HOOK_OUT" ]]; then
  echo "Hook repeated the note for the same mismatch: $HOOK_OUT" >&2
  exit 1
fi

echo "Smoke test: a missing stamp is reported as unknown, not stale"
rm -f "$STAMP_FILE"
HOOK_OUT="$(run_hook "$WITH_CONVENTIONS" "$TMP_DIR/data-missing")"
echo "$HOOK_OUT" | grep -Fq "unknown" || { echo "Missing stamp not reported as unknown" >&2; exit 1; }
echo "$HOOK_OUT" | grep -Fq "offer to establish" || { echo "Note does not tell the agent to offer the sync" >&2; exit 1; }
if echo "$HOOK_OUT" | grep -Fq "stale"; then
  echo "Missing stamp wrongly reported as stale" >&2
  exit 1
fi

echo "Smoke test: a malformed stamp is tolerated"
printf 'garbage "with quotes"\nand a second line\n' > "$STAMP_FILE"
HOOK_OUT="$(run_hook "$WITH_CONVENTIONS" "$TMP_DIR/data-malformed")"
echo "$HOOK_OUT" | grep -Fq "additionalContext" || { echo "No hook JSON on malformed stamp" >&2; exit 1; }
echo "$HOOK_OUT" | python3 -c "import json,sys; json.load(sys.stdin)" || { echo "Hook output is not valid JSON" >&2; exit 1; }

echo "Smoke test: the hook never writes into the project tree"
NEWER_FILES="$(find "$WITH_CONVENTIONS" -newer "$STAMP_FILE" -type f 2>/dev/null)"
if [[ -n "$NEWER_FILES" ]]; then
  echo "Hook wrote into the project working tree:" >&2
  echo "$NEWER_FILES" >&2
  exit 1
fi

echo "Smoke test: sync emits the verify skill once and never overwrites it"
VERIFY_PROJECT="$TMP_DIR/verify-skill"
mkdir -p "$VERIFY_PROJECT"
printf '{\n  "name": "sync-smoke-verify",\n  "private": true\n}\n' > "$VERIFY_PROJECT/package.json"
VERIFY_FILE="$VERIFY_PROJECT/.claude/skills/verify/SKILL.md"

"$SYNC_SCRIPT" --project "$VERIFY_PROJECT" >/dev/null
assert_exists "$VERIFY_FILE"
assert_contains "$VERIFY_FILE" "name: verify"
if grep -Fq "disable-model-invocation" "$VERIFY_FILE"; then
  echo "The verify skill must stay invocable by the model" >&2
  exit 1
fi

printf '\nProject edit.\n' >> "$VERIFY_FILE"
SECOND_SYNC_OUT="$("$SYNC_SCRIPT" --project "$VERIFY_PROJECT")"
assert_contains "$VERIFY_FILE" "Project edit."
echo "$SECOND_SYNC_OUT" | grep -Fq "verify/SKILL.md exists (preserved" || { echo "Second sync did not report the preserved verify skill" >&2; exit 1; }

echo "Smoke test: --dry-run reports the verify skill and writes nothing"
DRY_PROJECT="$TMP_DIR/verify-dry-run"
mkdir -p "$DRY_PROJECT"
printf '{\n  "name": "sync-smoke-verify-dry",\n  "private": true\n}\n' > "$DRY_PROJECT/package.json"
DRY_OUT="$("$SYNC_SCRIPT" --dry-run --project "$DRY_PROJECT")"
echo "$DRY_OUT" | grep -Fq "[dry-run] write .claude/skills/verify/SKILL.md" || { echo "Dry run did not mention the verify skill" >&2; exit 1; }
if [[ -e "$DRY_PROJECT/.claude/skills/verify/SKILL.md" ]]; then
  echo "Dry run wrote the verify skill" >&2
  exit 1
fi

echo "Project sync smoke test passed."
