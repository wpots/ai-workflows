#!/usr/bin/env python3
"""Force a Claude permission prompt before a Jira ticket changes status.

Jira's automation moves tickets from the pipeline, so a status change is a
human decision (skills/service-cli § Ticket status). This hook asks the user
before every `jira issue move` (aliases `transition` and `mv`, and `issues`
for `issue`) and every connector `transitionJiraIssue` call, even where an
allow rule such as `Bash(jira *)` would let it through. A connector call the
CLI-first gate denies stays denied: deny wins over ask.
"""

from __future__ import annotations

import json
import re
import shlex
import sys
from pathlib import PurePath
from typing import Any


ISSUE_GROUPS = {"issue", "issues"}
MOVE_COMMANDS = {"move", "transition", "mv"}
# jira-cli's persistent flags that take a value; skipping the value keeps a
# project named "move" from reading as the subcommand.
VALUE_FLAGS = {"-c", "--config", "-p", "--project"}
CONNECTOR_TOOL = "transitionJiraIssue"
SHELL_COMMANDS = {"bash", "dash", "sh", "zsh"}
WRAPPER_COMMANDS = {"builtin", "command", "env", "nohup", "sudo", "xargs"}
SEGMENT_SEPARATOR = re.compile(r"(?:&&|\|\||[;|\n])")
ASSIGNMENT = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*=")
UNPARSEABLE_MOVE = re.compile(r"\bjira\b.*\bissues?\b.*\b(?:move|transition|mv)\b")

REASON = (
    "A Jira status change needs the user's go on this ticket "
    "(skills/service-cli § Ticket status): Jira's automation moves tickets "
    "from the pipeline. Approve only when you asked for this transition and "
    "confirmed the key and the target status."
)


def command_name(token: str) -> str:
    normalized = token.strip("()")
    return PurePath(normalized.replace("\\", "/")).name.lower()


def shell_payload(tokens: list[str]) -> str | None:
    for index, token in enumerate(tokens):
        if token in {"-c", "-lc"} and index + 1 < len(tokens):
            return tokens[index + 1]
    return None


def is_move(jira_args: list[str]) -> bool:
    """True when the arguments after `jira` name `issue move` or an alias."""
    words: list[str] = []
    skip_value = False
    for token in jira_args:
        if skip_value:
            skip_value = False
            continue
        if token in VALUE_FLAGS:
            skip_value = True
            continue
        if token.startswith("-"):
            continue
        words.append(token)
        if len(words) == 2:
            break
    return len(words) == 2 and words[0] in ISSUE_GROUPS and words[1] in MOVE_COMMANDS


def segment_moves_ticket(segment: str) -> bool:
    try:
        tokens = shlex.split(segment, posix=True)
    except ValueError:
        # An unparseable command is ambiguous. Only escalate when it still
        # reads as a jira issue move.
        return bool(UNPARSEABLE_MOVE.search(segment))

    while tokens and (ASSIGNMENT.match(tokens[0]) or tokens[0] in {"(", ")"}):
        tokens.pop(0)

    if not tokens:
        return False

    executable = command_name(tokens[0])
    if executable == "jira":
        return is_move(tokens[1:])

    if executable in SHELL_COMMANDS:
        payload = shell_payload(tokens[1:])
        return payload is not None and command_moves_ticket(payload)

    if executable in WRAPPER_COMMANDS:
        for index, token in enumerate(tokens[1:], start=1):
            if command_name(token) == "jira":
                return is_move(tokens[index + 1 :])

    return False


def command_moves_ticket(command: str) -> bool:
    return any(
        segment_moves_ticket(segment)
        for segment in SEGMENT_SEPARATOR.split(command)
        if segment.strip()
    )


def is_connector_transition(tool_name: str) -> bool:
    parts = tool_name.split("__")
    return len(parts) >= 3 and parts[0] == "mcp" and parts[-1] == CONNECTOR_TOOL


def main() -> None:
    try:
        payload: dict[str, Any] = json.load(sys.stdin)
    except (json.JSONDecodeError, TypeError):
        return

    tool_name = payload.get("tool_name")
    tool_input = payload.get("tool_input")
    command = tool_input.get("command") if isinstance(tool_input, dict) else None

    connector = isinstance(tool_name, str) and is_connector_transition(tool_name)
    cli = isinstance(command, str) and command_moves_ticket(command)
    if not (connector or cli):
        return

    print(
        json.dumps(
            {
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "permissionDecision": "ask",
                    "permissionDecisionReason": REASON,
                }
            }
        )
    )


if __name__ == "__main__":
    main()
