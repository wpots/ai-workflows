#!/usr/bin/env bash
# Sync the Claude ambient layer: ~/.claude/CLAUDE.md plus the universal rules
# subset. This is the one part of the Claude surface that cannot ship as a
# plugin component -- plugins have no primitive for always-on context.
#
# Two callers:
#   scripts/sync.sh    full sync, passes --source explicitly
#   hooks/hooks.json   SessionStart hook inside the greenberry plugin, where
#                      $CLAUDE_PLUGIN_ROOT points at the auto-updated plugin
#                      copy of this repo
#
# The plugin cache holds a complete copy of this repo, so the auto-updating
# channel can drive the file copy even though the files themselves are not
# plugin components. That closes the gap where skills auto-updated but the
# ambient layer silently rotted until someone remembered to run sync.sh.
#
# Hook mode is gated on a digest of the source files this script delivers, and
# deliberately NOT on the plugin version: $CLAUDE_PLUGIN_ROOT is version-keyed
# (.../greenberry/1.3.0; only SHA-keyed while plugin.json carries no version at
# all), so every commit to main that ships without a version bump reuses the
# same directory name. A version gate reads that as "already applied" and skips
# a real rules change forever. The digest is stamped in $CLAUDE_PLUGIN_DATA,
# which survives plugin updates.
#
# Digesting the *source* keeps the property the version gate was there for: a
# manual `sync.sh` from a newer local checkout is not reverted at the next
# session start, and a deliberate local edit to ~/.claude survives until the
# plugin actually delivers different content -- a local edit does not change
# the source digest.
#
# Content equality still decides *which* files to touch, so the reported list
# is accurate and untouched files keep their mtime.

set -uo pipefail

SOURCE_DIR=""
TARGET_CLAUDE="$HOME/.claude"
HOOK_MODE=0
DRY_RUN=0

usage() {
  cat << 'EOF_USAGE'
Usage: ./scripts/sync-ambient.sh [--source <path>] [--target <path>] [--hook] [--dry-run]

Options:
  --source <path>  Repo to sync from (default: $CLAUDE_PLUGIN_ROOT, else this
                   script's repo)
  --target <path>  Claude config dir to sync into (default: ~/.claude)
  --hook           SessionStart hook mode: acts once per distinct set of source
                   files, stays silent when there is nothing to do, emits hook
                   JSON when it changed something, and never exits nonzero
  --dry-run        Report what would change without writing
  -h, --help       Show this help message
EOF_USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --source)
      if [[ -z "${2:-}" ]]; then
        echo "Error: --source requires a path argument" >&2
        exit 1
      fi
      SOURCE_DIR="$2"
      shift 2
      ;;
    --target)
      if [[ -z "${2:-}" ]]; then
        echo "Error: --target requires a path argument" >&2
        exit 1
      fi
      TARGET_CLAUDE="$2"
      shift 2
      ;;
    --hook)
      HOOK_MODE=1
      shift
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      echo "Error: unknown argument '$1'" >&2
      usage
      exit 1
      ;;
  esac
done

# In hook mode a failure must never break the session, and stdout is parsed as
# hook JSON -- so bail out quietly instead of half-reporting.
bail() {
  if [[ "$HOOK_MODE" -eq 1 ]]; then
    echo "sync-ambient: $1" >&2
    exit 0
  fi
  echo "Error: $1" >&2
  exit 1
}

if [[ -z "$SOURCE_DIR" ]]; then
  SOURCE_DIR="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
fi

[[ -d "$SOURCE_DIR" ]] || bail "source directory not found: $SOURCE_DIR"

# No ~/.claude means Claude Code was never set up on this machine; the other
# sync targets are none of this script's business.
[[ -d "$TARGET_CLAUDE" ]] || exit 0

# The universal subset. Global Claude rules stay slim on purpose: anything
# stack-specific belongs in a project, not in every conversation.
UNIVERSAL_RULES=(
  communication.md
  project.md
  clean-architecture.md
)

# Rules this repo used to sync globally. Left in place they keep loading into
# every session, so removing them is part of delivering the ambient layer.
# Repo-owned names only -- personal rules are never touched.
RETIRED_RULES=(
  rules.md
  tailwind.md
  testing.md
  accessibility.md
  backlog.md
  stacks/nextjs-payload.md
  stacks/react-native-expo.md
)

# --- Content gate (hook mode only) ---
#
# sync.sh is an explicit "make it so" and always applies. The hook is ambient,
# so it must not fight a manual sync -- it acts once per distinct source state.
#
# This script is part of the digest on purpose: changing the subset or the
# retired list changes what a run delivers, even when no rule file moved.
# cksum is POSIX and needs no extra tooling; collision resistance is irrelevant
# here, the digest only has to differ when the bytes differ.
source_digest() {
  local rule
  {
    [[ -f "$SOURCE_DIR/CLAUDE.md" ]] && cat "$SOURCE_DIR/CLAUDE.md"
    for rule in "${UNIVERSAL_RULES[@]}"; do
      [[ -f "$SOURCE_DIR/rules/$rule" ]] && cat "$SOURCE_DIR/rules/$rule"
    done
    cat "${BASH_SOURCE[0]}"
  } 2>/dev/null | cksum
}

# Stamp path is new: the retired `ambient-synced-from` held a plugin version, so
# it can never equal a digest. Existing installs act once more, which just
# re-asserts the files they should already have.
STAMP_FILE=""
LEGACY_STAMP_FILE=""
SOURCE_DIGEST=""
if [[ "$HOOK_MODE" -eq 1 && -n "${CLAUDE_PLUGIN_DATA:-}" ]]; then
  STAMP_FILE="$CLAUDE_PLUGIN_DATA/ambient-source-digest"
  LEGACY_STAMP_FILE="$CLAUDE_PLUGIN_DATA/ambient-synced-from"
  SOURCE_DIGEST="$(source_digest)"
  if [[ -f "$STAMP_FILE" && "$(cat "$STAMP_FILE" 2>/dev/null)" == "$SOURCE_DIGEST" ]]; then
    exit 0
  fi
fi

# Space-separated rather than an array: macOS still ships bash 3.2, where
# expanding an empty array under `set -u` is an error.
CHANGED=""

copy_if_changed() {
  local src="$1" dest="$2" label="$3"
  [[ -f "$src" ]] || return 0
  cmp -s "$src" "$dest" && return 0
  if [[ "$DRY_RUN" -eq 0 ]]; then
    mkdir -p "$(dirname "$dest")"
    cp "$src" "$dest" || return 0
  fi
  CHANGED="$CHANGED $label"
}

remove_if_present() {
  local target="$1" label="$2"
  [[ -e "$target" ]] || return 0
  if [[ "$DRY_RUN" -eq 0 ]]; then
    rm -f "$target" || return 0
  fi
  CHANGED="$CHANGED -$label"
}

# Record the source state we just reconciled, so the next session is a no-op
# until the plugin delivers different content. Written even when nothing
# changed. The retired version stamp is cleaned up on the way out.
write_stamp() {
  [[ -n "$STAMP_FILE" && "$DRY_RUN" -eq 0 ]] || return 0
  mkdir -p "$(dirname "$STAMP_FILE")" 2>/dev/null || return 0
  echo "$SOURCE_DIGEST" > "$STAMP_FILE" 2>/dev/null || return 0
  [[ -n "$LEGACY_STAMP_FILE" ]] && rm -f "$LEGACY_STAMP_FILE" 2>/dev/null
  return 0
}

copy_if_changed "$SOURCE_DIR/CLAUDE.md" "$TARGET_CLAUDE/CLAUDE.md" "CLAUDE.md"

for rule in "${UNIVERSAL_RULES[@]}"; do
  copy_if_changed \
    "$SOURCE_DIR/rules/$rule" \
    "$TARGET_CLAUDE/rules/$rule" \
    "rules/$rule"
done

for rule in "${RETIRED_RULES[@]}"; do
  remove_if_present "$TARGET_CLAUDE/rules/$rule" "rules/$rule"
done

if [[ -z "$CHANGED" ]]; then
  if [[ "$HOOK_MODE" -eq 1 ]]; then
    write_stamp
  else
    echo "Claude ambient layer already up to date."
  fi
  exit 0
fi

if [[ "$HOOK_MODE" -eq 1 ]]; then
  write_stamp
  printf '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"The ai-workflows ambient layer was just refreshed from the greenberry plugin:%s (a leading - means removed). The global CLAUDE.md and rules now in context are current."}}\n' \
    "$CHANGED"
  exit 0
fi

prefix=""
[[ "$DRY_RUN" -eq 1 ]] && prefix="[dry-run] "
for label in $CHANGED; do
  if [[ "$label" == -* ]]; then
    echo "${prefix}Removed $TARGET_CLAUDE/${label#-}"
  else
    echo "${prefix}Synced $SOURCE_DIR/$label -> $TARGET_CLAUDE/$label"
  fi
done
