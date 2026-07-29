#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SYNC_SCRIPT="$ROOT_DIR/scripts/sync-ambient.sh"

TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/ai-workflows-ambient-sync.XXXXXX")"
trap 'rm -rf "$TMP_DIR"' EXIT

TARGET="$TMP_DIR/claude"
DATA="$TMP_DIR/plugin-data"
mkdir -p "$TARGET/rules/stacks" "$DATA"

# Two fake plugin versions. $CLAUDE_PLUGIN_ROOT is SHA-addressed, so a plugin
# update is a different directory name -- that is the version signal.
V1="$TMP_DIR/plugin/aaaa1111"
V2="$TMP_DIR/plugin/bbbb2222"
for version in "$V1" "$V2"; do
  mkdir -p "$version/rules"
  cp "$ROOT_DIR/rules/communication.md" "$version/rules/communication.md"
  cp "$ROOT_DIR/rules/project.md" "$version/rules/project.md"
  cp "$ROOT_DIR/rules/clean-architecture.md" "$version/rules/clean-architecture.md"
done
echo "v1 ambient layer" > "$V1/CLAUDE.md"
echo "v2 ambient layer" > "$V2/CLAUDE.md"

# A retired rule that earlier syncs left behind.
echo "stale" > "$TARGET/rules/tailwind.md"

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

run_hook() {
  CLAUDE_PLUGIN_DATA="$DATA" "$SYNC_SCRIPT" \
    --source "$1" --target "$TARGET" --hook
}

echo "Smoke test: first run installs the ambient layer"
OUT="$(run_hook "$V1")"
[[ -n "$OUT" ]] || fail "first run produced no hook output"
grep -Fq '"hookEventName":"SessionStart"' <<< "$OUT" ||
  fail "first run did not emit SessionStart hook JSON"
grep -Fq "CLAUDE.md" <<< "$OUT" || fail "first run did not report CLAUDE.md"
[[ -f "$TARGET/CLAUDE.md" ]] || fail "CLAUDE.md was not installed"
grep -Fq "v1 ambient layer" "$TARGET/CLAUDE.md" || fail "wrong CLAUDE.md content"
[[ -f "$TARGET/rules/communication.md" ]] || fail "universal rule not installed"
if [[ -e "$TARGET/rules/tailwind.md" ]]; then fail "retired rule was not removed"; fi
if [[ -e "$TARGET/rules/rules.md" ]]; then fail "absent retired rule was recreated"; fi

echo "Smoke test: same plugin version is a silent no-op"
OUT="$(run_hook "$V1")"
[[ -z "$OUT" ]] || fail "second run should be silent, got: $OUT"

echo "Smoke test: a local edit survives until the plugin actually updates"
echo "locally edited" > "$TARGET/CLAUDE.md"
OUT="$(run_hook "$V1")"
[[ -z "$OUT" ]] || fail "unchanged plugin version must not fight a local edit"
grep -Fq "locally edited" "$TARGET/CLAUDE.md" || fail "local edit was reverted"

echo "Smoke test: a plugin update re-asserts the ambient layer"
OUT="$(run_hook "$V2")"
[[ -n "$OUT" ]] || fail "plugin update produced no hook output"
grep -Fq "v2 ambient layer" "$TARGET/CLAUDE.md" || fail "update did not land"

echo "Smoke test: --dry-run writes nothing"
echo "pre-dry-run" > "$TARGET/CLAUDE.md"
"$SYNC_SCRIPT" --source "$V1" --target "$TARGET" --dry-run > /dev/null
grep -Fq "pre-dry-run" "$TARGET/CLAUDE.md" || fail "--dry-run modified the target"

echo "Smoke test: explicit sync applies regardless of plugin version"
"$SYNC_SCRIPT" --source "$V1" --target "$TARGET" > /dev/null
grep -Fq "v1 ambient layer" "$TARGET/CLAUDE.md" ||
  fail "explicit sync did not apply"

echo "Smoke test: missing target dir is a clean no-op"
"$SYNC_SCRIPT" --source "$V1" --target "$TMP_DIR/does-not-exist" > /dev/null ||
  fail "missing target should exit 0"

echo "All ambient sync smoke tests passed."
