#!/usr/bin/env python3
"""Regression tests for the CLI-first connector hook."""

from __future__ import annotations

import json
import os
import stat
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("prefer_service_cli.py")


def hook_output(
    tool_name: str,
    *,
    installed: tuple[str, ...] = (),
    extra_env: dict[str, str] | None = None,
) -> dict[str, object] | None:
    """Run the hook with PATH reduced to a temp dir holding fake `installed` binaries."""
    with tempfile.TemporaryDirectory() as path_dir:
        for binary in installed:
            fake = Path(path_dir) / binary
            fake.write_text("#!/bin/sh\nexit 0\n")
            fake.chmod(fake.stat().st_mode | stat.S_IXUSR)
        env = {"PATH": path_dir}
        if extra_env:
            env.update(extra_env)
        result = subprocess.run(
            [sys.executable, str(SCRIPT)],
            input=json.dumps({"tool_name": tool_name, "tool_input": {}}),
            capture_output=True,
            check=True,
            text=True,
            env=env,
        )
    if not result.stdout.strip():
        return None
    return json.loads(result.stdout)


class PreferServiceCliTests(unittest.TestCase):
    def assert_denies(self, output: dict[str, object] | None, *fragments: str) -> None:
        self.assertIsNotNone(output)
        assert output is not None
        hook = output["hookSpecificOutput"]
        self.assertIsInstance(hook, dict)
        assert isinstance(hook, dict)
        self.assertEqual(hook["permissionDecision"], "deny")
        reason = hook["permissionDecisionReason"]
        self.assertIsInstance(reason, str)
        assert isinstance(reason, str)
        for fragment in fragments:
            self.assertIn(fragment, reason)

    def test_jira_tools_with_a_cli_equivalent_are_denied_when_jira_is_installed(self) -> None:
        for tool_name, command in (
            ("mcp__claude_ai_Atlassian__getJiraIssue", "jira issue view"),
            ("mcp__claude_ai_Atlassian_MCP__searchJiraIssuesUsingJql", "jira issue list --jql"),
            ("mcp__claude_ai_Atlassian__createJiraIssue", "jira issue create"),
            ("mcp__claude_ai_Atlassian__transitionJiraIssue", "jira issue move"),
            ("mcp__claude_ai_Atlassian__addCommentToJiraIssue", "jira issue comment add"),
            ("mcp__atlassian__getJiraIssue", "jira issue view"),
        ):
            with self.subTest(tool_name=tool_name):
                output = hook_output(tool_name, installed=("jira",))
                self.assert_denies(output, command, "references/jira.md", tool_name)

    def test_axiom_tools_with_a_cli_equivalent_are_denied_when_axiom_is_installed(self) -> None:
        for tool_name, command in (
            ("mcp__claude_ai_Axiom__queryDataset", "axiom query"),
            ("mcp__axiom__listDatasets", "axiom dataset list"),
        ):
            with self.subTest(tool_name=tool_name):
                output = hook_output(tool_name, installed=("axiom",))
                self.assert_denies(output, command, "references/axiom.md")

    def test_connector_only_tools_pass_through(self) -> None:
        for tool_name in (
            "mcp__claude_ai_Atlassian__searchConfluence",
            "mcp__claude_ai_Atlassian__getTeamworkGraphContext",
            "mcp__claude_ai_Atlassian_MCP__executeRead",
            "mcp__claude_ai_Axiom__checkMonitors",
            "mcp__claude_ai_Axiom__listDashboards",
        ):
            with self.subTest(tool_name=tool_name):
                self.assertIsNone(hook_output(tool_name, installed=("jira", "axiom")))

    def test_missing_cli_passes_the_call_through(self) -> None:
        self.assertIsNone(hook_output("mcp__claude_ai_Atlassian__getJiraIssue"))
        self.assertIsNone(hook_output("mcp__claude_ai_Axiom__queryDataset", installed=("jira",)))

    def test_bypass_env_passes_the_call_through(self) -> None:
        output = hook_output(
            "mcp__claude_ai_Atlassian__getJiraIssue",
            installed=("jira",),
            extra_env={"AIW_ALLOW_MCP": "1"},
        )
        self.assertIsNone(output)

    def test_other_servers_and_native_tools_pass_through(self) -> None:
        for tool_name in ("mcp__claude_ai_Figma__get_design_context", "Bash", "Read", "mcp__"):
            with self.subTest(tool_name=tool_name):
                self.assertIsNone(hook_output(tool_name, installed=("jira", "axiom")))

    def test_malformed_payload_is_ignored(self) -> None:
        result = subprocess.run(
            [sys.executable, str(SCRIPT)],
            input="not json",
            capture_output=True,
            check=True,
            text=True,
            env={"PATH": os.environ.get("PATH", "")},
        )
        self.assertEqual(result.stdout.strip(), "")


if __name__ == "__main__":
    unittest.main()
