#!/usr/bin/env node
// Posts the release notes and the update reminder to Slack once a release MR
// has merged. Runs in CI on every push to main (see .gitlab-ci.yml
// `announce_release`): it posts only when the commit changed the version in
// .claude-plugin/plugin.json against its first parent, so content merges stay
// silent. Without SLACK_WEBHOOK_URL it prints the message and exits 0.
//
// Usage (local):
//   node scripts/announce-release.mjs --dry-run                 # HEAD must be a release commit
//   node scripts/announce-release.mjs --dry-run --version 2.5.0 # render any released version
//
// Environment:
//   SLACK_WEBHOOK_URL  incoming webhook of the channel (#development)
//   CI_PROJECT_URL     for the links; defaults to the ai-workflows project

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { renderAnnouncement, sectionBody } from "./changelog-sections.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CHANGELOG = join(ROOT, "CHANGELOG.md");
const MANIFEST = join(ROOT, ".claude-plugin", "plugin.json");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const versionFlag = args.includes("--version") ? args[args.indexOf("--version") + 1] : null;
const env = process.env;
const projectUrl = env.CI_PROJECT_URL || "https://gitlab.com/greenberrynl/config/ai-workflows";

function fail(message) {
  console.error(`✖ ${message}`);
  process.exit(1);
}

function headIsRelease() {
  try {
    execFileSync("git", ["diff", "--quiet", "HEAD^1", "HEAD", "--", ".claude-plugin/plugin.json"], {
      cwd: ROOT,
      stdio: "ignore",
    });
    return false;
  } catch (error) {
    if (error.status === 1) {
      return true;
    }
    fail("HEAD^1 is not available; the CI job needs GIT_DEPTH 2 or deeper");
  }
  return false;
}

const version = versionFlag ?? JSON.parse(readFileSync(MANIFEST, "utf8")).version;

if (!versionFlag && !headIsRelease()) {
  console.log(`Not a release commit (plugin.json still ${version}); nothing to announce.`);
  process.exit(0);
}

const body = sectionBody(readFileSync(CHANGELOG, "utf8"), version);

if (body === null) {
  fail(`CHANGELOG.md has no '## [${version}]' section to announce`);
}

const message = renderAnnouncement({ version, body, projectUrl });

if (dryRun) {
  console.log(message);
  process.exit(0);
}

if (!env.SLACK_WEBHOOK_URL) {
  console.log(
    "SLACK_WEBHOOK_URL is not set, so nothing was posted. Add the #development incoming " +
      "webhook as a masked CI/CD variable, or paste this by hand:\n",
  );
  console.log(message);
  process.exit(0);
}

const response = await fetch(env.SLACK_WEBHOOK_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ text: message }),
});

if (!response.ok) {
  fail(`Slack webhook -> ${response.status} ${await response.text()}`);
}

console.log(`✔ Announced ${version} in Slack.`);
