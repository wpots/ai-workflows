#!/usr/bin/env python3
"""Deny a connector (MCP) call that has a CLI equivalent while that CLI is installed.

The CLI-first rule in docs/tooling.md: GitLab, Jira and Axiom go through
`glab`, `jira` and `axiom`; a connector tool is for what the CLI cannot reach.
This hook turns that preference into a guarantee for the two services that
have a connector today. A denied call tells the model which command to run
instead, so the switch costs no human attention. A connector tool without a
CLI equivalent (Confluence, Teamwork Graph, Axiom monitors) passes through,
and so does everything when the CLI is not on PATH or AIW_ALLOW_MCP is set.
"""

from __future__ import annotations

import json
import os
import shutil
import sys
from collections.abc import Callable
from typing import Any


BYPASS_ENV = "AIW_ALLOW_MCP"

# Connector tool name (the part after the last `__`) → the CLI command to run instead.
JIRA_EQUIVALENTS: dict[str, str] = {
    "getJiraIssue": "jira issue view <KEY> --raw | jq '{key, summary: .fields.summary, status: .fields.status.name}'",
    "searchJiraIssuesUsingJql": "jira issue list --jql '<JQL>' --raw | jq '.[] | {key, summary: .fields.summary, status: .fields.status.name}'",
    "createJiraIssue": "jira issue create -p <KEY> -t <Type> -s '<summary>' -a '<email>' -T <body.md> --no-input",
    "editJiraIssue": "jira issue edit <KEY> … --no-input",
    "transitionJiraIssue": "jira issue move <KEY> '<State>'",
    "addCommentToJiraIssue": "jira issue comment add <KEY> -T <comment.md> --no-input",
    "addOrEditJiraIssueComment": "jira issue comment add <KEY> -T <comment.md> --no-input",
    "getVisibleJiraProjects": "jira project list",
    "addWorklogToJiraIssue": "jira issue worklog add <KEY> '<duration>'",
    "createIssueLink": "jira issue link <KEY-1> <KEY-2> '<Link type>'",
}

AXIOM_EQUIVALENTS: dict[str, str] = {
    "queryDataset": 'axiom query "<APL>" -f json',
    "listDatasets": "axiom dataset list",
    "createDataset": "axiom dataset create",
}

# (substring of the lower-cased server segment, CLI binary, equivalents, recipes)
SERVICES: tuple[tuple[str, str, dict[str, str], str], ...] = (
    ("atlassian", "jira", JIRA_EQUIVALENTS, "skills/service-cli/references/jira.md"),
    ("jira", "jira", JIRA_EQUIVALENTS, "skills/service-cli/references/jira.md"),
    ("axiom", "axiom", AXIOM_EQUIVALENTS, "skills/service-cli/references/axiom.md"),
)


def split_tool_name(tool_name: str) -> tuple[str, str] | None:
    """`mcp__<server>__<tool>` → (server, tool); None for any other tool."""
    parts = tool_name.split("__")
    if len(parts) < 3 or parts[0] != "mcp":
        return None
    return "__".join(parts[1:-1]).lower(), parts[-1]


def cli_equivalent(
    tool_name: str,
    which: Callable[[str], str | None] = shutil.which,
) -> tuple[str, str, str] | None:
    """(binary, command, recipes) when the call should go through the CLI instead."""
    split = split_tool_name(tool_name)
    if split is None:
        return None
    server, tool = split
    for marker, binary, equivalents, recipes in SERVICES:
        if marker not in server:
            continue
        command = equivalents.get(tool)
        if command is None or which(binary) is None:
            return None
        return binary, command, recipes
    return None


def main() -> None:
    if os.environ.get(BYPASS_ENV):
        return

    try:
        payload: dict[str, Any] = json.load(sys.stdin)
    except (json.JSONDecodeError, TypeError):
        return

    tool_name = payload.get("tool_name")
    if not isinstance(tool_name, str):
        return

    match = cli_equivalent(tool_name)
    if match is None:
        return

    binary, command, recipes = match
    print(
        json.dumps(
            {
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "permissionDecision": "deny",
                    "permissionDecisionReason": (
                        f"CLI first (docs/tooling.md): `{binary}` is installed, so run "
                        f"`{command}` instead of {tool_name}. Recipes: {recipes}. "
                        f"Set {BYPASS_ENV}=1 to switch this off for a session."
                    ),
                }
            }
        )
    )


if __name__ == "__main__":
    main()
