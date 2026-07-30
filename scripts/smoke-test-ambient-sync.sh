#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SYNC_SCRIPT="$ROOT_DIR/scripts/sync-ambient.sh"

TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/ai-workflows-ambient-sync.XXXXXX")"
trap 'rm -rf "$TMP_DIR"' EXIT

TARGET="$TMP_DIR/claude"
DATA="$TMP_DIR/plugin-data"
mkdir -p "$TARGET/rules/stacks" "$DATA"

# Two fake plugin releases in separate directories -- the normal case, where a
# bumped version gives $CLAUDE_PLUGIN_ROOT a new basename. The shared-directory
# case is covered further down.
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

echo "Smoke test: unchanged source is a silent no-op"
OUT="$(run_hook "$V1")"
[[ -z "$OUT" ]] || fail "second run should be silent, got: $OUT"

echo "Smoke test: a local edit survives until the plugin delivers new content"
echo "locally edited" > "$TARGET/CLAUDE.md"
OUT="$(run_hook "$V1")"
[[ -z "$OUT" ]] || fail "unchanged source must not fight a local edit"
grep -Fq "locally edited" "$TARGET/CLAUDE.md" || fail "local edit was reverted"

echo "Smoke test: a plugin update re-asserts the ambient layer"
OUT="$(run_hook "$V2")"
[[ -n "$OUT" ]] || fail "plugin update produced no hook output"
grep -Fq "v2 ambient layer" "$TARGET/CLAUDE.md" || fail "update did not land"

# Regression: the install path is version-keyed (.../greenberry/1.3.0), so every
# commit to main that ships without a version bump reuses the same basename. A
# gate keyed on that name skips the change forever.
echo "Smoke test: new content under an unchanged directory name still lands"
SAME="$TMP_DIR/plugin/1.3.0"
TARGET2="$TMP_DIR/claude2"
DATA2="$TMP_DIR/plugin-data2"
mkdir -p "$SAME/rules" "$TARGET2/rules" "$DATA2"
cp "$ROOT_DIR/rules/communication.md" "$SAME/rules/communication.md"
cp "$ROOT_DIR/rules/project.md" "$SAME/rules/project.md"
cp "$ROOT_DIR/rules/clean-architecture.md" "$SAME/rules/clean-architecture.md"
echo "bumped release" > "$SAME/CLAUDE.md"

run_hook_same() {
  CLAUDE_PLUGIN_DATA="$DATA2" "$SYNC_SCRIPT" \
    --source "$SAME" --target "$TARGET2" --hook
}

OUT="$(run_hook_same)"
[[ -n "$OUT" ]] || fail "first run on the shared version directory did nothing"
echo "unbumped release" > "$SAME/CLAUDE.md"
OUT="$(run_hook_same)"
[[ -n "$OUT" ]] || fail "content change under the same directory name was skipped"
grep -Fq "unbumped release" "$TARGET2/CLAUDE.md" ||
  fail "unbumped content change did not reach the target"
OUT="$(run_hook_same)"
[[ -z "$OUT" ]] || fail "run after the digest stamp should be silent, got: $OUT"

echo "Smoke test: the retired version stamp is migrated away"
rm -f "$DATA2/ambient-source-digest"
echo "1.3.0" > "$DATA2/ambient-synced-from"
echo "clobbered" > "$TARGET2/CLAUDE.md"
OUT="$(run_hook_same)"
[[ -n "$OUT" ]] || fail "a legacy version stamp suppressed the first digest run"
grep -Fq "unbumped release" "$TARGET2/CLAUDE.md" ||
  fail "legacy-stamp run did not re-assert the ambient layer"
[[ -f "$DATA2/ambient-source-digest" ]] || fail "digest stamp was not written"
if [[ -e "$DATA2/ambient-synced-from" ]]; then
  fail "retired version stamp was not cleaned up"
fi

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

# --- Freshness checks -------------------------------------------------------
#
# Each case gets its own target, plugin data dir, and source copy, so the
# content gate is out of the way and only the note under test can speak.

FRESH_TARGET="$TMP_DIR/claude-freshness"
FRESH_DATA="$TMP_DIR/plugin-data-freshness"
FRESH_SRC="$TMP_DIR/plugin/freshness"
mkdir -p "$FRESH_TARGET/rules" "$FRESH_DATA" "$FRESH_SRC/rules"
cp "$ROOT_DIR/rules/communication.md" "$FRESH_SRC/rules/communication.md"
cp "$ROOT_DIR/rules/project.md" "$FRESH_SRC/rules/project.md"
cp "$ROOT_DIR/rules/clean-architecture.md" "$FRESH_SRC/rules/clean-architecture.md"
echo "freshness ambient layer" > "$FRESH_SRC/CLAUDE.md"

run_fresh_hook() {
  CLAUDE_PLUGIN_DATA="$FRESH_DATA" CLAUDE_PLUGIN_ROOT="${1:-}" "$SYNC_SCRIPT" \
    --source "$FRESH_SRC" --target "$FRESH_TARGET" --hook
}

echo "Smoke test: a marketplace entry without autoUpdate is reported"
cat > "$FRESH_TARGET/settings.json" <<'JSON'
{
  "extraKnownMarketplaces": {
    "ai-workflows": {
      "source": { "source": "git", "url": "git@gitlab.com:greenberrynl/config/ai-workflows.git" }
    }
  }
}
JSON
OUT="$(run_fresh_hook)"
grep -Fq "autoUpdate" <<< "$OUT" || fail "missing autoUpdate was not reported: $OUT"
grep -Fq '"hookEventName":"SessionStart"' <<< "$OUT" ||
  fail "freshness note did not emit valid hook JSON"

echo "Smoke test: the note fires at most once a day"
OUT="$(run_fresh_hook)"
if grep -Fq "autoUpdate" <<< "$OUT"; then
  fail "freshness note repeated on the same day"
fi

echo "Smoke test: autoUpdate true and a fresh cache stay quiet"
rm -f "$FRESH_DATA/freshness-warned"
cat > "$FRESH_TARGET/settings.json" <<'JSON'
{
  "extraKnownMarketplaces": {
    "ai-workflows": {
      "source": { "source": "git", "url": "git@gitlab.com:greenberrynl/config/ai-workflows.git" },
      "autoUpdate": true
    }
  }
}
JSON
OUT="$(run_fresh_hook "$FRESH_SRC")"
[[ -z "$OUT" ]] || fail "a correctly configured install should stay silent, got: $OUT"

echo "Smoke test: a plugin cache nobody has updated is reported"
rm -f "$FRESH_DATA/freshness-warned"
STALE_CACHE="$TMP_DIR/plugin/stale-cache"
mkdir -p "$STALE_CACHE"
touch -t 202001010000 "$STALE_CACHE"
OUT="$(run_fresh_hook "$STALE_CACHE")"
grep -Fq "auto-update" <<< "$OUT" || fail "stale plugin cache was not reported: $OUT"

echo "Smoke test: malformed settings.json is not fatal"
rm -f "$FRESH_DATA/freshness-warned"
echo "{ not json" > "$FRESH_TARGET/settings.json"
run_fresh_hook > /dev/null || fail "malformed settings.json must not fail the hook"

echo "All ambient sync smoke tests passed."
