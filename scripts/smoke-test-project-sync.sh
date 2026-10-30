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

assert_missing() {
  local path="$1"
  if [[ -e "$path" ]]; then
    echo "Unexpected path: $path" >&2
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
# One adapter for every agent: CLAUDE.md imports it and CONVENTIONS.md, AGENTS.md
# carries the content.
grep -Fxq "@AGENTS.md" "$WITHOUT_CONVENTIONS/CLAUDE.md" ||
  { echo "FAIL: CLAUDE.md does not import AGENTS.md" >&2; exit 1; }
grep -Fxq "@CONVENTIONS.md" "$WITHOUT_CONVENTIONS/CLAUDE.md" ||
  { echo "FAIL: CLAUDE.md does not import CONVENTIONS.md" >&2; exit 1; }
assert_contains "$WITHOUT_CONVENTIONS/AGENTS.md" "Mandatory load triggers"
if grep -Fq "BEGIN SHARED:" "$WITHOUT_CONVENTIONS/CLAUDE.md"; then
  echo "FAIL: CLAUDE.md carries a shared fragment that AGENTS.md already brings" >&2
  exit 1
fi
assert_missing "$WITHOUT_CONVENTIONS/.github"
assert_missing "$WITHOUT_CONVENTIONS/.cursor"
assert_exists "$WITHOUT_CONVENTIONS/rules"
assert_exists "$WITHOUT_CONVENTIONS/commands"
assert_exists "$WITHOUT_CONVENTIONS/commands/run-checks.md"
assert_exists "$WITHOUT_CONVENTIONS/commands/review-code.md"
assert_exists "$WITHOUT_CONVENTIONS/commands/setup-ai-workflows.md"
assert_exists "$WITHOUT_CONVENTIONS/rules/stacks/react-native-expo.md"

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
assert_missing "$WITH_CONVENTIONS/.github"
assert_missing "$WITH_CONVENTIONS/.cursor"
assert_exists "$WITH_CONVENTIONS/rules"
assert_exists "$WITH_CONVENTIONS/commands"
assert_exists "$WITH_CONVENTIONS/commands/scaffold-component.md"
assert_contains "$WITH_CONVENTIONS/AI-WORKFLOWS.md" "Shared Workflow Assets"
assert_contains "$WITH_CONVENTIONS/AI-WORKFLOWS.md" "## The Path of a Ticket"
assert_contains "$WITH_CONVENTIONS/AI-WORKFLOWS.md" "(rules/backlog.md#definition-of-ready)"

echo "Smoke test: .cursor/ files from an earlier sync are left alone"
WITH_CURSOR="$TMP_DIR/with-cursor"
mkdir -p "$WITH_CURSOR/.cursor/rules"
echo '{ "name": "sync-smoke-with-cursor", "private": true }' > "$WITH_CURSOR/package.json"
echo "earlier sync" > "$WITH_CURSOR/.cursor/rules/conventions.mdc"
"$SYNC_SCRIPT" --project "$WITH_CURSOR" >/dev/null
assert_contains "$WITH_CURSOR/.cursor/rules/conventions.mdc" "earlier sync"
assert_missing "$WITH_CURSOR/.cursor/rules/graphify.mdc"

echo "Smoke test: .github/ Copilot files from an earlier sync are left alone"
WITH_COPILOT="$TMP_DIR/with-copilot"
mkdir -p "$WITH_COPILOT/.github/prompts"
echo '{ "name": "sync-smoke-with-copilot", "private": true }' > "$WITH_COPILOT/package.json"
echo "earlier sync" > "$WITH_COPILOT/.github/copilot-instructions.md"
echo "earlier sync" > "$WITH_COPILOT/.github/prompts/run-checks.prompt.md"
"$SYNC_SCRIPT" --project "$WITH_COPILOT" >/dev/null
assert_contains "$WITH_COPILOT/.github/copilot-instructions.md" "earlier sync"
assert_contains "$WITH_COPILOT/.github/prompts/run-checks.prompt.md" "earlier sync"
assert_missing "$WITH_COPILOT/.github/prompts/review-code.prompt.md"

# A missing file has no pattern in it either, so check it exists first:
# grep would exit 2 and the assertion would pass on nothing.
assert_not_contains() {
  local path="$1"
  local pattern="$2"
  assert_exists "$path"
  if grep -Fq "$pattern" "$path"; then
    echo "Unexpected '$pattern' in $path" >&2
    exit 1
  fi
}

echo "Smoke test: a project without Payload gets no Payload rule or pointers"
touch "$WITH_CONVENTIONS/rules/payload.md"
"$SYNC_SCRIPT" --project "$WITH_CONVENTIONS" >/dev/null
assert_missing "$WITH_CONVENTIONS/rules/payload.md"
assert_exists "$WITH_CONVENTIONS/rules/stacks/nextjs-payload.md"
for adapter in AI-WORKFLOWS.md CLAUDE.md AGENTS.md; do
  assert_not_contains "$WITH_CONVENTIONS/$adapter" "rules/payload.md"
done
for stripped in AI-WORKFLOWS.md AGENTS.md rules/rules.md; do
  assert_not_contains "$WITH_CONVENTIONS/$stripped" "<!-- payload-only -->"
done
assert_not_contains "$WITH_CONVENTIONS/rules/rules.md" '`payload.md`'
assert_contains "$WITH_CONVENTIONS/rules/rules.md" "stacks/nextjs-payload.md"
# Only the marked line goes: its neighbours survive, and the numbered loading
# list keeps counting without a gap.
assert_contains "$WITH_CONVENTIONS/AGENTS.md" "rules/content-blocks.md"
assert_contains "$WITH_CONVENTIONS/AI-WORKFLOWS.md" "rules/content-blocks.md"
assert_contains "$WITH_CONVENTIONS/rules/rules.md" "16. Load the appropriate stack file"

echo "Smoke test: a Payload project keeps the Payload rule and pointers"
WITH_PAYLOAD="$TMP_DIR/with-payload"
mkdir -p "$WITH_PAYLOAD"
cat > "$WITH_PAYLOAD/package.json" <<'EOF_PACKAGE'
{
  "name": "sync-smoke-with-payload",
  "private": true,
  "dependencies": {
    "@payloadcms/next": "^3.0.0"
  }
}
EOF_PACKAGE
"$SYNC_SCRIPT" --project "$WITH_PAYLOAD" >/dev/null
assert_exists "$WITH_PAYLOAD/rules/payload.md"
assert_contains "$WITH_PAYLOAD/AGENTS.md" "rules/payload.md"
assert_contains "$WITH_PAYLOAD/rules/rules.md" '`payload.md`'

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
# No trailing newline on purpose: the appended line must still start a line.
printf 'node_modules/' > "$VERIFY_PROJECT/.gitignore"
VERIFY_FILE="$VERIFY_PROJECT/.claude/skills/verify/SKILL.md"
VERIFY_GITIGNORE="$VERIFY_PROJECT/.gitignore"

"$SYNC_SCRIPT" --project "$VERIFY_PROJECT" >/dev/null
assert_exists "$VERIFY_FILE"
assert_contains "$VERIFY_FILE" "name: verify"
assert_contains "$VERIFY_FILE" ".playwright-mcp/"
if grep -Fq "disable-model-invocation" "$VERIFY_FILE"; then
  echo "The verify skill must stay invocable by the model" >&2
  exit 1
fi

echo "Smoke test: sync gitignores .playwright-mcp/ and keeps the project's lines"
grep -Fxq "node_modules/" "$VERIFY_GITIGNORE" || { echo "Sync changed an existing .gitignore line" >&2; exit 1; }
grep -Fxq ".playwright-mcp/" "$VERIFY_GITIGNORE" || { echo "Sync did not append .playwright-mcp/ on its own line" >&2; exit 1; }

printf '\nProject edit.\n' >> "$VERIFY_FILE"
SECOND_SYNC_OUT="$("$SYNC_SCRIPT" --project "$VERIFY_PROJECT")"
assert_contains "$VERIFY_FILE" "Project edit."
echo "$SECOND_SYNC_OUT" | grep -Fq "verify/SKILL.md exists (preserved" || { echo "Second sync did not report the preserved verify skill" >&2; exit 1; }

echo "Smoke test: a re-sync does not duplicate the .playwright-mcp/ line"
if [[ "$(grep -Fxc ".playwright-mcp/" "$VERIFY_GITIGNORE")" != "1" ]]; then
  echo "Re-sync duplicated the .playwright-mcp/ line in .gitignore" >&2
  exit 1
fi
echo "$SECOND_SYNC_OUT" | grep -Fq ".gitignore already ignores .playwright-mcp/" || { echo "Second sync did not report the existing ignore line" >&2; exit 1; }

echo "Smoke test: an existing .playwright-mcp ignore rule is left as it is"
OWN_RULE_PROJECT="$TMP_DIR/own-ignore-rule"
mkdir -p "$OWN_RULE_PROJECT"
printf '{\n  "name": "sync-smoke-own-rule",\n  "private": true\n}\n' > "$OWN_RULE_PROJECT/package.json"
printf 'dist/\n/.playwright-mcp\n' > "$OWN_RULE_PROJECT/.gitignore"
"$SYNC_SCRIPT" --project "$OWN_RULE_PROJECT" >/dev/null
if [[ "$(cat "$OWN_RULE_PROJECT/.gitignore")" != "$(printf 'dist/\n/.playwright-mcp')" ]]; then
  echo "Sync rewrote a .gitignore that already ignores .playwright-mcp" >&2
  exit 1
fi

echo "Smoke test: --dry-run reports the verify skill and the ignore line, and writes nothing"
DRY_PROJECT="$TMP_DIR/verify-dry-run"
mkdir -p "$DRY_PROJECT"
printf '{\n  "name": "sync-smoke-verify-dry",\n  "private": true\n}\n' > "$DRY_PROJECT/package.json"
DRY_OUT="$("$SYNC_SCRIPT" --dry-run --project "$DRY_PROJECT")"
echo "$DRY_OUT" | grep -Fq "[dry-run] write .claude/skills/verify/SKILL.md" || { echo "Dry run did not mention the verify skill" >&2; exit 1; }
echo "$DRY_OUT" | grep -Fq "[dry-run] append .playwright-mcp/ to .gitignore" || { echo "Dry run did not mention the ignore line" >&2; exit 1; }
if [[ -e "$DRY_PROJECT/.claude/skills/verify/SKILL.md" ]]; then
  echo "Dry run wrote the verify skill" >&2
  exit 1
fi
if [[ -e "$DRY_PROJECT/.gitignore" ]]; then
  echo "Dry run wrote a .gitignore" >&2
  exit 1
fi
if [[ -e "$DRY_PROJECT/.github" ]]; then
  echo "Dry run wrote a .github/ directory" >&2
  exit 1
fi

echo "Project sync smoke test passed."
