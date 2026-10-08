#!/usr/bin/env node
// Assigns the plugin version AFTER merge, from the changelog fragments under
// changelog.d/ — plus anything still written under `## [Unreleased]` by MRs
// from before fragments existed.
//
// Content MRs never touch CHANGELOG.md or `.claude-plugin/plugin.json`: each
// adds one fragment file (see scripts/changelog-fragments.mjs). That is what
// keeps two MRs from conflicting on the changelog or claiming the same number.
// The plugin serves `skills/`, `commands/` and the ambient layer straight from
// `main`, so a merge already ships — this step only makes the release visible
// in `/plugin`, where the install path is version-keyed. The `release_train`
// CI job runs it; by hand it is the fallback.
//
// Usage:
//   node scripts/assign-plugin-version.mjs             # show the plan, write nothing
//   node scripts/assign-plugin-version.mjs --write      # apply it and delete the fragments
//   node scripts/assign-plugin-version.mjs --bump minor # override the inferred bump
//   node scripts/assign-plugin-version.mjs --as 2.0.0   # set an exact version
//   node scripts/assign-plugin-version.mjs --date 2026-08-05
//   node scripts/assign-plugin-version.mjs --root <dir> # another checkout (tests)
//
// Bump inference: a `removed` fragment (or `### Removed`), or BREAKING anywhere
// -> MAJOR; an `added` fragment (or `### Added`) -> MINOR; anything else
// (changed/fixed/deprecated/security) -> PATCH. Use --bump/--as when judgment
// differs from that default.

import { readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  groupUnreleased,
  inferBump,
  mergeGroups,
  readFragments,
  renderSections,
} from "./changelog-fragments.mjs";

const args = process.argv.slice(2);
const flag = (name) => {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? null : args[index + 1] ?? null;
};
const has = (name) => args.includes(`--${name}`);

const ROOT = flag("root") ?? join(dirname(fileURLToPath(import.meta.url)), "..");
const CHANGELOG = join(ROOT, "CHANGELOG.md");
const MANIFEST = join(ROOT, ".claude-plugin", "plugin.json");
const FRAGMENTS = join(ROOT, "changelog.d");
const UNRELEASED = "## [Unreleased]";

function fail(message) {
  console.error(`✖ ${message}`);
  process.exit(1);
}

/** Body of the `## [Unreleased]` section, up to the next `## [` heading. */
function readUnreleased(changelog) {
  // Anchor to a heading line: the intro prose mentions `## [Unreleased]`
  // literally, and a plain indexOf lands on that mention instead of the
  // section — misreading header prose as the release body.
  const heading = /^## \[Unreleased\]$/m.exec(changelog);

  if (!heading) {
    fail(`CHANGELOG.md has no '${UNRELEASED}' heading to release from`);
  }

  const start = heading.index;
  const after = start + heading[0].length;
  const next = changelog.indexOf("\n## [", after);

  return {
    start,
    after,
    end: next === -1 ? changelog.length : next,
    body: changelog.slice(after, next === -1 ? changelog.length : next),
  };
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
const { fragments, errors } = readFragments(FRAGMENTS);

if (errors.length > 0) {
  fail(`changelog fragments are malformed:\n  ${errors.join("\n  ")}`);
}

const handWritten = groupUnreleased(unreleased.body);

if (unreleased.body.trim() && handWritten.size === 0) {
  fail(`entries under '${UNRELEASED}' have no '### <Section>' heading, so they would be lost`);
}

const groups = mergeGroups(handWritten, fragments);

if (groups.size === 0) {
  console.log(
    `Nothing to release: no fragments in changelog.d/ and '${UNRELEASED}' is empty, so ${manifest.version} is current.`,
  );
  process.exit(0);
}

const bump = flag("bump") ?? inferBump(groups);

if (!["major", "minor", "patch"].includes(bump)) {
  fail(`--bump must be major, minor or patch (got '${bump}')`);
}

const version = flag("as") ?? nextVersion(manifest.version, bump);

if (!/^\d+\.\d+\.\d+$/.test(version)) {
  fail(`'${version}' is not plain semver (MAJOR.MINOR.PATCH)`);
}

if (new RegExp(`^## \\[${version.replaceAll(".", "\\.")}\\]`, "m").test(changelog)) {
  fail(`CHANGELOG.md already has a '## [${version}]' section`);
}

const date = flag("date") ?? new Date().toISOString().slice(0, 10);

if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
  fail(`--date must be YYYY-MM-DD (got '${date}')`);
}

console.log(`plugin.json   ${manifest.version} -> ${version} (${bump})`);
console.log(`CHANGELOG.md  ${UNRELEASED} -> ## [${version}] - ${date}`);
console.log(`sections      ${[...groups.keys()].join(", ")}`);
console.log(
  `fragments     ${fragments.length}${handWritten.size > 0 ? " + entries still under Unreleased" : ""}`,
);

if (!has("write")) {
  console.log("\nDry run — pass --write to apply.");
  process.exit(0);
}

// Keep an empty `## [Unreleased]` on top: the landing zone for entries written
// by hand, and the heading the validator and the announce job anchor on.
const released = `${UNRELEASED}\n\n## [${version}] - ${date}\n\n${renderSections(groups)}`;
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

for (const fragment of fragments) {
  unlinkSync(join(FRAGMENTS, fragment.file));
}

console.log(
  `\n✔ Assigned ${version}; ${fragments.length} fragment(s) folded in and removed. ` +
    "Commit CHANGELOG.md, .claude-plugin/plugin.json and changelog.d/ in the release MR.",
);
