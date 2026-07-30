#!/usr/bin/env node
// Delivery metrics for one repo over a time window. Read-only: git log plus
// glab api. Zero dependencies; requires Node 18+, git, and (optionally) an
// authenticated glab for the MR-level numbers.
//
// Usage: node scripts/delivery-metrics.mjs [--repo <path>] [--since <ISO-date>]
//   --repo   repo to measure (default: cwd)
//   --since  window start (default: 30 days ago)
//
// Prints a markdown table: merged MRs, median hours to merge, agent-authored
// commit share (Co-Authored-By: Claude trailers), revert count. The trend
// between sweeps is the signal — absolute values mean little on their own.

import { execFileSync } from "node:child_process";

const args = process.argv.slice(2);
const argValue = (flag) => {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : null;
};

const repo = argValue("--repo") ?? process.cwd();
const since =
  argValue("--since") ??
  new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 10);

const git = (...a) =>
  execFileSync("git", ["-C", repo, ...a], { encoding: "utf8" }).trim();

const lines = (s) => (s ? s.split("\n").filter(Boolean) : []);

// ── Commit-level metrics (always available) ──────────────────────────────────
// Prefer the gitlab.com remote when several exist (mirrors go stale; the
// GitLab remote is canonical at Greenberry), else origin, else the first.

const remotes = lines(git("remote"));
const remote =
  remotes.find((r) => {
    try {
      return git("remote", "get-url", r).includes("gitlab.com");
    } catch {
      return false;
    }
  }) ?? (remotes.includes("origin") ? "origin" : remotes[0]);

const defaultBranch = (() => {
  try {
    return git("rev-parse", "--abbrev-ref", `${remote}/HEAD`).split("/").pop();
  } catch {
    try {
      git("rev-parse", "--verify", `${remote}/main`);
      return "main";
    } catch {
      return "master";
    }
  }
})();

const range = `${remote}/${defaultBranch}`;
const totalCommits = lines(
  git("log", range, `--since=${since}`, "--no-merges", "--pretty=%H"),
).length;
const agentCommits = lines(
  git(
    "log",
    range,
    `--since=${since}`,
    "--no-merges",
    "--grep=Co-Authored-By: Claude",
    "--pretty=%H",
  ),
).length;
const reverts = lines(
  git("log", range, `--since=${since}`, "--pretty=%s"),
).filter((s) => s.startsWith("Revert")).length;

// ── MR-level metrics (best effort via glab) ──────────────────────────────────

let mergedMrs = null;
let medianHours = null;
try {
  const raw = execFileSync(
    "glab",
    [
      "api",
      `projects/:id/merge_requests?state=merged&updated_after=${since}T00:00:00Z&per_page=100`,
    ],
    { encoding: "utf8", cwd: repo },
  );
  const mrs = JSON.parse(raw).filter((mr) => mr.merged_at >= `${since}`);
  mergedMrs = mrs.length;
  const hours = mrs
    .map(
      (mr) =>
        (new Date(mr.merged_at) - new Date(mr.created_at)) / 3_600_000,
    )
    .sort((a, b) => a - b);
  if (hours.length > 0) {
    const mid = Math.floor(hours.length / 2);
    medianHours =
      hours.length % 2 === 1
        ? hours[mid]
        : (hours[mid - 1] + hours[mid]) / 2;
  }
} catch {
  // glab missing or unauthenticated — commit-level numbers still stand.
}

// ── Report ───────────────────────────────────────────────────────────────────

const pct =
  totalCommits > 0 ? Math.round((agentCommits / totalCommits) * 100) : 0;
const fmt = (v, unit = "") => (v === null ? "n/a" : `${v}${unit}`);

console.log(`### Delivery metrics — since ${since} (${range})`);
console.log("");
console.log("| Metric | Value |");
console.log("| ------ | ----- |");
console.log(`| Merged MRs in window | ${fmt(mergedMrs)} |`);
console.log(
  `| Median hours MR-created → merged | ${fmt(
    medianHours === null ? null : Math.round(medianHours * 10) / 10,
  )} |`,
);
console.log(
  `| Agent-authored commit share | ${pct}% (${agentCommits}/${totalCommits}) |`,
);
console.log(`| Reverts | ${reverts} |`);
console.log("");
console.log(
  "Caveats: agent share counts `Co-Authored-By: Claude` trailers, so squash",
);
console.log(
  "merges that drop trailers undercount it. Intervention rate is not",
);
console.log(
  "measurable from git — record it as n/a until session telemetry exists.",
);
if (mergedMrs === null) {
  console.log(
    "MR-level metrics unavailable (glab missing or unauthenticated).",
  );
}
