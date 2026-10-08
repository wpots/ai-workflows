#!/usr/bin/env node
// Regression tests for the changelog readers behind release-train and
// announce-release. Run: node --test scripts/test-release-automation.mjs

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

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

test("the real CHANGELOG.md parses: 2.5.0 has entries, Unreleased is readable", () => {
  const changelog = readFileSync(join(ROOT, "CHANGELOG.md"), "utf8");
  const released = sectionBody(changelog, "2.5.0");
  assert.ok(released !== null);
  assert.ok(entries(released).length >= 5);
  assert.notEqual(sectionBody(changelog, "Unreleased"), null);
});
