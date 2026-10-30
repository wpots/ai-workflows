#!/usr/bin/env node
// Tags a merged release and creates its GitLab Release. Runs in CI on every
// push to main (see .gitlab-ci.yml `publish_release`) and acts only on a
// release commit: one that changed the version in .claude-plugin/plugin.json
// against its first parent, the same test announce-release uses. One call to
// the Releases API creates the Release and, from `ref`, the annotated tag
// `v<x.y.z>` on that commit. CI_JOB_TOKEN may use every Releases endpoint, so
// the job needs no variable. A Release that already exists (409) is left alone.
//
// The notes are the CHANGELOG section plus the backlog items the release
// archived (scripts/backlog-archive.mjs), linked at the first parent, where
// they still exist.
//
// Usage (local):
//   node scripts/publish-release.mjs --dry-run                 # HEAD must be a release commit
//   node scripts/publish-release.mjs --dry-run --version 2.7.0 # the notes of any released version
//
// Environment (GitLab CI provides all of it):
//   CI_JOB_TOKEN, CI_API_V4_URL, CI_PROJECT_PATH, CI_PROJECT_URL, CI_COMMIT_SHA

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { BACKLOG_DIR, describeItem, renderArchived } from "./backlog-archive.mjs";
import { sectionBody } from "./changelog-sections.mjs";
import { headIsRelease } from "./release-commit.mjs";

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

function git(...gitArgs) {
  return execFileSync("git", gitArgs, { cwd: ROOT, encoding: "utf8" }).trim();
}

const version = versionFlag ?? JSON.parse(readFileSync(MANIFEST, "utf8")).version;

if (!versionFlag) {
  const isRelease = headIsRelease(ROOT);

  if (isRelease === null) {
    fail("HEAD^1 is not available; the CI job needs GIT_DEPTH 2 or deeper");
  }

  if (!isRelease) {
    console.log(`Not a release commit (plugin.json still ${version}); nothing to publish.`);
    process.exit(0);
  }
}

const body = sectionBody(readFileSync(CHANGELOG, "utf8"), version);

if (body === null) {
  fail(`CHANGELOG.md has no '## [${version}]' section to publish`);
}

// The items this release commit moved out of docs/backlog/ (under that
// pathspec a move reads as a deletion), read back at its first parent. A
// version passed by flag is not HEAD, so its notes are the changelog only.
const sections = [body];

if (!versionFlag) {
  const parent = git("rev-parse", "HEAD^1");
  const removed = git("diff", "--name-only", "--diff-filter=D", "HEAD^1", "HEAD", "--", `${BACKLOG_DIR}/`)
    .split("\n")
    .filter(Boolean);

  if (removed.length > 0) {
    const items = removed.map((path) => describeItem(path, git("show", `${parent}:${path}`)));
    sections.push(renderArchived(items, `${projectUrl}/-/blob/${parent}`));
  }
}

const tag = `v${version}`;
const notes = sections.join("\n\n");

if (dryRun) {
  console.log(`${tag}\n\n${notes}`);
  process.exit(0);
}

for (const name of ["CI_JOB_TOKEN", "CI_API_V4_URL", "CI_PROJECT_PATH", "CI_COMMIT_SHA"]) {
  if (!env[name]) {
    fail(`${name} is not set; this script publishes from GitLab CI (use --dry-run locally)`);
  }
}

const response = await fetch(
  `${env.CI_API_V4_URL}/projects/${encodeURIComponent(env.CI_PROJECT_PATH)}/releases`,
  {
    method: "POST",
    headers: { "JOB-TOKEN": env.CI_JOB_TOKEN, "Content-Type": "application/json" },
    body: JSON.stringify({
      tag_name: tag,
      ref: env.CI_COMMIT_SHA,
      tag_message: `greenberry plugin ${version}`,
      name: tag,
      description: notes,
    }),
  },
);

if (response.status === 409) {
  console.log(`Release ${tag} already exists; left alone.`);
  process.exit(0);
}

if (!response.ok) {
  fail(`POST releases -> ${response.status} ${await response.text()}`);
}

console.log(`✔ Published ${tag}: ${projectUrl}/-/releases/${tag}`);
