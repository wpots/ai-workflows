#!/usr/bin/env node
// Assigns the plugin version AFTER merge, from whatever sits under
// `## [Unreleased]` in CHANGELOG.md.
//
// Content MRs never touch `.claude-plugin/plugin.json` or a version heading:
// they only add entries under `## [Unreleased]`. That is what keeps two MRs
// from claiming the same number and conflicting on the same changelog lines.
// The plugin serves `skills/`, `commands/` and the ambient layer straight from
// `main`, so a merge already ships — this step only makes the release visible
// in `/plugin`, where the install path is version-keyed.
//
// Usage:
//   node scripts/assign-plugin-version.mjs             # show the plan, write nothing
//   node scripts/assign-plugin-version.mjs --write      # apply it
//   node scripts/assign-plugin-version.mjs --bump minor # override the inferred bump
//   node scripts/assign-plugin-version.mjs --as 2.0.0   # set an exact version
//   node scripts/assign-plugin-version.mjs --date 2026-08-05
//
// Bump inference from the section headings under `## [Unreleased]`:
//   `### Removed`, or any line containing BREAKING  -> MAJOR
//   `### Added`                                     -> MINOR
//   anything else (Changed/Fixed/Deprecated/Security) -> PATCH
// Use --bump/--as when judgment differs from that default.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CHANGELOG = join(ROOT, "CHANGELOG.md");
const MANIFEST = join(ROOT, ".claude-plugin", "plugin.json");
const UNRELEASED = "## [Unreleased]";

const args = process.argv.slice(2);
const flag = (name) => {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? null : args[index + 1] ?? null;
};
const has = (name) => args.includes(`--${name}`);

function fail(message) {
  console.error(`✖ ${message}`);
  process.exit(1);
}

/** Body of the `## [Unreleased]` section, up to the next `## [` heading. */
function readUnreleased(changelog) {
  const start = changelog.indexOf(UNRELEASED);

  if (start === -1) {
    fail(`CHANGELOG.md has no '${UNRELEASED}' heading to release from`);
  }

  const after = start + UNRELEASED.length;
  const next = changelog.indexOf("\n## [", after);

  return {
    start,
    after,
    end: next === -1 ? changelog.length : next,
    body: changelog.slice(after, next === -1 ? changelog.length : next),
  };
}

function inferBump(body) {
  if (/^### Removed$/m.test(body) || /BREAKING/.test(body)) {
    return "major";
  }

  return /^### Added$/m.test(body) ? "minor" : "patch";
}

function nextVersion(current, bump) {
  const parts = current.split(".").map(Number);

  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    fail(`plugin.json version '${current}' is not plain semver`);
  }

  const [major, minor, patch] = parts;

  if (bump === "major") return `${major + 1}.0.0`;
  if (bump === "minor") return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

const changelog = readFileSync(CHANGELOG, "utf8");
const manifestRaw = readFileSync(MANIFEST, "utf8");
const manifest = JSON.parse(manifestRaw);
const unreleased = readUnreleased(changelog);
const entries = unreleased.body.trim();

if (!entries) {
  console.log(
    `Nothing to release: '${UNRELEASED}' is empty, so ${manifest.version} is current.`,
  );
  process.exit(0);
}

const bump = flag("bump") ?? inferBump(entries);

if (!["major", "minor", "patch"].includes(bump)) {
  fail(`--bump must be major, minor or patch (got '${bump}')`);
}

const version = flag("as") ?? nextVersion(manifest.version, bump);

if (!/^\d+\.\d+\.\d+$/.test(version)) {
  fail(`'${version}' is not plain semver (MAJOR.MINOR.PATCH)`);
}

if (changelog.includes(`## [${version}]`)) {
  fail(`CHANGELOG.md already has a '## [${version}]' section`);
}

const date = flag("date") ?? new Date().toISOString().slice(0, 10);

if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
  fail(`--date must be YYYY-MM-DD (got '${date}')`);
}

const sections = [...entries.matchAll(/^### (.+)$/gm)].map((match) => match[1]);

console.log(`plugin.json   ${manifest.version} -> ${version} (${bump})`);
console.log(`CHANGELOG.md  ${UNRELEASED} -> ## [${version}] - ${date}`);
console.log(`sections      ${sections.join(", ") || "(none)"}`);

if (!has("write")) {
  console.log("\nDry run — pass --write to apply.");
  process.exit(0);
}

// Keep an empty `## [Unreleased]` on top for the next merge to land under.
const released = `${UNRELEASED}\n\n## [${version}] - ${date}\n${unreleased.body.replace(/^\n+/, "\n")}`;
const nextChangelog =
  changelog.slice(0, unreleased.start) + released + changelog.slice(unreleased.end);

// Rewrite the version in place so the rest of the manifest — key order,
// formatting, trailing newline — stays byte-identical.
const nextManifest = manifestRaw.replace(
  /("version"\s*:\s*")\d+\.\d+\.\d+(")/,
  `$1${version}$2`,
);

if (nextManifest === manifestRaw) {
  fail("could not rewrite the version in .claude-plugin/plugin.json");
}

writeFileSync(CHANGELOG, nextChangelog);
writeFileSync(MANIFEST, nextManifest);

console.log(`\n✔ Assigned ${version}. Commit both files in the release MR.`);
