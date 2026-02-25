#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AGENTS_FILE="$ROOT_DIR/AGENTS.md"
COPILOT_FILE="$ROOT_DIR/.github/copilot-instructions.md"

if [[ ! -f "$AGENTS_FILE" ]]; then
  echo "Missing file: $AGENTS_FILE"
  exit 1
fi

if [[ ! -f "$COPILOT_FILE" ]]; then
  echo "Missing file: $COPILOT_FILE"
  exit 1
fi

required_markers=(
  "rules/rules.md"
  "commands/run-checks.md"
  "commands/review-code.md"
  "commands/pr-description.md"
  "commands/safe-kill-port.md"
  "Do not assume command files auto-run"
  "Do not modify code unless requested"
  "destructive"
  "Always summarize what was run and what changed"
)

validate_file() {
  local file="$1"
  local label="$2"

  for marker in "${required_markers[@]}"; do
    if ! rg -Fq "$marker" "$file"; then
      echo "[$label] missing marker: $marker"
      return 1
    fi
  done

  echo "[$label] all required markers present"
}

validate_file "$AGENTS_FILE" "AGENTS"
validate_file "$COPILOT_FILE" "Copilot"

echo "Instruction drift check passed"
