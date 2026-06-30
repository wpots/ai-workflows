#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOOKS_DIR="$ROOT_DIR/.git/hooks"
PRE_COMMIT_HOOK="$HOOKS_DIR/pre-commit"

if [[ ! -d "$HOOKS_DIR" ]]; then
  echo "No .git/hooks directory found. Is this a git repo?" >&2
  exit 1
fi

cat > "$PRE_COMMIT_HOOK" << 'EOF'
#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel)"
VALIDATE="$ROOT_DIR/scripts/validate-ai-instructions.sh"

if [[ -x "$VALIDATE" ]]; then
  echo "Running AI instruction drift check..."
  "$VALIDATE"
fi
EOF

chmod +x "$PRE_COMMIT_HOOK"

echo "Installed pre-commit hook at $PRE_COMMIT_HOOK"
echo "The hook will run validate-ai-instructions.sh before each commit."
