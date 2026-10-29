#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GENERATE="$ROOT_DIR/scripts/generate-adapters.sh"
SMOKE_TEST="$ROOT_DIR/scripts/smoke-test-project-sync.sh"
AMBIENT_SMOKE_TEST="$ROOT_DIR/scripts/smoke-test-ambient-sync.sh"

GENERATED_FILES=(
  "AGENTS.md"
  "CLAUDE.md"
  ".claude/rules/upstream-mr.md"
  "skills/upstream-rules/references/upstream-mr.md"
  ".vscode/tasks.json"
)

# ── Temp files a sandboxed shell can write ───────────────────────────────────

echo "Checking that every mktemp names a template under \$TMPDIR..."
BARE_MKTEMP="$(grep -n 'mktemp' "$ROOT_DIR"/scripts/*.sh | grep -v 'TMPDIR' || true)"
if [[ -n "$BARE_MKTEMP" ]]; then
  echo "mktemp without a \$TMPDIR template: macOS then writes to /var/folders, which a sandboxed shell cannot write." >&2
  echo "Use mktemp \"\${TMPDIR:-/tmp}/<name>.XXXXXX\" instead:" >&2
  echo "$BARE_MKTEMP" >&2
  exit 1
fi

# ── Static skill validation ──────────────────────────────────────────────────

echo "Running skill validation..."
if command -v node >/dev/null 2>&1; then
  node "$ROOT_DIR/scripts/validate-skills.mjs"
else
  echo "node not found; skill validation requires Node 18+." >&2
  exit 1
fi

echo "Running hook tests (process-termination approval, CLI-first connector gate, pinned install runtime, ticket-transition approval, improve-skill retrospective, migration guard)..."
if command -v python3 >/dev/null 2>&1; then
  python3 "$ROOT_DIR/scripts/test_process_termination_approval.py"
  python3 "$ROOT_DIR/scripts/test_migration_guard.py"
  python3 "$ROOT_DIR/scripts/test_prefer_service_cli.py"
  python3 "$ROOT_DIR/scripts/test_pinned_install_runtime.py"
  python3 "$ROOT_DIR/scripts/test_ticket_transition_approval.py"
  python3 "$ROOT_DIR/scripts/test_improve_skill_retrospective.py"
else
  echo "python3 not found; the hook tests require Python 3." >&2
  exit 1
fi

echo "Running release automation tests..."
node --test "$ROOT_DIR/scripts/test-release-automation.mjs"

echo "Running run-checks CI parity tests..."
node --test "$ROOT_DIR/scripts/test-run-checks-ci-parity.mjs"

echo "Running compact-sprint changelog key check tests..."
node --test "$ROOT_DIR/scripts/test-compact-sprint-check-keys.mjs"

# ── Run generation ───────────────────────────────────────────────────────────

echo "Running generate-adapters.sh..."
"$GENERATE"

echo "Running project sync smoke test..."
"$SMOKE_TEST"

echo "Running ambient sync smoke test..."
"$AMBIENT_SMOKE_TEST"

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
