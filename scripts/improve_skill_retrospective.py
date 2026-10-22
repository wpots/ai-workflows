#!/usr/bin/env python3
"""Offer the improve-skill retrospective once per session after a run that needed intervention.

`CLAUDE.md` says to run `skills/improve-skill` after any skill run that needed
the user's intervention. This Stop hook turns that sentence into a prompt: when a
Greenberry skill ran in the session and the transcript shows the user stepping
in afterwards, it blocks the stop once, with a reason that asks Claude to offer
the retrospective. It never runs the retrospective or edits a skill itself.

Signals are matched on the structure of transcript entries, never on raw text,
because notes and backlog items that quote these phrases would otherwise
trigger it. A user turn is recognised by `origin.kind == "human"`, so a
background-task notification is not a correction. Any error ends in a silent
exit 0: this hook must never break a session.
"""

from __future__ import annotations

import json
import os
import re
import sys
from collections.abc import Iterable, Iterator
from pathlib import Path
from typing import Any


SKILL_PREFIX = "greenberry:"
RETROSPECTIVE_SKILL = "greenberry:improve-skill"
INTERRUPT_PREFIX = "[Request interrupted by user"
REJECTION_PREFIX = "The user doesn't want to proceed with this tool use"
SESSION_ID = re.compile(r"[A-Za-z0-9._-]{1,128}")

REASON = (
    "A Greenberry skill ran in this session and the run needed the user to step in. "
    "In one sentence, offer to run /greenberry:improve-skill now to check whether "
    "anything from this run belongs in that skill; often nothing does. Do not run "
    "improve-skill or edit any skill unless the user says yes; if they decline, "
    "drop it."
)


def text_of(content: Any) -> str:
    """The text of a message or tool_result `content`: a string, or the text blocks of a list."""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return "\n".join(
            block["text"]
            for block in content
            if isinstance(block, dict) and isinstance(block.get("text"), str)
        )
    return ""


def parse_entry(line: str) -> dict[str, Any] | None:
    try:
        entry = json.loads(line)
    except ValueError:
        return None
    return entry if isinstance(entry, dict) else None


def message_content(entry: dict[str, Any]) -> Any:
    message = entry.get("message")
    return message.get("content") if isinstance(message, dict) else None


def skill_calls(entry: dict[str, Any]) -> list[str]:
    """Names of the Skill tool calls that an assistant entry makes."""
    content = message_content(entry)
    if entry.get("type") != "assistant" or not isinstance(content, list):
        return []
    names = []
    for block in content:
        if isinstance(block, dict) and block.get("type") == "tool_use" and block.get("name") == "Skill":
            tool_input = block.get("input")
            skill = tool_input.get("skill") if isinstance(tool_input, dict) else None
            if isinstance(skill, str):
                names.append(skill)
    return names


def user_signal(entry: dict[str, Any], after_error: bool) -> tuple[str | None, bool]:
    """(signal, after_error) for one entry, once a Greenberry skill has run.

    `after_error` is true while the latest tool outcome is a failure. The user
    typing next is the "error, then correction" signal; a later successful tool
    result means the run recovered, so the failure no longer counts.
    """
    if entry.get("type") != "user":
        return None, after_error
    content = message_content(entry)
    results = [
        block
        for block in (content if isinstance(content, list) else [])
        if isinstance(block, dict) and block.get("type") == "tool_result"
    ]
    if results:
        failed = [result for result in results if result.get("is_error") is True]
        if any(text_of(result.get("content")).startswith(REJECTION_PREFIX) for result in failed):
            return "rejection", True
        return None, bool(failed)
    text = text_of(content).strip()
    if text.startswith(INTERRUPT_PREFIX):
        return "interrupt", after_error
    origin = entry.get("origin")
    if after_error and text and isinstance(origin, dict) and origin.get("kind") == "human":
        return "error-then-correction", False
    return None, after_error


def entries_after_first_skill(lines: Iterable[str]) -> Iterator[dict[str, Any]]:
    """Parsed entries that follow the first Greenberry skill call (other than improve-skill).

    A line is only parsed once a skill call could be on it, so a long
    transcript with no Greenberry skill costs a substring scan.
    """
    seen = False
    for line in lines:
        if not seen and ("greenberry:" not in line or '"Skill"' not in line):
            continue
        entry = parse_entry(line)
        if entry is None:
            continue
        if seen:
            yield entry
        else:
            seen = any(
                call.startswith(SKILL_PREFIX) and call != RETROSPECTIVE_SKILL
                for call in skill_calls(entry)
            )


def find_intervention(lines: Iterable[str]) -> str | None:
    """The first intervention signal after a Greenberry skill call, or None.

    None as well when `improve-skill` ran after that call: the retrospective
    already happened.
    """
    signal: str | None = None
    after_error = False
    for entry in entries_after_first_skill(lines):
        if RETROSPECTIVE_SKILL in skill_calls(entry):
            return None
        if signal is None:
            signal, after_error = user_signal(entry, after_error)
    return signal


def run() -> None:
    payload = json.load(sys.stdin)
    if not isinstance(payload, dict) or payload.get("stop_hook_active"):
        return
    transcript = payload.get("transcript_path")
    session_id = payload.get("session_id")
    data_dir = os.environ.get("CLAUDE_PLUGIN_DATA")
    if not (isinstance(transcript, str) and isinstance(session_id, str) and data_dir):
        return
    if not SESSION_ID.fullmatch(session_id):
        return

    marker = Path(data_dir) / "improve-skill-retrospective" / session_id
    if marker.exists():
        return
    with open(transcript, encoding="utf-8") as lines:
        signal = find_intervention(lines)
    if signal is None:
        return

    marker.parent.mkdir(parents=True, exist_ok=True)
    marker.write_text(f"{signal}\n", encoding="utf-8")
    print(json.dumps({"decision": "block", "reason": REASON}))


def main() -> int:
    try:
        run()
    except Exception:  # fail open, see the module docstring
        pass
    return 0


if __name__ == "__main__":
    sys.exit(main())
