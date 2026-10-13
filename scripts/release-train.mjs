#!/usr/bin/env node
// Keeps one release MR current. Runs in CI on every push to main (see
// .gitlab-ci.yml `release_train` and docs/contributing.md § Ship A Plugin
// Release):
//
//   1. `## [Unreleased]` empty  -> nothing to do, exit 0.
//   2. Otherwise run scripts/assign-plugin-version.mjs --write on a branch
//      (`release/next`), commit "release: x.y.z", force-push it, and open the
//      MR to main with the maintainer as reviewer — or update the open MR's
//      title and description when it already exists. The cut archives the
//      delivered backlog items, so the description carries the backlog
//      status next to the changelog section.
//
// Merging that MR is the release decision; the version stays assigned after
// merge, exactly as the manual flow. Without RELEASE_BOT_TOKEN the job prints
// what it would do and exits 0, so the pipeline stays green until the
// variable exists.
//
// Usage (local): node scripts/release-train.mjs --dry-run
//
// Environment (GitLab CI provides all but the token):
//   RELEASE_BOT_TOKEN  project access token, scopes api + write_repository
//   CI_API_V4_URL, CI_PROJECT_PATH, CI_SERVER_HOST, CI_DEFAULT_BRANCH, CI_COMMIT_SHA
//   RELEASE_BRANCH     default release/next
//   RELEASE_REVIEWER   default wieteke.pots

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { BACKLOG_DIR, planArchive, renderStatus } from "./backlog-archive.mjs";
import { sectionBody } from "./changelog-sections.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CHANGELOG = join(ROOT, "CHANGELOG.md");
const ASSIGN = join(ROOT, "scripts", "assign-plugin-version.mjs");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const env = process.env;

const BRANCH = env.RELEASE_BRANCH || "release/next";
const REVIEWER = env.RELEASE_REVIEWER || "wieteke.pots";
const TARGET = env.CI_DEFAULT_BRANCH || "main";
const TOKEN = env.RELEASE_BOT_TOKEN;

function run(command, commandArgs, options = {}) {
  return execFileSync(command, commandArgs, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  }).trim();
}

function fail(message) {
  console.error(`✖ ${message}`);
  process.exit(1);
}

async function api(path, init = {}) {
  const response = await fetch(`${env.CI_API_V4_URL}${path}`, {
    ...init,
    headers: {
      "PRIVATE-TOKEN": TOKEN,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    fail(`${init.method ?? "GET"} ${path} -> ${response.status} ${await response.text()}`);
  }

  return response.json();
}

// 1. The plan, from the same script the manual flow uses.
const plan = run(process.execPath, [ASSIGN]);

if (plan.startsWith("Nothing to release")) {
  console.log(plan);
  process.exit(0);
}

const version = /->\s+(\d+\.\d+\.\d+)/.exec(plan)?.[1];

if (!version) {
  fail(`could not read the next version from the plan:\n${plan}`);
}

console.log(plan.split("\n").slice(0, 3).join("\n"));

// Read before the cut removes the items; --write archives exactly this set.
const backlog = renderStatus(planArchive(ROOT), version);

if (dryRun) {
  console.log(`\n${backlog}`);
  console.log(`\nDry run — would push ${BRANCH} and open or update the MR "release: ${version}".`);
  process.exit(0);
}

if (!TOKEN) {
  console.log(
    `\nRELEASE_BOT_TOKEN is not set, so ${version} is not cut. Add a project access token ` +
      "(scopes api + write_repository) as a masked CI/CD variable, or cut it by hand: " +
      "node scripts/assign-plugin-version.mjs --write.",
  );
  process.exit(0);
}

for (const name of ["CI_API_V4_URL", "CI_PROJECT_PATH", "CI_SERVER_HOST"]) {
  if (!env[name]) {
    fail(`${name} is not set; this script expects to run in GitLab CI`);
  }
}

// 2. Cut the release on the release branch and push it.
run("git", ["checkout", "-q", "-B", BRANCH]);
run(process.execPath, [ASSIGN, "--write"]);
run("git", ["add", "CHANGELOG.md", ".claude-plugin/plugin.json"]);
// The fragments the script folded in are deleted from the tree; stage that
// too. Only when the directory is tracked: a bare pathspec errors otherwise.
for (const dir of ["changelog.d", BACKLOG_DIR]) {
  if (run("git", ["ls-files", dir])) {
    run("git", ["add", "-A", "--", dir]);
  }
}
run("git", [
  "-c",
  "user.name=release-train",
  "-c",
  "user.email=release-train@ci.greenberry.nl",
  "commit",
  "-q",
  "-m",
  `release: ${version}`,
]);

const pushUrl = `https://oauth2:${TOKEN}@${env.CI_SERVER_HOST}/${env.CI_PROJECT_PATH}.git`;

try {
  run("git", ["push", "--force", "--quiet", pushUrl, `HEAD:refs/heads/${BRANCH}`]);
} catch (error) {
  // Never echo the command line: it carries the token.
  fail(`git push to ${BRANCH} failed: ${String(error.stderr ?? error.message).replace(TOKEN, "***")}`);
}

const title = `release: ${version}`;
const description = [
  sectionBody(readFileSync(CHANGELOG, "utf8"), version) ?? "",
  "",
  backlog,
  "",
  "---",
  `Cut by the \`release_train\` CI job from \`${(env.CI_COMMIT_SHA ?? "").slice(0, 7)}\` on \`${TARGET}\`. ` +
    "Merging this MR is the release: the version becomes visible in `/plugin`, " +
    `\`publish_release\` tags \`v${version}\` and creates the GitLab Release, and ` +
    "`announce_release` posts the notes in #development. Every later merge to " +
    `\`${TARGET}\` re-cuts this branch until it is merged.`,
].join("\n");

// 3. One open MR for the branch: update it, or open it with the reviewer.
const project = encodeURIComponent(env.CI_PROJECT_PATH);
const open = await api(
  `/projects/${project}/merge_requests?source_branch=${encodeURIComponent(BRANCH)}&state=opened`,
);

if (open.length > 0) {
  const updated = await api(`/projects/${project}/merge_requests/${open[0].iid}`, {
    method: "PUT",
    body: JSON.stringify({ title, description }),
  });
  console.log(`\n✔ Updated !${updated.iid} (${title}): ${updated.web_url}`);
  process.exit(0);
}

const reviewers = await api(`/users?username=${encodeURIComponent(REVIEWER)}`);

if (reviewers.length === 0) {
  console.warn(`! reviewer '${REVIEWER}' not found; opening the MR without one`);
}

const created = await api(`/projects/${project}/merge_requests`, {
  method: "POST",
  body: JSON.stringify({
    source_branch: BRANCH,
    target_branch: TARGET,
    title,
    description,
    reviewer_ids: reviewers.slice(0, 1).map((user) => user.id),
    remove_source_branch: true,
    labels: "release",
  }),
});

console.log(`\n✔ Opened !${created.iid} (${title}): ${created.web_url}`);
