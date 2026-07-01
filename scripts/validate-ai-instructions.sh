#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GENERATE="$ROOT_DIR/scripts/generate-adapters.sh"
SMOKE_TEST="$ROOT_DIR/scripts/smoke-test-project-sync.sh"

GENERATED_FILES=(
  "AGENTS.md"
  "CLAUDE.md"
  ".github/copilot-instructions.md"
  ".vscode/tasks.json"
)

while IFS= read -r prompt_file; do
  GENERATED_FILES+=("${prompt_file#"$ROOT_DIR/"}")
done < <(find "$ROOT_DIR/.github/prompts" -type f -name '*.prompt.md' | sort)

# ── Run generation ───────────────────────────────────────────────────────────

echo "Running generate-adapters.sh..."
"$GENERATE"

echo "Running project sync smoke test..."
"$SMOKE_TEST"

# ── Check for drift ──────────────────────────────────────────────────────────

echo "Checking for uncommitted drift in generated workflow artifacts..."

DIRTY=()

for f in "${GENERATED_FILES[@]}"; do
  if ! git -C "$ROOT_DIR" diff --quiet -- "$f" 2>/dev/null; then
    DIRTY+=("$f")
  fi
done

if [[ ${#DIRTY[@]} -gt 0 ]]; then
  echo "" >&2
  echo "Drift detected in the following files:" >&2
  for f in "${DIRTY[@]}"; do
    echo "  - $f" >&2
  done
  echo "" >&2
  echo "Run ./scripts/generate-adapters.sh, review the smoke-test output if relevant, and stage the changes." >&2
  exit 1
fi

echo ""
echo "No drift detected. Generated workflow artifacts match their canonical sources."
