#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOOKS_DIR="$ROOT_DIR/.git/hooks"
PRE_COMMIT_HOOK="$HOOKS_DIR/pre-commit"
PRE_PUSH_HOOK="$HOOKS_DIR/pre-push"

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

# Enforce the hard rule: changes land via an MR with a reviewer, never a direct
# push to a protected long-lived branch.
cat > "$PRE_PUSH_HOOK" << 'EOF'
#!/usr/bin/env bash
set -euo pipefail

while read -r _local_ref _local_sha remote_ref _remote_sha; do
  case "$remote_ref" in
    refs/heads/main|refs/heads/master)
      echo "Refusing to push directly to ${remote_ref#refs/heads/}." >&2
      echo "Changes in this repo land via a GitLab MR with a reviewer:" >&2
      echo "  git switch -c <type>/<slug> && git push -u <gitlab-remote> HEAD" >&2
      echo "  glab mr create --target-branch main --reviewer wieteke.pots ..." >&2
      exit 1
      ;;
  esac
done

exit 0
EOF

chmod +x "$PRE_PUSH_HOOK"

echo "Installed pre-commit hook at $PRE_COMMIT_HOOK"
echo "The hook will run validate-ai-instructions.sh before each commit."
echo "Installed pre-push hook at $PRE_PUSH_HOOK"
echo "The hook refuses direct pushes to main/master — use a branch + MR."
