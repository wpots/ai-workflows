#!/usr/bin/env python3
"""Regression tests for the process-termination approval hook."""

from __future__ import annotations

import json
import subprocess
import sys
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("require_process_termination_approval.py")


def guard_output(command: str) -> dict[str, object] | None:
    result = subprocess.run(
        [sys.executable, str(SCRIPT)],
        input=json.dumps({"tool_input": {"command": command}}),
        capture_output=True,
        check=True,
        text=True,
    )
    if not result.stdout.strip():
        return None
    return json.loads(result.stdout)


class ProcessTerminationApprovalTests(unittest.TestCase):
    def assert_asks(self, command: str) -> None:
        output = guard_output(command)
        self.assertIsNotNone(output)
        assert output is not None
        hook_output = output["hookSpecificOutput"]
        self.assertIsInstance(hook_output, dict)
        assert isinstance(hook_output, dict)
        self.assertEqual(hook_output["permissionDecision"], "ask")

    def test_direct_termination_commands_ask(self) -> None:
        for command in (
            "kill 123",
            'pkill -f "npm run dev"',
            "killall Code",
            "taskkill /PID 123",
            "sudo /bin/kill -TERM 123",
        ):
            with self.subTest(command=command):
                self.assert_asks(command)

    def test_pipeline_and_shell_wrappers_ask(self) -> None:
        for command in (
            "lsof -ti:3000 | xargs kill",
            "bash -lc 'killall Code'",
            "cd app && command kill 123",
        ):
            with self.subTest(command=command):
                self.assert_asks(command)

    def test_read_only_mentions_do_not_ask(self) -> None:
        for command in (
            'rg -n "kill" shared/safety.md',
            'printf "kill 123"',
            "lsof -ti:3000",
            "git log --grep kill",
        ):
            with self.subTest(command=command):
                self.assertIsNone(guard_output(command))


if __name__ == "__main__":
    unittest.main()
