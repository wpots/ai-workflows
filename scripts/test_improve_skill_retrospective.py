#!/usr/bin/env python3
"""Regression tests for the improve-skill retrospective Stop hook.

The entries mirror the shape Claude Code writes to a transcript: assistant
`tool_use` blocks, user entries holding `tool_result` blocks, and human turns
carrying `origin.kind == "human"`.
"""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from typing import Any


SCRIPT = Path(__file__).with_name("improve_skill_retrospective.py")
SESSION = "11111111-2222-3333-4444-555555555555"


def skill_call(name: str) -> dict[str, Any]:
    return {
        "type": "assistant",
        "message": {
            "role": "assistant",
            "content": [{"type": "tool_use", "id": "toolu_1", "name": "Skill", "input": {"skill": name}}],
        },
    }


def tool_result(text: str, *, is_error: bool) -> dict[str, Any]:
    return {
        "type": "user",
        "message": {
            "role": "user",
            "content": [{"type": "tool_result", "tool_use_id": "toolu_1", "content": text, "is_error": is_error}],
        },
        "toolUseResult": text,
    }


def human(text: str) -> dict[str, Any]:
    return {"type": "user", "origin": {"kind": "human"}, "message": {"role": "user", "content": text}}


def interrupt() -> dict[str, Any]:
    return {
        "type": "user",
        "message": {"role": "user", "content": [{"type": "text", "text": "[Request interrupted by user]"}]},
    }


def notification() -> dict[str, Any]:
    return {
        "type": "user",
        "origin": {"kind": "task-notification", "producer": "session-task"},
        "message": {"role": "user", "content": "<task-notification>done</task-notification>"},
    }


def assistant_text(text: str) -> dict[str, Any]:
    return {"type": "assistant", "message": {"role": "assistant", "content": [{"type": "text", "text": text}]}}


REJECTION = "The user doesn't want to proceed with this tool use. The tool use was rejected."


class ImproveSkillRetrospectiveTests(unittest.TestCase):
    def setUp(self) -> None:
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.dir = Path(tmp.name)
        self.data_dir = self.dir / "data"

    def transcript(self, entries: list[dict[str, Any]], extra_lines: tuple[str, ...] = ()) -> Path:
        path = self.dir / "transcript.jsonl"
        lines = [json.dumps(entry) for entry in entries] + list(extra_lines)
        path.write_text("\n".join(lines) + "\n", encoding="utf-8")
        return path

    def run_hook(
        self,
        transcript: Path,
        *,
        stop_hook_active: bool = False,
        with_data_dir: bool = True,
    ) -> dict[str, Any] | None:
        payload = {
            "session_id": SESSION,
            "transcript_path": str(transcript),
            "hook_event_name": "Stop",
            "stop_hook_active": stop_hook_active,
        }
        env = {"CLAUDE_PLUGIN_DATA": str(self.data_dir)} if with_data_dir else {}
        result = subprocess.run(
            [sys.executable, str(SCRIPT)],
            input=json.dumps(payload),
            capture_output=True,
            check=True,
            text=True,
            env=env,
        )
        return json.loads(result.stdout) if result.stdout.strip() else None

    def assert_blocks(self, output: dict[str, Any] | None) -> None:
        self.assertIsNotNone(output)
        assert output is not None
        self.assertEqual(output["decision"], "block")
        self.assertIn("/greenberry:improve-skill", output["reason"])
        self.assertIn("Do not run improve-skill", output["reason"])

    def test_a_clean_skill_run_stays_quiet(self) -> None:
        path = self.transcript(
            [human("close the sprint"), skill_call("greenberry:close-sprint"), tool_result("ok", is_error=False), assistant_text("done")]
        )
        self.assertIsNone(self.run_hook(path))

    def test_an_interrupt_after_a_skill_call_blocks_once(self) -> None:
        path = self.transcript([skill_call("greenberry:create-pr"), interrupt()])
        self.assert_blocks(self.run_hook(path))
        self.assertTrue((self.data_dir / "improve-skill-retrospective" / SESSION).exists())
        self.assertIsNone(self.run_hook(path), "a second Stop in the same session must stay quiet")

    def test_an_explicit_rejection_blocks(self) -> None:
        path = self.transcript([skill_call("greenberry:work-backlog"), tool_result(REJECTION, is_error=True)])
        self.assert_blocks(self.run_hook(path))

    def test_an_error_followed_by_a_human_turn_blocks(self) -> None:
        path = self.transcript(
            [skill_call("greenberry:code-review"), tool_result("exit 1", is_error=True), human("no, use the other branch")]
        )
        self.assert_blocks(self.run_hook(path))

    def test_an_error_alone_or_a_human_turn_alone_stays_quiet(self) -> None:
        errored = self.transcript([skill_call("greenberry:code-review"), tool_result("exit 1", is_error=True)])
        self.assertIsNone(self.run_hook(errored))
        talked = self.transcript([skill_call("greenberry:code-review"), human("thanks, next task")])
        self.assertIsNone(self.run_hook(talked))

    def test_an_error_the_run_recovered_from_is_not_an_intervention(self) -> None:
        # The shape of the real sessions: a routine tool error, later successful
        # work, then the user approving the next step.
        path = self.transcript(
            [
                skill_call("greenberry:code-review"),
                tool_result("No such tool available: Grep", is_error=True),
                tool_result("12 passing", is_error=False),
                assistant_text("Review done. Post the comments?"),
                human("post them"),
            ]
        )
        self.assertIsNone(self.run_hook(path))

    def test_no_skill_call_stays_quiet(self) -> None:
        path = self.transcript([human("hi"), interrupt(), tool_result(REJECTION, is_error=True)])
        self.assertIsNone(self.run_hook(path))

    def test_a_non_greenberry_skill_stays_quiet(self) -> None:
        path = self.transcript([skill_call("some-other-plugin:thing"), interrupt()])
        self.assertIsNone(self.run_hook(path))

    def test_a_signal_before_the_skill_call_does_not_count(self) -> None:
        path = self.transcript([interrupt(), skill_call("greenberry:create-pr"), tool_result("ok", is_error=False)])
        self.assertIsNone(self.run_hook(path))

    def test_improve_skill_having_run_stays_quiet(self) -> None:
        path = self.transcript([skill_call("greenberry:create-pr"), interrupt(), skill_call("greenberry:improve-skill")])
        self.assertIsNone(self.run_hook(path))
        only_retro = self.transcript([skill_call("greenberry:improve-skill"), interrupt()])
        self.assertIsNone(self.run_hook(only_retro))

    def test_quoted_phrases_in_notes_and_attachments_are_not_signals(self) -> None:
        quoted = "memory note: [Request interrupted by user] and " + REJECTION
        path = self.transcript(
            [
                skill_call("greenberry:work-backlog"),
                {"type": "attachment", "attachment": {"type": "text", "content": quoted}},
                tool_result(quoted, is_error=False),
                assistant_text(quoted),
            ]
        )
        self.assertIsNone(self.run_hook(path))

    def test_a_task_notification_after_an_error_is_not_a_correction(self) -> None:
        path = self.transcript([skill_call("greenberry:watch-mrs"), tool_result("exit 1", is_error=True), notification()])
        self.assertIsNone(self.run_hook(path))

    def test_stop_hook_active_stays_quiet(self) -> None:
        path = self.transcript([skill_call("greenberry:create-pr"), interrupt()])
        self.assertIsNone(self.run_hook(path, stop_hook_active=True))

    def test_it_fails_open(self) -> None:
        path = self.transcript([skill_call("greenberry:create-pr"), interrupt()])
        self.assertIsNone(self.run_hook(path, with_data_dir=False), "no plugin data dir: nothing bounds the prompt")
        self.assertIsNone(self.run_hook(self.dir / "missing.jsonl"))
        garbled = self.transcript([skill_call("greenberry:create-pr")], extra_lines=("{not json", "[1, 2]"))
        self.assertIsNone(self.run_hook(garbled))

    def test_a_malformed_line_does_not_hide_a_later_signal(self) -> None:
        path = self.transcript([skill_call("greenberry:create-pr")], extra_lines=("{not json",))
        with path.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(interrupt()) + "\n")
        self.assert_blocks(self.run_hook(path))


if __name__ == "__main__":
    unittest.main()
