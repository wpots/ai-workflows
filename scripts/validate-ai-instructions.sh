#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AGENTS_FILE="$ROOT_DIR/AGENTS.md"
COPILOT_FILE="$ROOT_DIR/.github/copilot-instructions.md"
CLAUDE_FILE="$ROOT_DIR/CLAUDE.md"
COMMANDS_DIR="$ROOT_DIR/commands"

ERRORS=0

fail() {
  echo "ERROR: $1" >&2
  ERRORS=$((ERRORS + 1))
}

# ── Required files exist ──────────────────────────────────────────────────────

for f in "$AGENTS_FILE" "$COPILOT_FILE" "$CLAUDE_FILE"; do
  if [[ ! -f "$f" ]]; then
    fail "Missing file: $f"
  fi
done

# ── Required content markers ──────────────────────────────────────────────────

required_markers=(
  "rules/rules.md"
  "commands/run-checks.md"
  "commands/review-code.md"
  "commands/pr-description.md"
  "commands/safe-kill-port.md"
  "commands/commit-message.md"
  "commands/scaffold-component.md"
  "commands/new-device-setup.md"
  "Do not assume command files auto-run"
  "Do not modify code unless requested"
  "destructive"
  "Always summarize what was run and what changed"
)

validate_markers() {
  local file="$1"
  local label="$2"

  for marker in "${required_markers[@]}"; do
    if ! grep -qF "$marker" "$file"; then
      fail "[$label] missing marker: $marker"
    fi
  done

  echo "[$label] all required markers present"
}

validate_markers "$AGENTS_FILE" "AGENTS"
validate_markers "$COPILOT_FILE" "Copilot"
validate_markers "$CLAUDE_FILE" "CLAUDE"

# ── Command files referenced in AGENTS.md actually exist ─────────────────────

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
done < "$AGENTS_FILE"

# ── Summary ───────────────────────────────────────────────────────────────────

if [[ "$ERRORS" -gt 0 ]]; then
  echo ""
  echo "Instruction drift check FAILED with $ERRORS error(s)." >&2
  exit 1
fi

echo ""
echo "Instruction drift check passed."
