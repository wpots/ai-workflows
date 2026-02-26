#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GENERATE="$ROOT_DIR/scripts/generate-adapters.sh"

ADAPTER_FILES=(
  "AGENTS.md"
  "CLAUDE.md"
  ".github/copilot-instructions.md"
  ".vscode/tasks.json"
)

# ── Run generation ───────────────────────────────────────────────────────────

echo "Running generate-adapters.sh..."
"$GENERATE"

# ── Check for drift ──────────────────────────────────────────────────────────

echo "Checking for uncommitted drift in adapter files..."

DIRTY=()

for f in "${ADAPTER_FILES[@]}"; do
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
  echo "Run ./scripts/generate-adapters.sh and stage the changes." >&2
  exit 1
fi

echo ""
echo "No drift detected. All adapter files match shared sources."
