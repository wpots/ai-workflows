#!/usr/bin/env python3
"""Deny a package-manager install that runs on another runtime than the project pins.

Enforces the ambient rule "Node and npm: the version the project pins"
(CLAUDE.md, Shell Usage). An install has to run on the Node the project pins
(`.nvmrc`, `.node-version`, Volta, `engines.node`, `devEngines.runtime`) and
on the npm bundled with that Node, unless `packageManager`, `engines.npm`,
Volta or `devEngines.packageManager` names another. pnpm's own version is left
to pnpm: pnpm 10 switches to the `packageManager` version by itself.

The hook measures `node` and `npm` on its own PATH, or the binaries a command
names by absolute path, or the fnm install that `fnm exec` selects. A denied
install gets the exact command on the pinned runtime — `fnm exec` when fnm has
the pinned Node, otherwise the nvm install of it — so the agent can proceed
without a human, unless that Node is not installed or the pin itself has to
move, which is the user's call.
"""

from __future__ import annotations

import json
import os
import re
import shlex
import shutil
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path, PurePath
from typing import Any


QUICK_MATCH = re.compile(r"\b(?:npm|pnpm|npx)\b|npm-cli\.js")
SEGMENT_SEPARATOR = re.compile(r"(?:&&|\|\||[;|\n])")
ASSIGNMENT = re.compile(r"^([A-Za-z_][A-Za-z0-9_]*)=(.*)$")

NPM_INSTALLS = {
    "install", "i", "add", "ci", "clean-install", "update", "up", "upgrade",
    "uninstall", "remove", "rm", "un", "dedupe", "prune",
}
PNPM_INSTALLS = {
    "install", "i", "add", "update", "up", "upgrade", "remove", "rm",
    "uninstall", "un", "dedupe", "import",
}
# Flags whose value is the next token, so it is not taken for the subcommand.
VALUE_FLAGS = {
    "--prefix", "-C", "--dir", "--cache", "--registry", "--userconfig",
    "--workspace", "-w", "--filter", "-F", "--loglevel",
}
OVERRIDE_FLAGS = {
    "--engine-strict=false",
    "--no-engine-strict",
    "--config.engine-strict=false",
    "--config.manage-package-manager-versions=false",
    "--config.package-manager-strict=false",
}
NPM_OVERRIDE_FLAGS = {"--force", "-f"}
OVERRIDE_ENV = {"npm_config_engine_strict": "false", "npm_config_force": "true"}

Version = tuple[int, int, int]


@dataclass
class Invocation:
    manager: str
    args: list[str]
    node_binary: str | None = None
    npm_entry: str | None = None
    npm_version: str | None = None
    env: dict[str, str] = field(default_factory=dict)
    # `fnm exec`: None when the command does not run through it, "" without --using.
    fnm_using: str | None = None


@dataclass
class Pin:
    source: str
    spec: str
    nvm_style: bool = False


# ── Versions and ranges ──────────────────────────────────────────────────────


def parse_version(text: str) -> Version | None:
    match = re.match(r"^\s*v?(\d+)\.(\d+)\.(\d+)", text)
    if match is None:
        return None
    return int(match[1]), int(match[2]), int(match[3])


def partial_bounds(text: str) -> tuple[Version, Version | None, int] | None:
    """`24` / `24.x` / `24.13` / `24.13.0` → (lower, exclusive upper, given parts)."""
    text = text.strip().lstrip("v=")
    if text in {"", "*", "x", "X"}:
        return (0, 0, 0), None, 0
    parts = re.split(r"[-+]", text, maxsplit=1)[0].split(".")
    numbers: list[int] = []
    for part in parts[:3]:
        if part in {"x", "X", "*"}:
            break
        if not part.isdigit():
            return None
        numbers.append(int(part))
    given = len(numbers)
    if given == 0:
        return (0, 0, 0), None, 0
    lower_parts = numbers + [0] * (3 - given)
    lower = (lower_parts[0], lower_parts[1], lower_parts[2])
    if given == 3:
        return lower, None, 3
    upper_parts = numbers[:]
    upper_parts[-1] += 1
    upper_parts += [0] * (3 - given)
    return lower, (upper_parts[0], upper_parts[1], upper_parts[2]), given


def comparator_holds(version: Version, comparator: str) -> bool | None:
    match = re.match(r"^(\^|~>?|>=|<=|>|<|=)?\s*(.*)$", comparator)
    if match is None:
        return None
    operator, rest = match[1] or "", match[2]
    bounds = partial_bounds(rest)
    if bounds is None:
        return None
    lower, upper, given = bounds
    if given == 0:
        return True
    exact = given == 3
    if operator in {"", "="}:
        return version == lower if exact else lower <= version < (upper or lower)
    if operator == ">=":
        return version >= lower
    if operator == ">":
        return version > lower if exact else version >= (upper or lower)
    if operator == "<":
        return version < lower
    if operator == "<=":
        return version <= lower if exact else version < (upper or lower)
    if operator.startswith("~"):
        ceiling = (lower[0], lower[1] + 1, 0) if given >= 2 else (lower[0] + 1, 0, 0)
        return lower <= version < ceiling
    # Caret: the leftmost non-zero part given may not change.
    if lower[0] > 0 or given == 1:
        ceiling = (lower[0] + 1, 0, 0)
    elif lower[1] > 0 or given == 2:
        ceiling = (0, lower[1] + 1, 0)
    else:
        ceiling = (0, 0, lower[2] + 1)
    return lower <= version < ceiling


def satisfies(version: Version, spec: str) -> bool | None:
    """node-semver subset; None when the range uses syntax this does not read."""
    results: list[bool] = []
    for alternative in spec.split("||"):
        alternative = alternative.strip()
        hyphen = re.match(r"^(\S+)\s+-\s+(\S+)$", alternative)
        if hyphen:
            comparators = [f">={hyphen[1]}", f"<={hyphen[2]}"]
        else:
            comparators = re.findall(r"(?:\^|~>?|>=|<=|>|<|=)?\s*[^\s<>=^~]+", alternative)
            if not comparators:
                comparators = ["*"]
        holds: list[bool] = []
        for comparator in comparators:
            outcome = comparator_holds(version, comparator.strip())
            if outcome is None:
                return None
            holds.append(outcome)
        results.append(all(holds))
    return any(results)


def nvm_satisfies(version: Version, spec: str) -> bool | None:
    """`.nvmrc` semantics: `24` is any 24.x, `24.13` any 24.13.x; aliases are not read."""
    text = spec.strip().lstrip("v")
    if not re.fullmatch(r"\d+(?:\.\d+){0,2}", text):
        return None
    wanted = [int(part) for part in text.split(".")]
    return list(version[: len(wanted)]) == wanted


def pin_holds(pin: Pin, version: Version) -> bool | None:
    return nvm_satisfies(version, pin.spec) if pin.nvm_style else satisfies(version, pin.spec)


# ── The project ──────────────────────────────────────────────────────────────


def project_root(start: Path) -> Path | None:
    for directory in (start, *start.parents):
        if (directory / "package.json").is_file():
            return directory
    return None


def read_json(path: Path) -> dict[str, Any] | None:
    try:
        data = json.loads(path.read_text())
    except (OSError, ValueError):
        return None
    return data if isinstance(data, dict) else None


def dev_engine_versions(manifest: dict[str, Any], key: str, name: str) -> list[str]:
    dev_engines = manifest.get("devEngines")
    if not isinstance(dev_engines, dict):
        return []
    entries = dev_engines.get(key)
    if isinstance(entries, dict):
        entries = [entries]
    if not isinstance(entries, list):
        return []
    return [
        entry["version"]
        for entry in entries
        if isinstance(entry, dict)
        and entry.get("name") == name
        and isinstance(entry.get("version"), str)
    ]


def nvm_dir() -> Path:
    return Path(os.environ.get("NVM_DIR") or Path.home() / ".nvm")


def nvm_node_dir(version: str) -> Path:
    return nvm_dir() / "versions" / "node" / f"v{version.lstrip('v')}"


def fnm_dir() -> Path:
    if os.environ.get("FNM_DIR"):
        return Path(os.environ["FNM_DIR"])
    data_home = os.environ.get("XDG_DATA_HOME") or Path.home() / ".local" / "share"
    return Path(data_home) / "fnm"


def fnm_node_dir(version: str) -> Path:
    return fnm_dir() / "node-versions" / f"v{version.lstrip('v')}" / "installation"


def fnm_has(version: str) -> bool:
    """fnm can run this Node: the binary is on PATH and the version is installed."""
    return shutil.which("fnm") is not None and (fnm_node_dir(version) / "bin" / "node").exists()


def installed_node_dir(version: str) -> Path:
    """Where the pinned Node is installed: fnm first, then nvm (nvm's path when neither)."""
    return fnm_node_dir(version) if fnm_has(version) else nvm_node_dir(version)


def fnm_installed(spec: str) -> Path | None:
    """The newest fnm install that `.nvmrc` semantics accept for this spec."""
    try:
        names = [entry.name for entry in (fnm_dir() / "node-versions").iterdir()]
    except OSError:
        return None
    matching = [
        version
        for version in (parse_version(name) for name in names)
        if version and nvm_satisfies(version, spec)
    ]
    if not matching:
        return None
    return fnm_node_dir(".".join(str(part) for part in max(matching)))


def package_version(path: Path) -> str | None:
    data = read_json(path)
    version = data.get("version") if data else None
    return version if isinstance(version, str) else None


@dataclass
class ProjectPins:
    root: Path
    manager: str | None
    node: list[Pin]
    npm: list[Pin]
    pinned_node: str | None


def project_pins(root: Path) -> ProjectPins | None:
    manifest = read_json(root / "package.json")
    if manifest is None:
        return None

    package_manager = manifest.get("packageManager")
    pm_name, pm_version = None, None
    if isinstance(package_manager, str) and "@" in package_manager:
        pm_name, pm_version = package_manager.split("@", 1)
        pm_version = pm_version.split("+", 1)[0]
    manager = pm_name
    if manager is None:
        if (root / "pnpm-lock.yaml").is_file():
            manager = "pnpm"
        elif (root / "package-lock.json").is_file() or (root / "npm-shrinkwrap.json").is_file():
            manager = "npm"

    node: list[Pin] = []
    for name in (".nvmrc", ".node-version"):
        try:
            lines = (root / name).read_text().strip().splitlines()
        except OSError:
            continue
        if lines and lines[0].strip():
            node.append(Pin(name, lines[0].strip(), nvm_style=True))
    volta = manifest.get("volta")
    volta = volta if isinstance(volta, dict) else {}
    if isinstance(volta.get("node"), str):
        node.append(Pin("package.json volta.node", volta["node"]))
    engines = manifest.get("engines")
    engines = engines if isinstance(engines, dict) else {}
    if isinstance(engines.get("node"), str):
        node.append(Pin("package.json engines.node", engines["node"]))
    for spec in dev_engine_versions(manifest, "runtime", "node"):
        node.append(Pin("package.json devEngines.runtime", spec))

    pinned_node = next(
        (
            pin.spec.lstrip("v")
            for pin in node
            if parse_version(pin.spec) and re.fullmatch(r"v?\d+\.\d+\.\d+", pin.spec)
        ),
        None,
    )

    npm: list[Pin] = []
    if isinstance(engines.get("npm"), str):
        npm.append(Pin("package.json engines.npm", engines["npm"]))
    if pm_name == "npm" and pm_version:
        npm.append(Pin("package.json packageManager", pm_version))
    if isinstance(volta.get("npm"), str):
        npm.append(Pin("package.json volta.npm", volta["npm"]))
    for spec in dev_engine_versions(manifest, "packageManager", "npm"):
        npm.append(Pin("package.json devEngines.packageManager", spec))
    if not npm and pinned_node:
        bundled_dir = installed_node_dir(pinned_node) / "lib" / "node_modules" / "npm"
        bundled = package_version(bundled_dir / "package.json")
        if bundled:
            npm.append(Pin(f"the npm of the pinned Node v{pinned_node} ({bundled_dir})", bundled))

    return ProjectPins(root, manager, node, npm, pinned_node)


# ── The command ──────────────────────────────────────────────────────────────


def command_name(token: str) -> str:
    return PurePath(token.replace("\\", "/")).name.lower()


def subcommand(args: list[str]) -> tuple[str | None, list[str]]:
    index = 0
    while index < len(args):
        token = args[index]
        if token in VALUE_FLAGS:
            index += 2
            continue
        if token.startswith("-"):
            index += 1
            continue
        return token, args[index + 1 :]
    return None, []


def parse_fnm_exec(tokens: list[str], env: dict[str, str]) -> Invocation | None:
    """`fnm exec [--using=X] [--] <command>`: the command, run on fnm's install."""
    using = ""
    index = 2
    while index < len(tokens) and tokens[index].startswith("-"):
        token = tokens[index]
        index += 1
        if token == "--":
            break
        if token == "--using" and index < len(tokens):
            using = tokens[index]
            index += 1
        elif token.startswith("--using="):
            using = token.split("=", 1)[1]
    invocation = parse_invocation(tokens[index:], env)
    if invocation is not None:
        invocation.fnm_using = using
    return invocation


def parse_invocation(tokens: list[str], env: dict[str, str]) -> Invocation | None:
    if not tokens:
        return None
    first = command_name(tokens[0])

    if first == "fnm":
        return parse_fnm_exec(tokens, env) if tokens[1:2] == ["exec"] else None

    if first == "node":
        for index, token in enumerate(tokens[1:], start=1):
            name = command_name(token)
            if name == "npm-cli.js":
                binary = tokens[0] if os.path.isabs(tokens[0]) else None
                return Invocation("npm", tokens[index + 1 :], binary, token, env=env)
            if name in {"pnpm.cjs", "pnpm.mjs"}:
                binary = tokens[0] if os.path.isabs(tokens[0]) else None
                return Invocation("pnpm", tokens[index + 1 :], binary, env=env)
        return None

    if first == "npx":
        rest = [token for token in tokens[1:] if token not in {"-y", "--yes"}]
        if rest and rest[0].startswith("npm@"):
            return Invocation("npm", rest[1:], npm_version=rest[0][4:], env=env)
        return None

    if first == "npm":
        args = tokens[1:]
        if args[:1] in (["exec"], ["x"]):
            rest = [token for token in args[1:] if token not in {"-y", "--yes", "--"}]
            if rest and rest[0].startswith("npm@"):
                return Invocation("npm", rest[1:], npm_version=rest[0][4:], env=env)
            return None
        return Invocation("npm", args, npm_entry=tokens[0], env=env)

    if first == "pnpm":
        return Invocation("pnpm", tokens[1:], env=env)

    return None


def is_install(invocation: Invocation) -> bool:
    name, rest = subcommand(invocation.args)
    if name is None:
        return False
    if any(
        token in {"-g", "--global", "--location=global"} for token in invocation.args
    ) or "--location global" in " ".join(invocation.args):
        return False
    if invocation.manager == "npm":
        if name == "audit":
            return subcommand(rest)[0] == "fix"
        return name in NPM_INSTALLS
    return name in PNPM_INSTALLS


def flag_value(args: list[str], names: tuple[str, ...]) -> str | None:
    for index, token in enumerate(args):
        if token in names and index + 1 < len(args):
            return args[index + 1]
        for name in names:
            if name.startswith("--") and token.startswith(f"{name}="):
                return token.split("=", 1)[1]
    return None


def resolve_dir(base: Path, value: str) -> Path:
    path = Path(os.path.expanduser(value))
    return path if path.is_absolute() else (base / path)


# ── Measuring the runtime ────────────────────────────────────────────────────


def node_version(binary: str | None) -> tuple[str | None, str | None]:
    path = binary or shutil.which("node")
    if path is None:
        return None, None
    try:
        result = subprocess.run(
            [path, "--version"], capture_output=True, text=True, timeout=5, check=False
        )
    except (OSError, subprocess.SubprocessError):
        return path, None
    return path, result.stdout.strip() or None


def npm_package_json(entry: str | None) -> Path | None:
    path = entry if entry and os.path.sep in entry else shutil.which(entry or "npm")
    if path is None:
        return None
    real = Path(os.path.realpath(path))
    if real.name == "npm-cli.js":
        return real.parents[1] / "package.json"
    candidate = real.parent.parent / "lib" / "node_modules" / "npm" / "package.json"
    return candidate if candidate.is_file() else None


def npm_version(invocation: Invocation) -> tuple[str | None, str | None]:
    if invocation.npm_version:
        return f"npm@{invocation.npm_version}", invocation.npm_version
    manifest = npm_package_json(invocation.npm_entry)
    if manifest is None:
        return None, None
    return str(manifest.parent), package_version(manifest)


# ── The decision ─────────────────────────────────────────────────────────────


def overrides(invocation: Invocation) -> list[str]:
    found = [token for token in invocation.args if token in OVERRIDE_FLAGS]
    if invocation.manager == "npm":
        found += [token for token in invocation.args if token in NPM_OVERRIDE_FLAGS]
    for key, value in invocation.env.items():
        if OVERRIDE_ENV.get(key.lower()) == value.lower():
            found.append(f"{key}={value}")
    return found


def fnm_using(invocation: Invocation, pins: ProjectPins, current: Path) -> str:
    """`.nvmrc` when fnm would read the pin from it here, else the pinned version."""
    assert pins.pinned_node is not None
    nvmrc = next((pin for pin in pins.node if pin.source == ".nvmrc"), None)
    targets_elsewhere = flag_value(invocation.args, ("--prefix", "-C", "--dir")) is not None
    if nvmrc and nvmrc.spec.lstrip("v") == pins.pinned_node and current == pins.root:
        if not targets_elsewhere:
            return ".nvmrc"
    return pins.pinned_node


def suggestion(invocation: Invocation, pins: ProjectPins, current: Path) -> str:
    if pins.pinned_node is None:
        return "Run it with the Node and npm the project pins."
    via_fnm = fnm_has(pins.pinned_node)
    node_dir = installed_node_dir(pins.pinned_node)
    node_binary = node_dir / "bin" / "node"
    if not node_binary.exists():
        tool, home = ("fnm", fnm_dir()) if shutil.which("fnm") else ("nvm", nvm_dir())
        return (
            f"The pinned Node v{pins.pinned_node} is not installed under {home}. "
            f"Stop and ask the user for `{tool} install {pins.pinned_node}`; never fall "
            "back to the node on PATH."
        )
    args = shlex.join(
        token
        for token in invocation.args
        if token not in OVERRIDE_FLAGS
        and not (invocation.manager == "npm" and token in NPM_OVERRIDE_FLAGS)
    )
    fnm_command = (
        f"fnm exec --using={fnm_using(invocation, pins, current)} {invocation.manager} {args}"
    )
    if invocation.manager == "npm":
        cli = node_dir / "lib" / "node_modules" / "npm" / "bin" / "npm-cli.js"
        bundled = package_version(cli.parents[1] / "package.json")
        parsed = parse_version(bundled or "")
        if parsed and any(pin_holds(pin, parsed) is False for pin in pins.npm):
            return (
                f"The npm bundled with Node v{pins.pinned_node} ({bundled}) does not "
                "match the npm pin either. Ask the user which version to run."
            )
        if via_fnm:
            return f"Run it through fnm on the pinned Node instead:\n  {fnm_command}"
        return f"Run it on the pinned runtime instead:\n  {node_binary} {cli} {args}"
    if via_fnm:
        return f"Run it through fnm on the pinned Node instead:\n  {fnm_command}"
    pnpm = node_dir / "lib" / "node_modules" / "pnpm" / "bin" / "pnpm.cjs"
    if not pnpm.is_file():
        found = shutil.which("pnpm")
        real = Path(os.path.realpath(found)) if found else None
        pnpm = real if real and real.suffix in {".cjs", ".js", ".mjs"} else pnpm
    if pnpm.is_file():
        return f"Run it on the pinned runtime instead:\n  {node_binary} {pnpm} {args}"
    return f"Run pnpm under {node_binary}."


def problems(invocation: Invocation, pins: ProjectPins) -> list[str]:
    found: list[str] = []
    if pins.manager and pins.manager != invocation.manager:
        found.append(
            f"the project installs with {pins.manager} (packageManager or lockfile), "
            f"this command runs {invocation.manager}"
        )
        return found

    for flag in overrides(invocation):
        found.append(f"`{flag}` switches the engine check off")

    node_path, node_text = node_version(invocation.node_binary)
    measured_node = parse_version(node_text or "")
    if measured_node:
        for pin in pins.node:
            if pin_holds(pin, measured_node) is False:
                found.append(
                    f"{pin.source} pins Node {pin.spec}, this command runs Node "
                    f"{node_text} ({node_path})"
                )

    if invocation.manager == "npm":
        npm_path, npm_text = npm_version(invocation)
        measured_npm = parse_version(npm_text or "")
        if measured_npm:
            for pin in pins.npm:
                if pin_holds(pin, measured_npm) is False:
                    found.append(
                        f"{pin.source} pins npm {pin.spec}, this command runs npm "
                        f"{npm_text} ({npm_path})"
                    )
    return found


def segment_tokens(segment: str) -> tuple[list[str], dict[str, str]] | None:
    try:
        tokens = shlex.split(segment, posix=True)
    except ValueError:
        return None
    env: dict[str, str] = {}
    if tokens and command_name(tokens[0]) == "env":
        tokens = tokens[1:]
    while tokens and (match := ASSIGNMENT.match(tokens[0])):
        env[match[1]] = match[2]
        tokens = tokens[1:]
    return tokens, env


def fnm_version_spec(using: str, current: Path) -> str | None:
    """The version `fnm exec` asks for.

    `--using` is a version or a file; without it fnm reads `.nvmrc` or
    `.node-version`, taken here from the nearest directory that has one.
    """
    if re.fullmatch(r"v?\d+(?:\.\d+){0,2}", using):
        return using
    files = (
        [resolve_dir(current, using)]
        if using
        else [
            directory / name
            for directory in (current, *current.parents)
            for name in (".nvmrc", ".node-version")
        ]
    )
    for path in files:
        try:
            lines = path.read_text().strip().splitlines()
        except OSError:
            continue
        return lines[0].strip() if lines else None
    return None


def use_fnm_runtime(invocation: Invocation, current: Path) -> bool:
    """Point the invocation at the fnm install `fnm exec` selects; False when unknown."""
    spec = fnm_version_spec(invocation.fnm_using or "", current)
    install = fnm_installed(spec) if spec else None
    if install is None:
        return False
    invocation.node_binary = str(install / "bin" / "node")
    if invocation.manager == "npm":
        invocation.npm_entry = str(install / "lib" / "node_modules" / "npm" / "bin" / "npm-cli.js")
    return True


def denial(command: str, cwd: Path) -> str | None:
    if not QUICK_MATCH.search(command):
        return None
    current = cwd
    for segment in SEGMENT_SEPARATOR.split(command):
        parsed = segment_tokens(segment)
        if parsed is None:
            continue
        tokens, env = parsed
        if tokens[:1] == ["cd"] and len(tokens) > 1:
            current = resolve_dir(current, tokens[1])
            continue
        invocation = parse_invocation(tokens, env)
        if invocation is None or not is_install(invocation):
            continue
        # A version fnm cannot resolve makes `fnm exec` fail on its own.
        if invocation.fnm_using is not None and not use_fnm_runtime(invocation, current):
            continue
        target = flag_value(invocation.args, ("--prefix", "-C", "--dir"))
        root = project_root(resolve_dir(current, target) if target else current)
        pins = project_pins(root) if root else None
        if pins is None or not (pins.manager or pins.node or pins.npm):
            continue
        found = problems(invocation, pins)
        if not found:
            continue
        listed = "\n".join(f"- {problem}" for problem in found)
        return (
            f"This install does not run on the runtime {pins.root} pins:\n{listed}\n"
            f"{suggestion(invocation, pins, current)}\n"
            "The hook measures node and npm on its own PATH unless the command names "
            "them by absolute path or runs them through `fnm exec`; those forms are "
            "judged by the binaries they select. "
            'Follow the ambient rule "Node and npm: the version the project pins" '
            "(ai-workflows CLAUDE.md, Shell Usage): when the pinned version cannot "
            "do the job, moving the pin is the user's decision, never a workaround."
        )
    return None


def main() -> None:
    try:
        payload: dict[str, Any] = json.load(sys.stdin)
    except (json.JSONDecodeError, TypeError):
        return

    tool_input = payload.get("tool_input")
    if not isinstance(tool_input, dict):
        return
    command = tool_input.get("command")
    if not isinstance(command, str):
        return
    cwd = payload.get("cwd")
    reason = denial(command, Path(cwd if isinstance(cwd, str) and cwd else os.getcwd()))
    if reason is None:
        return

    print(
        json.dumps(
            {
                "hookSpecificOutput": {
                    "hookEventName": "PreToolUse",
                    "permissionDecision": "deny",
                    "permissionDecisionReason": reason,
                }
            }
        )
    )


if __name__ == "__main__":
    main()
