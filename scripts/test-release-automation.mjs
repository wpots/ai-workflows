#!/usr/bin/env node
// Regression tests for the changelog readers behind release-train and
// announce-release, the fragment reader, and the version assignment itself.
// Run: node --test scripts/test-release-automation.mjs

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  groupUnreleased,
  inferBump,
  mergeGroups,
  readFragments,
  renderSections,
} from "./changelog-fragments.mjs";
import { entries, firstSentence, renderAnnouncement, sectionBody } from "./changelog-sections.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const FIXTURE = `# Changelog

Describe the change under \`## [Unreleased]\` in the same MR.

## [Unreleased]

### Added

- \`skills/one\` — does the first thing (e.g. this). Second sentence.
  Continues here.

### Fixed

- \`scripts/two.mjs\` — fixes \`a.b\` without stopping. More.

## [1.2.0] - 2026-01-02

### Changed

- \`skills/three\` — changed. Tail.

## [1.1.0] - 2026-01-01

### Added

- old entry.
`;

test("sectionBody anchors to the heading line, not the intro prose", () => {
  const body = sectionBody(FIXTURE, "Unreleased");
  assert.ok(body.startsWith("### Added"));
  assert.ok(body.includes("scripts/two.mjs"));
  assert.ok(!body.includes("[1.2.0]"));
});

test("sectionBody reads one released version and returns null for a missing one", () => {
  assert.equal(sectionBody(FIXTURE, "1.2.0"), "### Changed\n\n- `skills/three` — changed. Tail.");
  assert.equal(sectionBody(FIXTURE, "9.9.9"), null);
});

test("entries joins continuation lines and keeps the section", () => {
  const found = entries(sectionBody(FIXTURE, "Unreleased"));
  assert.deepEqual(
    found.map((entry) => entry.section),
    ["Added", "Fixed"],
  );
  assert.equal(
    found[0].text,
    "`skills/one` — does the first thing (e.g. this). Second sentence. Continues here.",
  );
});

test("firstSentence skips periods inside backticks and after abbreviations", () => {
  assert.equal(
    firstSentence("`skills/one` — does the first thing (e.g. this). Second sentence."),
    "`skills/one` — does the first thing (e.g. this).",
  );
  assert.equal(
    firstSentence("`scripts/two.mjs` — fixes `a.b` without stopping. More."),
    "`scripts/two.mjs` — fixes `a.b` without stopping.",
  );
  assert.equal(firstSentence("no period at all"), "no period at all");
});

test("renderAnnouncement labels sections in Dutch, caps the bullets and links the docs", () => {
  const message = renderAnnouncement({
    version: "1.2.0",
    body: sectionBody(FIXTURE, "Unreleased"),
    projectUrl: "https://gitlab.example/p",
    maxBullets: 1,
  });
  assert.ok(message.startsWith(":package: *greenberry plugin 1.2.0*"));
  assert.ok(message.includes("• Nieuw: `skills/one` — does the first thing (e.g. this)."));
  assert.ok(message.includes("_+ 1 meer in de changelog_"));
  assert.ok(message.includes("/plugin marketplace update ai-workflows"));
  assert.ok(message.includes("<https://gitlab.example/p/-/blob/main/CHANGELOG.md|CHANGELOG.md>"));
  assert.ok(!message.includes("Fix: `scripts/two.mjs`"));
});

test("readFragments parses well-named bullet files, reports the rest, tolerates a missing dir", () => {
  const dir = mkdtempSync(join(tmpdir(), "fragments-"));
  writeFileSync(join(dir, "added.one.md"), "- one\n  more\n");
  writeFileSync(join(dir, "fixed.two.md"), "- two\n");
  writeFileSync(join(dir, "Added.bad-case.md"), "- x\n");
  writeFileSync(join(dir, "changed.no-bullet.md"), "no bullet\n");
  writeFileSync(join(dir, ".gitkeep"), "");

  const { fragments, errors } = readFragments(dir);
  assert.deepEqual(
    fragments.map((fragment) => [fragment.file, fragment.section, fragment.body]),
    [
      ["added.one.md", "Added", "- one\n  more"],
      ["fixed.two.md", "Fixed", "- two"],
    ],
  );
  assert.equal(errors.length, 2);
  assert.ok(errors[0].includes("Added.bad-case.md"));
  assert.ok(errors[1].includes("changed.no-bullet.md"));
  assert.deepEqual(readFragments(join(dir, "missing")), { fragments: [], errors: [] });
  rmSync(dir, { recursive: true });
});

test("mergeGroups keeps hand-written entries first; inferBump and renderSections follow the sections", () => {
  const handWritten = groupUnreleased("\n\n### Changed\n\n- hand\n  written\n\n### Fixed\n\n- old fix\n");
  const groups = mergeGroups(handWritten, [
    { file: "changed.x.md", section: "Changed", body: "- fragment" },
    { file: "added.y.md", section: "Added", body: "- new" },
  ]);

  assert.equal(groups.get("Changed"), "- hand\n  written\n- fragment");
  assert.equal(inferBump(groups), "minor");
  assert.equal(inferBump(new Map([["Fixed", "- x"]])), "patch");
  assert.equal(inferBump(new Map([["Changed", "- BREAKING: x"]])), "major");
  assert.equal(inferBump(new Map([["Removed", "- x"]])), "major");
  assert.equal(
    renderSections(groups),
    "### Added\n\n- new\n\n### Changed\n\n- hand\n  written\n- fragment\n\n### Fixed\n\n- old fix\n",
  );
});

test("assign-plugin-version folds fragments and Unreleased entries into one release and removes the fragments", () => {
  const root = mkdtempSync(join(tmpdir(), "release-root-"));
  mkdirSync(join(root, ".claude-plugin"));
  mkdirSync(join(root, "changelog.d"));
  writeFileSync(
    join(root, ".claude-plugin", "plugin.json"),
    '{\n  "name": "x",\n  "version": "1.0.0"\n}\n',
  );
  writeFileSync(
    join(root, "CHANGELOG.md"),
    "# Changelog\n\nIntro mentions `## [Unreleased]`.\n\n## [Unreleased]\n\n### Changed\n\n- hand-written entry.\n\n## [1.0.0] - 2026-01-01\n\n### Added\n\n- first.\n",
  );
  writeFileSync(join(root, "changelog.d", "added.feature.md"), "- a feature.\n  continued.\n");
  writeFileSync(join(root, "changelog.d", "fixed.bug.md"), "- a fix.\n");

  const script = join(ROOT, "scripts", "assign-plugin-version.mjs");
  const run = (...extra) =>
    execFileSync(process.execPath, [script, "--root", root, "--date", "2026-02-02", ...extra], {
      encoding: "utf8",
    });

  const plan = run();
  assert.match(plan, /1\.0\.0 -> 1\.1\.0 \(minor\)/);
  assert.match(plan, /fragments\s+2 \+ entries still under Unreleased/);
  assert.match(plan, /Dry run/);
  assert.ok(existsSync(join(root, "changelog.d", "added.feature.md")));

  run("--write");
  const changelog = readFileSync(join(root, "CHANGELOG.md"), "utf8");
  assert.ok(
    changelog.includes(
      "## [Unreleased]\n\n## [1.1.0] - 2026-02-02\n\n### Added\n\n- a feature.\n  continued.\n\n### Changed\n\n- hand-written entry.\n\n### Fixed\n\n- a fix.\n\n## [1.0.0] - 2026-01-01",
    ),
    changelog,
  );
  assert.match(readFileSync(join(root, ".claude-plugin", "plugin.json"), "utf8"), /"version": "1\.1\.0"/);
  assert.ok(!existsSync(join(root, "changelog.d", "added.feature.md")));
  assert.ok(!existsSync(join(root, "changelog.d", "fixed.bug.md")));
  assert.match(run(), /^Nothing to release/);
  rmSync(root, { recursive: true });
});

test("the real repo parses: 2.5.0 has entries, Unreleased is readable, fragments are well-formed", () => {
  const changelog = readFileSync(join(ROOT, "CHANGELOG.md"), "utf8");
  const released = sectionBody(changelog, "2.5.0");
  assert.ok(released !== null);
  assert.ok(entries(released).length >= 5);
  assert.notEqual(sectionBody(changelog, "Unreleased"), null);
  assert.deepEqual(readFragments(join(ROOT, "changelog.d")).errors, []);
});
