#!/usr/bin/env python3
"""Regression tests for the migration guard in the project settings template.

The guard is an inline PreToolUse(Bash) hook in
templates/project-claude-settings.json, synced into every project. These tests
run that exact command through a shell, the way Claude Code runs it.
"""

from __future__ import annotations

import json
import subprocess
import unittest
from pathlib import Path


TEMPLATE = Path(__file__).resolve().parent.parent / "templates" / "project-claude-settings.json"


def guard_command() -> str:
    settings = json.loads(TEMPLATE.read_text(encoding="utf8"))
    for entry in settings["hooks"]["PreToolUse"]:
        if entry.get("matcher") != "Bash":
            continue
        for hook in entry["hooks"]:
            command = hook.get("command", "")
            if "permissionDecision" in command and "migrat" in command:
                return command
    raise AssertionError("no migration guard in templates/project-claude-settings.json")


GUARD = guard_command()


def decision(command: str) -> str | None:
    payload = json.dumps({"tool_name": "Bash", "tool_input": {"command": command}})
    result = subprocess.run(
        ["/bin/sh", "-c", GUARD],
        input=payload,
        capture_output=True,
        check=True,
        text=True,
    )
    if not result.stdout.strip():
        return None
    return json.loads(result.stdout)["hookSpecificOutput"]["permissionDecision"]


class MigrationGuardTests(unittest.TestCase):
    def test_every_migrate_script_is_denied(self) -> None:
        for command in (
            "pnpm run migrate",
            "pnpm migrate",
            "npm run migrate:status",
            "pnpm run migrate:create",
            "pnpm run migrate:fresh",
            "pnpm run migrate:reset",
            "yarn migrate",
            "bun run migrate",
            "pnpm run _env payload migrate",
            "npx payload migrate:status",
            "pnpm exec payload migrate",
            "pnpm --dir /repo run migrate",
        ):
            with self.subTest(command=command):
                self.assertEqual(decision(command), "deny")

    def test_chained_wrapped_and_prefixed_runs_are_denied(self) -> None:
        for command in (
            "pnpm run db:up && pnpm run migrate",
            "cd app; pnpm run migrate",
            "NODE_ENV=development pnpm run migrate",
            "env NODE_ENV=development pnpm run migrate",
            "bash -lc 'pnpm run migrate'",
            "git status\npnpm run migrate",
            "echo it's done; pnpm run migrate",
        ):
            with self.subTest(command=command):
                self.assertEqual(decision(command), "deny")

    def test_mentions_and_other_scripts_pass(self) -> None:
        for command in (
            'rg -n "pnpm run migrate" docs',
            'git commit -m "docs: the developer runs pnpm run migrate"',
            'echo "pnpm migrate"',
            'glab mr create --title "docs: leave pnpm run migrate to the developer"',
            'jq -r ".scripts.migrate" package.json',
            "pnpm run test",
            "pnpm run db:up",
            "pnpm run generate:types",
            "pnpm run migrate-notes",
            "node scripts/migration-report.js",
        ):
            with self.subTest(command=command):
                self.assertIsNone(decision(command))

    def test_separators_inside_quotes_do_not_split_the_command(self) -> None:
        for command in (
            'rg -n "db:up|pnpm run migrate:fresh" docs',
            'git commit -m "docs: seed first; pnpm run migrate after"',
            "echo 'pnpm run db:up && pnpm run migrate'",
        ):
            with self.subTest(command=command):
                self.assertIsNone(decision(command))


if __name__ == "__main__":
    unittest.main()
