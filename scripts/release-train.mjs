#!/usr/bin/env node
// Keeps one release MR current. Runs in CI on every push to main (see
// .gitlab-ci.yml `release_train` and docs/contributing.md § Ship A Plugin
// Release):
//
//   1. `## [Unreleased]` empty  -> nothing to do, exit 0.
//   2. Otherwise run scripts/assign-plugin-version.mjs --write on a branch
//      (`release/next`), commit "release: x.y.z", force-push it, and open the
//      MR to main as a draft — or update the open MR's title and description
//      when it already exists, keeping its draft state. The cut archives the
//      delivered backlog items, so the description carries the backlog
//      status next to the changelog section.
//
// With --ready (the Monday pipeline schedule, job `release_ready`) it does
// none of that: it takes the open release MR out of draft and requests the
// maintainer's review. A draft cannot merge, so a week of content merges
// ships as one version and one Slack post.
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
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { BACKLOG_DIR, planArchive, quarterFolder, renderStatus } from "./backlog-archive.mjs";
import { sectionBody } from "./changelog-sections.mjs";
import { readyTitle, releaseTitle } from "./release-mr.mjs";

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
const PROJECT = encodeURIComponent(env.CI_PROJECT_PATH ?? "");

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

function requireCi(names) {
  for (const name of names) {
    if (!env[name]) {
      fail(`${name} is not set; this script expects to run in GitLab CI`);
    }
  }
}

function openReleaseMrs() {
  return api(`/projects/${PROJECT}/merge_requests?source_branch=${encodeURIComponent(BRANCH)}&state=opened`);
}

// --ready runs before the plan: it changes the MR, not the branch.
if (args.includes("--ready")) {
  if (!TOKEN) {
    console.log("RELEASE_BOT_TOKEN is not set, so no release MR is marked ready.");
    process.exit(0);
  }

  requireCi(["CI_API_V4_URL", "CI_PROJECT_PATH"]);

  const [open] = await openReleaseMrs();

  if (!open) {
    console.log(`No open MR from ${BRANCH}: nothing to release this week.`);
    process.exit(0);
  }

  const update = { title: readyTitle(open.title) };
  const reviewers = await api(`/users?username=${encodeURIComponent(REVIEWER)}`);

  if (reviewers.length > 0) {
    update.reviewer_ids = [reviewers[0].id];
  } else {
    console.warn(`! reviewer '${REVIEWER}' not found; marking the MR ready without one`);
  }

  const updated = await api(`/projects/${PROJECT}/merge_requests/${open.iid}`, {
    method: "PUT",
    body: JSON.stringify(update),
  });

  if (updated.draft) {
    fail(`!${updated.iid} is still a draft after the title change ("${updated.title}"); mark it ready by hand`);
  }

  console.log(`✔ !${updated.iid} (${updated.title}) is ready to merge: ${updated.web_url}`);
  process.exit(0);
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

// Read before the cut moves the items; --write archives exactly this set.
const backlog = renderStatus(planArchive(ROOT));

if (dryRun) {
  console.log(`\n${backlog}`);
  console.log(`\nDry run — would push ${BRANCH} and open (as a draft) or update the MR "release: ${version}".`);
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

requireCi(["CI_API_V4_URL", "CI_PROJECT_PATH", "CI_SERVER_HOST"]);

// 2. Commit as the token's own user. The project push rule "reject unverified
// users" (commit_committer_check) refuses any committer email that is not a
// verified email of the pusher, and a bot user's only verified address is the
// one GitLab gave it — so the name and email come from the API, not from here.
const me = await api("/user");

if (!me.email) {
  fail(
    `the token's user '${me.username}' exposes no email; the push rule needs the ` +
      "committer to be a verified email of that user",
  );
}

run("git", ["checkout", "-q", "-B", BRANCH]);
run(process.execPath, [ASSIGN, "--write"]);
run("git", ["add", "CHANGELOG.md", ".claude-plugin/plugin.json"]);
// The fragments the script folded in are deleted from the tree and the
// archived items moved into the quarter folder; stage that too. Only when the
// directory is tracked or on disk: a bare pathspec errors otherwise.
for (const dir of ["changelog.d", BACKLOG_DIR, quarterFolder()]) {
  if (run("git", ["ls-files", dir]) || existsSync(join(ROOT, dir))) {
    run("git", ["add", "-A", "--", dir]);
  }
}
run("git", [
  "-c",
  `user.name=${me.name || me.username}`,
  "-c",
  `user.email=${me.email}`,
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

const description = [
  sectionBody(readFileSync(CHANGELOG, "utf8"), version) ?? "",
  "",
  backlog,
  "",
  "---",
  `Cut by the \`release_train\` CI job from \`${(env.CI_COMMIT_SHA ?? "").slice(0, 7)}\` on \`${TARGET}\`. ` +
    "Merging this MR is the release: the version becomes visible in `/plugin`, " +
    `\`publish_release\` tags \`v${version}\` and creates the GitLab Release, and ` +
    "`announce_release` posts the notes in #ai-workflows. Every later merge to " +
    `\`${TARGET}\` re-cuts this branch until it is merged. It stays a draft ` +
    "until the Monday-morning schedule marks it ready and requests review; for " +
    "a fix someone is waiting on, mark it ready by hand and merge right away.",
].join("\n");

// 3. One open MR for the branch: update it and keep its draft state, or open
// it as a draft. The reviewer is requested when --ready takes it out of draft.
const [open] = await openReleaseMrs();

if (open) {
  const title = releaseTitle(version, { draft: open.draft });
  const updated = await api(`/projects/${PROJECT}/merge_requests/${open.iid}`, {
    method: "PUT",
    body: JSON.stringify({ title, description }),
  });
  console.log(`\n✔ Updated !${updated.iid} (${title}): ${updated.web_url}`);
  process.exit(0);
}

const title = releaseTitle(version, { draft: true });
const created = await api(`/projects/${PROJECT}/merge_requests`, {
  method: "POST",
  body: JSON.stringify({
    source_branch: BRANCH,
    target_branch: TARGET,
    title,
    description,
    remove_source_branch: true,
    labels: "release",
  }),
});

console.log(`\n✔ Opened !${created.iid} (${title}): ${created.web_url}`);
