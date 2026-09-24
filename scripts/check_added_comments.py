#!/usr/bin/env python3
"""Remind about comment discipline when an edit adds an argument or a pointer.

`rules/documentation.md` names the classes of added comment that are findings.
Two of them are detectable in the text itself: a comment that argues for the
change, and a comment pointing at an MR, PR or ticket. Comment *volume* is
deliberately not checked — that rule says plainly that no ratio of comment
lines to code lines is a finding on its own.

Never blocks. It prints a reminder and exits 0.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import PurePath
from typing import Any


# Languages whose comments this recognises. Markdown and friends are excluded:
# prose files are documentation, and this policy is about code comments.
SLASH_COMMENT_SUFFIXES = {
    ".c", ".cc", ".cpp", ".cs", ".go", ".h", ".java", ".js", ".jsx", ".kt",
    ".m", ".mm", ".php", ".rs", ".scala", ".scss", ".swift", ".ts", ".tsx",
    ".vue", ".svelte",
}
HASH_COMMENT_SUFFIXES = {".py", ".rb", ".sh", ".bash", ".zsh", ".yml", ".yaml"}

SLASH_COMMENT = re.compile(r"^\s*(?://|/\*|\*(?!/))")
HASH_COMMENT = re.compile(r"^\s*#")

# Pointing at something that will not exist for the next reader.
PROVENANCE = re.compile(
    r"""(?ix)
    (?: ^|[\s(\[] )
    (?: !\d+                     # GitLab MR reference
      | \bMR\s*!?\d+
      | \bPR\s*\#?\d+
      | \b[A-Z]{2,}-\d+\b        # ticket key
      | see\s+the\s+(?:MR|PR)
      | in\s+review\s+of
    )
    """
)

# Arguing that the change is correct, rather than stating what the code does.
ARGUMENT = re.compile(
    r"""(?ix)
    \b(?: on\s+purpose
        | deliberately
        | intentionally
        | instead\s+of
        | rather\s+than
        | no\s+longer
        | previously
        | used\s+to\s+be
        | we\s+now
        | this\s+fixes
        | the\s+point\s+is
    )\b
    """
)


def added_text(tool_name: str, tool_input: dict[str, Any]) -> str:
    if tool_name == "Write":
        return str(tool_input.get("content") or "")
    if tool_name == "Edit":
        return str(tool_input.get("new_string") or "")
    return ""


def comment_lines(text: str, suffix: str) -> list[str]:
    if suffix in SLASH_COMMENT_SUFFIXES:
        pattern = SLASH_COMMENT
    elif suffix in HASH_COMMENT_SUFFIXES:
        pattern = HASH_COMMENT
    else:
        return []
    return [line for line in text.splitlines() if pattern.match(line)]


def findings(lines: list[str]) -> list[str]:
    hits = []
    if any(PROVENANCE.search(line) for line in lines):
        hits.append(
            "a pointer to an MR, PR or ticket — the one reader who can follow "
            "it is the reviewer, who does not need it"
        )
    if any(ARGUMENT.search(line) for line in lines):
        hits.append(
            "wording that argues the change is correct — that belongs in the "
            "MR description, and is stale the day it lands"
        )
    return hits


def main() -> None:
    try:
        payload = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        return

    tool_input = payload.get("tool_input") or {}
    suffix = PurePath(str(tool_input.get("file_path") or "")).suffix.lower()
    lines = comment_lines(added_text(payload.get("tool_name", ""), tool_input), suffix)
    hits = findings(lines)

    if not hits:
        return

    reminder = (
        "This edit adds a comment carrying "
        + "; and ".join(hits)
        + ". Re-read it against rules/documentation.md: would it still be worth "
        "reading a year from now, to someone who never saw the MR? If it only "
        "helps a reviewer, move it to the MR description and delete it."
    )
    json.dump(
        {
            "hookSpecificOutput": {
                "hookEventName": "PostToolUse",
                "additionalContext": reminder,
            }
        },
        sys.stdout,
    )


if __name__ == "__main__":
    main()
