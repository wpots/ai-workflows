#!/usr/bin/env python3
"""Regression tests for the ticket-transition approval hook."""

from __future__ import annotations

import json
import subprocess
import sys
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("require_ticket_transition_approval.py")


def guard_output(payload: dict[str, object]) -> dict[str, object] | None:
    result = subprocess.run(
        [sys.executable, str(SCRIPT)],
        input=json.dumps(payload),
        capture_output=True,
        check=True,
        text=True,
    )
    if not result.stdout.strip():
        return None
    return json.loads(result.stdout)


def bash(command: str) -> dict[str, object]:
    return {"tool_name": "Bash", "tool_input": {"command": command}}


def connector(tool_name: str) -> dict[str, object]:
    return {"tool_name": tool_name, "tool_input": {"issueIdOrKey": "RFW-1"}}


class TicketTransitionApprovalTests(unittest.TestCase):
    def assert_asks(self, payload: dict[str, object]) -> None:
        output = guard_output(payload)
        self.assertIsNotNone(output)
        assert output is not None
        hook_output = output["hookSpecificOutput"]
        self.assertIsInstance(hook_output, dict)
        assert isinstance(hook_output, dict)
        self.assertEqual(hook_output["permissionDecision"], "ask")

    def test_jira_issue_move_and_aliases_ask(self) -> None:
        for command in (
            'jira issue move RFW-1 "Done"',
            'jira issue move RFW-1 "In Review" --comment "deployed"',
            "jira issue transition RFW-1 Done",
            "jira issues mv RFW-1 Done",
            "jira -p RFW issue move RFW-1 Done",
            "jira issue --project RFW move RFW-1 Done",
            "/opt/homebrew/bin/jira issue move RFW-1 Done",
        ):
            with self.subTest(command=command):
                self.assert_asks(bash(command))

    def test_wrapped_and_chained_moves_ask(self) -> None:
        for command in (
            'JIRA_API_TOKEN="$(security find-generic-password -a "$USER" -s JIRA_API_TOKEN -w)" jira issue move RFW-1 Done',
            "cd app && jira issue move RFW-1 Done",
            "bash -lc 'jira issue move RFW-1 Done'",
            "echo RFW-1 | xargs -I{} jira issue move {} Done",
            "env JIRA_CONFIG_FILE=/tmp/c.yml jira issue move RFW-1 Done",
        ):
            with self.subTest(command=command):
                self.assert_asks(bash(command))

    def test_connector_transition_asks(self) -> None:
        for tool_name in (
            "mcp__claude_ai_Atlassian__transitionJiraIssue",
            "mcp__claude_ai_Atlassian_MCP__transitionJiraIssue",
            "mcp__atlassian__transitionJiraIssue",
        ):
            with self.subTest(tool_name=tool_name):
                self.assert_asks(connector(tool_name))

    def test_reads_and_other_writes_do_not_ask(self) -> None:
        for command in (
            "jira issue view RFW-1 --plain --comments 10",
            "jira issue list --jql 'status = \"Done\"' --plain",
            "jira issue edit RFW-1 --label v1.2.0 --no-input",
            "jira issue comment add RFW-1 -T comment.md --no-input",
            "jira -p move issue list",
            "jira sprint list --plain",
            'rg -n "jira issue move" skills',
            'git commit -m "docs: jira issue move only on a go"',
            'printf "jira issue move RFW-1 Done"',
        ):
            with self.subTest(command=command):
                self.assertIsNone(guard_output(bash(command)))

    def test_connector_reads_do_not_ask(self) -> None:
        for tool_name in (
            "mcp__claude_ai_Atlassian__getJiraIssue",
            "mcp__claude_ai_Atlassian__getTransitionsForJiraIssue",
            "transitionJiraIssue",
        ):
            with self.subTest(tool_name=tool_name):
                self.assertIsNone(guard_output(connector(tool_name)))


if __name__ == "__main__":
    unittest.main()
