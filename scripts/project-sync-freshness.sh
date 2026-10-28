#!/usr/bin/env bash
# Freshness stamp for the project-level ai-workflows sync.
#
# `scripts/sync.sh --project` leaves a full copy of the shared assets behind
# (rules/, commands/, the generated adapters), but nothing that says *what* it
# delivered -- so nothing can tell a current project from one running last
# month's rules. This script closes that gap with a digest of the exact source
# set project sync delivers, written to `.claude/ai-workflows-stamp` in the
# project and tracked in git so drift is visible in review and to CI.
#
# Digest, not version, for the same reason as scripts/sync-ambient.sh: the
# plugin ships unbumped commits (the version is assigned after merge), so a
# version gate would read a real content change as "already current" forever.
# cksum over the source bytes differs exactly when the delivered content
# differs. The sync scripts are part of the digest on purpose: changing what a
# run generates changes the outcome even when no source file moved.
#
# Two callers:
#   scripts/sync.sh --project             --digest, to write the stamp
#   templates/project-claude-settings.json  SessionStart hook, --hook, to
#       compare the project's stamp against the plugin cache and nudge once
#       per distinct mismatch. The hook only reads the project tree; its own
#       bookkeeping lives in $CLAUDE_PLUGIN_DATA, never in the working tree.
#
# Everything stays offline: no git ls-remote, no marketplace call. Session
# start is not the place for network latency.

set -uo pipefail

SOURCE_DIR=""
MODE=""

usage() {
  cat << 'EOF_USAGE'
Usage: ./scripts/project-sync-freshness.sh (--digest | --hook) [--source <path>]

Modes:
  --digest         Print the digest of the project-sync asset set
  --hook           SessionStart hook mode: compare the current project's
                   .claude/ai-workflows-stamp against the source digest, emit
                   one advisory note per distinct mismatch, never exit nonzero

Options:
  --source <path>  Repo to digest (default: $CLAUDE_PLUGIN_ROOT, else this
                   script's repo)
  -h, --help       Show this help message
EOF_USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --digest)
      MODE="digest"
      shift
      ;;
    --hook)
      MODE="hook"
      shift
      ;;
    --source)
      if [[ -z "${2:-}" ]]; then
        echo "Error: --source requires a path argument" >&2
        exit 1
      fi
      SOURCE_DIR="$2"
      shift 2
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
  if [[ "$MODE" == "hook" ]]; then
    echo "project-sync-freshness: $1" >&2
    exit 0
  fi
  echo "Error: $1" >&2
  exit 1
}

if [[ -z "$MODE" ]]; then
  echo "Error: pass --digest or --hook" >&2
  usage
  exit 1
fi

if [[ -z "$SOURCE_DIR" ]]; then
  SOURCE_DIR="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
fi

[[ -d "$SOURCE_DIR" ]] || bail "source directory not found: $SOURCE_DIR"

# Exactly what `sync.sh --project` writes, by source: the synced directories,
# the shared fragments injected into the adapters, the adapter templates, and
# the scripts that do the generating. CONVENTIONS.md is project-owned and must
# stay out -- a project editing its own conventions is not drift.
ADAPTER_TEMPLATES=(
  project-ai-workflows.md
  project-CLAUDE.md
  project-AGENTS.md
  project-claude-settings.json
)

source_digest() {
  local template
  {
    find "$SOURCE_DIR/rules" "$SOURCE_DIR/commands" "$SOURCE_DIR/shared" \
      -type f 2>/dev/null | LC_ALL=C sort | while IFS= read -r file; do
      cat "$file"
    done
    for template in "${ADAPTER_TEMPLATES[@]}"; do
      [[ -f "$SOURCE_DIR/templates/$template" ]] && cat "$SOURCE_DIR/templates/$template"
    done
    cat "$SOURCE_DIR/scripts/sync.sh"
    cat "$SOURCE_DIR/scripts/project-sync-freshness.sh"
  } 2>/dev/null | cksum
}

if [[ "$MODE" == "digest" ]]; then
  source_digest
  exit 0
fi

# --- Hook mode ---

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$PWD}"
STAMP_FILE="$PROJECT_DIR/.claude/ai-workflows-stamp"
SOURCE_DIGEST="$(source_digest)"

# First line only: the comparison is plain string equality, so a malformed
# stamp is simply a stamp that cannot match -- reported as stale, because the
# fix (a re-sync) rewrites it. Only a missing stamp is genuinely unknown.
PROJECT_STATE="none"
STATE_LABEL="unknown"
if [[ -f "$STAMP_FILE" ]]; then
  PROJECT_STATE="$(head -n 1 "$STAMP_FILE" 2>/dev/null)"
  if [[ "$PROJECT_STATE" == "$SOURCE_DIGEST" ]]; then
    exit 0
  fi
  STATE_LABEL="stale"
fi

# Act once per distinct (source, project) pair, keyed per project: a nudge
# that fires every session is one people learn to skip, and one project's
# mismatch must not silence another's. A later plugin update or a stamp
# change is a new pair, so it notes again.
note_due() {
  [[ -n "${CLAUDE_PLUGIN_DATA:-}" ]] || return 0
  local key gate pair
  key="$(printf '%s' "$PROJECT_DIR" | cksum | tr ' \t' '--')"
  gate="$CLAUDE_PLUGIN_DATA/project-sync-noted-$key"
  pair="$SOURCE_DIGEST / $PROJECT_STATE"
  if [[ -f "$gate" && "$(cat "$gate" 2>/dev/null)" == "$pair" ]]; then
    return 1
  fi
  mkdir -p "$(dirname "$gate")" 2>/dev/null || return 0
  printf '%s\n' "$pair" > "$gate" 2>/dev/null || true
  return 0
}

note_due || exit 0

# No double quotes or newlines in the note: it goes into hook JSON built with
# printf, not through a JSON encoder. The fix command names the plugin cache
# path expanded, because $CLAUDE_PLUGIN_ROOT is not set in the shell the
# reader will run it from.
#
# The note addresses the agent, not just the human: most developers never run
# the sync by hand, so the note tells the agent to offer running it — one yes
# instead of a command to know. Consent stays with the user, and this script
# itself still never writes into the project tree.
FIX_STEPS="After a yes, run: bash '$SOURCE_DIR/scripts/sync.sh' --project . -- review the diff, and commit only the synced files (including .claude/ai-workflows-stamp) as their own chore commit on the project's usual flow; never fold them into unrelated work in progress."
if [[ "$STATE_LABEL" == "stale" ]]; then
  NOTE="ai-workflows project sync is stale: the synced assets in this project (rules/, commands/, generated adapters) no longer match what the greenberry plugin ships. Claude: offer to refresh them now, instead of only relaying this note. $FIX_STEPS"
else
  NOTE="ai-workflows project sync state is unknown: this project has no .claude/ai-workflows-stamp (last synced before stamps existed, or never synced). Claude: offer to establish it now, instead of only relaying this note. $FIX_STEPS"
fi

printf '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"%s"}}\n' \
  "$NOTE"
exit 0
