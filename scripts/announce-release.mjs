#!/usr/bin/env node
// Posts the release notes and the update reminder to Slack once a release MR
// has merged. Runs in CI on every push to main (see .gitlab-ci.yml
// `announce_release`): it posts only when the commit changed the version in
// .claude-plugin/plugin.json against its first parent, so content merges stay
// silent. Without SLACK_WEBHOOK_URL it prints the message and exits 0. The
// message itself is built by scripts/release-announcement.mjs; whether it asks
// for a project sync comes from scripts/project-sync-paths.mjs, which needs the
// history back to the previous release (the CI job clones with GIT_DEPTH 0).
//
// Usage (local):
//   node scripts/announce-release.mjs --dry-run                 # HEAD must be a release commit
//   node scripts/announce-release.mjs --dry-run --version 2.5.0 # render any released version
//   node scripts/announce-release.mjs --dry-run --json ...      # the webhook payload instead
//
// Environment:
//   SLACK_WEBHOOK_URL  incoming webhook of the channel (#ai-workflows)
//   CI_PROJECT_URL     for the links; defaults to the ai-workflows project

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { sectionBody, sectionDate } from "./changelog-sections.mjs";
import { changedSyncPaths, releaseRange } from "./project-sync-paths.mjs";
import { buildAnnouncement, toPlainMrkdwn } from "./release-announcement.mjs";
import { headIsRelease } from "./release-commit.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CHANGELOG = join(ROOT, "CHANGELOG.md");
const MANIFEST = join(ROOT, ".claude-plugin", "plugin.json");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const asJson = args.includes("--json");
const versionFlag = args.includes("--version") ? args[args.indexOf("--version") + 1] : null;
const env = process.env;
const projectUrl = env.CI_PROJECT_URL || "https://gitlab.com/greenberrynl/config/ai-workflows";

function fail(message) {
  console.error(`✖ ${message}`);
  process.exit(1);
}

const version = versionFlag ?? JSON.parse(readFileSync(MANIFEST, "utf8")).version;

if (!versionFlag) {
  const isRelease = headIsRelease(ROOT);

  if (isRelease === null) {
    fail("HEAD^1 is not available; the CI job needs GIT_DEPTH 2 or deeper");
  }

  if (!isRelease) {
    console.log(`Not a release commit (plugin.json still ${version}); nothing to announce.`);
    process.exit(0);
  }
}

const changelog = readFileSync(CHANGELOG, "utf8");
const body = sectionBody(changelog, version);

if (body === null) {
  fail(`CHANGELOG.md has no '## [${version}]' section to announce`);
}

const range = releaseRange(ROOT, version, { atHead: !versionFlag });
const syncPaths = range ? changedSyncPaths(ROOT, range) : null;

if (syncPaths === null) {
  console.log("⚠ Previous release not in reach, so the post says nothing about a project sync.");
}

const payload = buildAnnouncement({
  version,
  date: sectionDate(changelog, version),
  body,
  projectUrl,
  syncPaths,
});

if (dryRun) {
  console.log(asJson ? JSON.stringify(payload, null, 2) : toPlainMrkdwn(payload));
  process.exit(0);
}

if (!env.SLACK_WEBHOOK_URL) {
  console.log(
    "SLACK_WEBHOOK_URL is not set, so nothing was posted. Add the #ai-workflows incoming " +
      "webhook as a masked CI/CD variable, or paste this by hand:\n",
  );
  console.log(toPlainMrkdwn(payload));
  process.exit(0);
}

const response = await fetch(env.SLACK_WEBHOOK_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});

if (!response.ok) {
  fail(`Slack webhook -> ${response.status} ${await response.text()}`);
}

console.log(`✔ Announced ${version} in Slack.`);
