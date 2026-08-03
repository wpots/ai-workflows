#!/usr/bin/env python3
"""Force a Claude permission prompt for process-termination commands."""

from __future__ import annotations

import json
import re
import shlex
import sys
from pathlib import PurePath
from typing import Any


TERMINATION_COMMANDS = {"kill", "killall", "pkill", "taskkill"}
SHELL_COMMANDS = {"bash", "dash", "sh", "zsh"}
WRAPPER_COMMANDS = {"builtin", "command", "env", "nohup", "sudo", "xargs"}
SEGMENT_SEPARATOR = re.compile(r"(?:&&|\|\||[;|\n])")
ASSIGNMENT = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*=")


def command_name(token: str) -> str:
    normalized = token.strip("()")
    return PurePath(normalized.replace("\\", "/")).name.lower()


def shell_payload(tokens: list[str]) -> str | None:
    for index, token in enumerate(tokens):
        if token in {"-c", "-lc"} and index + 1 < len(tokens):
            return tokens[index + 1]
    return None


def segment_requests_termination(segment: str) -> bool:
    try:
        tokens = shlex.split(segment, posix=True)
    except ValueError:
        # An unparseable command is ambiguous. Only escalate when it still
        # contains a termination utility as a distinct word.
        return bool(re.search(r"\b(?:kill|killall|pkill|taskkill)\b", segment))

    while tokens and (ASSIGNMENT.match(tokens[0]) or tokens[0] in {"(", ")"}):
        tokens.pop(0)

    if not tokens:
        return False

    executable = command_name(tokens[0])
    if executable in TERMINATION_COMMANDS:
        return True

    if executable in SHELL_COMMANDS:
        payload = shell_payload(tokens[1:])
        return payload is not None and command_requests_termination(payload)

    if executable in WRAPPER_COMMANDS:
        return any(command_name(token) in TERMINATION_COMMANDS for token in tokens[1:])

    return False


def command_requests_termination(command: str) -> bool:
    return any(
        segment_requests_termination(segment)
        for segment in SEGMENT_SEPARATOR.split(command)
        if segment.strip()
    )


def main() -> None:
    try:
        payload: dict[str, Any] = json.load(sys.stdin)
    except (json.JSONDecodeError, TypeError):
        return

    tool_input = payload.get("tool_input")
    if not isinstance(tool_input, dict):
        return

    command = tool_input.get("command")
    if not isinstance(command, str) or not command_requests_termination(command):
        return

    print(
        json.dumps(
            {
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "permissionDecision": "ask",
                    "permissionDecisionReason": (
                        "Process termination requires explicit approval. Verify "
                        "the exact PIDs and commands before approving. Never "
                        "terminate Visual Studio Code, Code, or Code Helper "
                        "without approval for those exact targets."
                    ),
                }
            }
        )
    )


if __name__ == "__main__":
    main()
