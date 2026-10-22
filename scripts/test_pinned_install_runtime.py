#!/usr/bin/env python3
"""Regression tests for the pinned-install-runtime hook."""

from __future__ import annotations

import importlib.util
import json
import os
import stat
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("require_pinned_install_runtime.py")

# Node version → the npm it bundles, as nvm installs them.
NODES = {"24.13.0": "11.6.2", "24.21.0": "11.19.0", "22.11.0": "10.9.0"}


def load_hook():
    spec = importlib.util.spec_from_file_location("pinned_hook", SCRIPT)
    assert spec is not None
    assert spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    # Dataclasses look their module up in sys.modules while the class is built.
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text)


class Fixture:
    """A fake nvm dir with stub `node` binaries, and three projects."""

    def __init__(self, root: Path) -> None:
        self.root = root
        self.nvm = root / "nvm"
        for node, npm in NODES.items():
            node_dir = self.node_dir(node)
            stub = node_dir / "bin" / "node"
            write(stub, f"#!/bin/sh\necho v{node}\n")
            stub.chmod(stub.stat().st_mode | stat.S_IXUSR)
            npm_dir = node_dir / "lib" / "node_modules" / "npm"
            write(npm_dir / "package.json", json.dumps({"version": npm}))
            cli = npm_dir / "bin" / "npm-cli.js"
            write(cli, "")
            cli.chmod(cli.stat().st_mode | stat.S_IXUSR)
            (node_dir / "bin" / "npm").symlink_to(cli)
            write(node_dir / "lib" / "node_modules" / "pnpm" / "bin" / "pnpm.cjs", "")

        self.npm_project = root / "npm-project"
        write(self.npm_project / "package.json", json.dumps({"name": "npm-project"}))
        write(self.npm_project / ".nvmrc", "24.13.0\n")
        write(self.npm_project / "package-lock.json", "{}")
        (self.npm_project / "src").mkdir()

        self.pnpm_project = root / "pnpm-project"
        write(
            self.pnpm_project / "package.json",
            json.dumps(
                {"packageManager": "pnpm@10.34.6", "engines": {"node": "24.13.0"}}
            ),
        )
        write(self.pnpm_project / "pnpm-lock.yaml", "")

        self.loose_project = root / "loose-project"
        write(self.loose_project / "package.json", json.dumps({"name": "loose"}))

    def node_dir(self, version: str) -> Path:
        return self.nvm / "versions" / "node" / f"v{version}"

    def explicit(self, node: str, npm_from: str | None = None) -> str:
        cli = self.node_dir(npm_from or node) / "lib/node_modules/npm/bin/npm-cli.js"
        return f"{self.node_dir(node) / 'bin/node'} {cli}"

    def run(self, command: str, *, path_node: str, cwd: Path) -> dict[str, object] | None:
        env = {
            "PATH": f"{self.node_dir(path_node) / 'bin'}:/usr/bin:/bin",
            "NVM_DIR": str(self.nvm),
            "HOME": str(self.root),
        }
        result = subprocess.run(
            [sys.executable, str(SCRIPT)],
            input=json.dumps({"cwd": str(cwd), "tool_input": {"command": command}}),
            capture_output=True,
            check=True,
            text=True,
            env=env,
        )
        if not result.stdout.strip():
            return None
        return json.loads(result.stdout)


class PinnedInstallRuntimeTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.fx = Fixture(Path(self.tmp.name))

    def tearDown(self) -> None:
        self.tmp.cleanup()

    def assert_denies(self, output: dict[str, object] | None, *fragments: str) -> None:
        self.assertIsNotNone(output)
        assert output is not None
        hook = output["hookSpecificOutput"]
        assert isinstance(hook, dict)
        self.assertEqual(hook["permissionDecision"], "deny")
        reason = hook["permissionDecisionReason"]
        assert isinstance(reason, str)
        for fragment in fragments:
            self.assertIn(fragment, reason)

    def test_installs_on_the_pinned_runtime_pass(self) -> None:
        fx = self.fx
        for command, cwd in (
            ("npm install", fx.npm_project),
            ("npm ci", fx.npm_project / "src"),
            (f"cd {fx.npm_project} && npm ci", fx.root),
            (f"npm --prefix {fx.npm_project} install next@16.3.8", fx.root),
            ("npm update source-map-js --package-lock-only", fx.npm_project),
            ("pnpm install --frozen-lockfile", fx.pnpm_project),
            (f"pnpm -C {fx.pnpm_project} add zod@4.6.5", fx.root),
        ):
            with self.subTest(command=command):
                self.assertIsNone(fx.run(command, path_node="24.13.0", cwd=cwd))

    def test_another_node_on_path_is_denied_with_the_pinned_command(self) -> None:
        fx = self.fx
        output = fx.run("npm install", path_node="24.21.0", cwd=fx.npm_project)
        self.assert_denies(
            output,
            ".nvmrc pins Node 24.13.0, this command runs Node v24.21.0",
            "pins npm 11.6.2, this command runs npm 11.19.0",
            f"{fx.explicit('24.13.0')} install",
            '"Node and npm: the version the project pins"',
            "the user's decision",
        )

    def test_the_explicit_pinned_form_passes_whatever_is_on_path(self) -> None:
        fx = self.fx
        command = f"{fx.explicit('24.13.0')} ci"
        self.assertIsNone(fx.run(command, path_node="22.11.0", cwd=fx.npm_project))

    def test_pinned_node_with_another_npm_is_denied(self) -> None:
        fx = self.fx
        for command in (
            f"{fx.explicit('24.13.0', npm_from='24.21.0')} install",
            "npx -y npm@11.21.0 install --package-lock-only",
            "npm exec npm@11.21.0 -- update source-map-js",
        ):
            with self.subTest(command=command):
                output = fx.run(command, path_node="24.13.0", cwd=fx.npm_project)
                self.assert_denies(output, "pins npm 11.6.2")

    def test_a_pinned_npm_binary_still_runs_under_path_node(self) -> None:
        fx = self.fx
        command = f"{fx.node_dir('24.13.0') / 'bin/npm'} install"
        output = fx.run(command, path_node="22.11.0", cwd=fx.npm_project)
        self.assert_denies(output, "this command runs Node v22.11.0")

    def test_explicit_npm_pins_win_over_the_bundled_npm(self) -> None:
        fx = self.fx
        project = fx.root / "engines-project"
        write(
            project / "package.json",
            json.dumps({"engines": {"node": "^24.13.0", "npm": "11.6.2"}}),
        )
        write(project / "package-lock.json", "{}")
        output = fx.run("npm ci", path_node="24.21.0", cwd=project)
        self.assert_denies(output, "engines.npm pins npm 11.6.2, this command runs npm 11.19.0")
        self.assertNotIn("engines.node", json.dumps(output))

    def test_volta_pins_count(self) -> None:
        fx = self.fx
        project = fx.root / "volta-project"
        write(
            project / "package.json",
            json.dumps({"volta": {"node": "24.13.0", "npm": "11.6.2"}}),
        )
        output = fx.run("npm install", path_node="24.21.0", cwd=project)
        self.assert_denies(
            output,
            "volta.node pins Node 24.13.0",
            "volta.npm pins npm 11.6.2, this command runs npm 11.19.0",
            f"{fx.explicit('24.13.0')} install",
        )

    def test_a_pinned_node_that_is_not_installed_stops_for_the_user(self) -> None:
        fx = self.fx
        project = fx.root / "uninstalled-pin"
        write(project / "package.json", json.dumps({"name": "uninstalled-pin"}))
        write(project / ".nvmrc", "24.30.0\n")
        output = fx.run("npm ci", path_node="24.21.0", cwd=project)
        self.assert_denies(
            output,
            ".nvmrc pins Node 24.30.0",
            "Stop and ask the user for `nvm install 24.30.0`",
            "never fall back to the node on PATH",
        )

    def test_pnpm_projects_check_node_and_the_manager(self) -> None:
        fx = self.fx
        output = fx.run("pnpm install", path_node="22.11.0", cwd=fx.pnpm_project)
        self.assert_denies(
            output,
            "engines.node pins Node 24.13.0, this command runs Node v22.11.0",
            "pnpm/bin/pnpm.cjs install",
        )
        output = fx.run("npm install", path_node="24.13.0", cwd=fx.pnpm_project)
        self.assert_denies(output, "installs with pnpm", "this command runs npm")

    def test_global_installs_pass(self) -> None:
        fx = self.fx
        for command in (
            "npm install -g pnpm@10.34.6 --no-audit --no-fund",
            "npm i --global pnpm@10.34.6",
            "npm install --location=global pnpm@10.34.6",
        ):
            with self.subTest(command=command):
                self.assertIsNone(fx.run(command, path_node="24.21.0", cwd=fx.pnpm_project))

    def test_switching_the_engine_check_off_is_denied(self) -> None:
        fx = self.fx
        for command, cwd in (
            ("npm install --force", fx.npm_project),
            ("npm ci -f", fx.npm_project),
            ("npm ci --engine-strict=false", fx.npm_project),
            ("npm_config_engine_strict=false npm ci", fx.npm_project),
            ("env npm_config_force=true npm install", fx.npm_project),
            ("pnpm install --config.manage-package-manager-versions=false", fx.pnpm_project),
            ("pnpm install --config.engine-strict=false", fx.pnpm_project),
        ):
            with self.subTest(command=command):
                output = fx.run(command, path_node="24.13.0", cwd=cwd)
                self.assert_denies(output, "switches the engine check off")

    def test_commands_that_do_not_install_pass(self) -> None:
        fx = self.fx
        for command in (
            "npm run build",
            "npm test",
            "npm ls next",
            "npm audit --json",
            "npm outdated",
            "pnpm exec tsc --noEmit",
            "pnpm run lint",
            "npx -y @axe-core/cli https://example.com",
            'rg -n "npm install" docs',
            'git commit -m "npm install the pinned way"',
        ):
            with self.subTest(command=command):
                self.assertIsNone(fx.run(command, path_node="22.11.0", cwd=fx.npm_project))

    def test_unpinned_projects_and_no_project_pass(self) -> None:
        fx = self.fx
        self.assertIsNone(fx.run("npm install", path_node="22.11.0", cwd=fx.loose_project))
        self.assertIsNone(fx.run("npm install", path_node="22.11.0", cwd=fx.root))

    def test_unreadable_pins_are_not_judged(self) -> None:
        fx = self.fx
        project = fx.root / "alias-project"
        write(project / "package.json", json.dumps({"engines": {"node": "lts"}}))
        write(project / ".nvmrc", "lts/*\n")
        self.assertIsNone(fx.run("npm install", path_node="22.11.0", cwd=project))

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


class RangeTests(unittest.TestCase):
    def test_ranges(self) -> None:
        hook = load_hook()
        version = hook.parse_version("v24.21.0")
        for spec, expected in (
            ("24.21.0", True),
            ("v24.21.0", True),
            ("24.13.0", False),
            ("24", True),
            ("24.x", True),
            ("24.13.x", False),
            ("^24.13.0", True),
            ("^22.11.0", False),
            ("~24.13.0", False),
            ("~24.21.0", True),
            (">=22.11.0", True),
            (">=22 <24", False),
            (">= 22.11.0 < 25", True),
            ("22.x || 24.x", True),
            ("20.x || 22.x", False),
            ("24.0.0 - 24.30.0", True),
            ("*", True),
            ("lts", None),
        ):
            with self.subTest(spec=spec):
                self.assertEqual(hook.satisfies(version, spec), expected)

    def test_nvmrc_semantics(self) -> None:
        hook = load_hook()
        version = hook.parse_version("24.13.0")
        for spec, expected in (
            ("24.13.0", True),
            ("v24.13.0", True),
            ("24", True),
            ("24.13", True),
            ("24.21", False),
            ("22", False),
            ("lts/*", None),
            ("node", None),
        ):
            with self.subTest(spec=spec):
                self.assertEqual(hook.nvm_satisfies(version, spec), expected)


if __name__ == "__main__":
    unittest.main()
