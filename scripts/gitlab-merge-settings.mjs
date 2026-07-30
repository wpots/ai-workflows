#!/usr/bin/env node
// Check (and optionally fix) a GitLab project's merge settings against the
// Greenberry baseline in rules/git-flow.md. Read-only unless --apply is passed.
// Zero dependencies; requires Node 18+, git, and an authenticated glab.
//
// Usage: node scripts/gitlab-merge-settings.mjs [--repo <path>] [--project <path>]
//                                               [--apply] [--strict]
//   --repo     local repo whose gitlab.com remote identifies the project
//              (default: cwd; ignored when --project is given)
//   --project  GitLab project path, e.g. greenberrynl/config/ai-workflows
//   --apply    write the deviating settings back (one PUT); default is report-only
//   --strict   exit 1 when the project deviates (for CI); default always exits 0
//
// Prints a markdown table: setting, current value, expected value, verdict.

import { execFileSync } from "node:child_process";

const args = process.argv.slice(2);
const argValue = (flag) => {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : null;
};
const hasFlag = (flag) => args.includes(flag);

const repo = argValue("--repo") ?? process.cwd();
const apply = hasFlag("--apply");
const strict = hasFlag("--strict");

// The baseline. Keep in sync with the settings table in rules/git-flow.md.
const SQUASH_TEMPLATE = [
  "%{title}",
  "",
  "%{description}",
  "",
  "See merge request %{reference}",
].join("\n");

const BASELINE = [
  ["merge_method", "ff", "no merge commits — linear default branch"],
  ["squash_option", "always", "one commit per reviewable slice"],
  [
    "squash_commit_template",
    SQUASH_TEMPLATE,
    "carry title, body and MR reference into the squashed commit",
  ],
  ["remove_source_branch_after_merge", true, "the MR is the record"],
  ["only_allow_merge_if_pipeline_succeeds", true, "no red pipeline in history"],
  [
    "only_allow_merge_if_all_discussions_are_resolved",
    true,
    "the review gate is real, not advisory",
  ],
];

// ── Resolve the project path ─────────────────────────────────────────────────

const gitlabPathFromRemote = () => {
  const git = (...a) =>
    execFileSync("git", ["-C", repo, ...a], { encoding: "utf8" }).trim();
  const urls = git("remote")
    .split("\n")
    .filter(Boolean)
    .map((r) => {
      try {
        return git("remote", "get-url", r);
      } catch {
        return "";
      }
    })
    .filter((u) => u.includes("gitlab.com"));
  if (urls.length === 0) return null;
  // git@gitlab.com:group/sub/project.git | https://gitlab.com/group/sub/project.git
  const match = urls[0].match(/gitlab\.com[:/](.+?)(?:\.git)?$/);
  return match ? match[1] : null;
};

const projectPath = argValue("--project") ?? gitlabPathFromRemote();

if (!projectPath) {
  console.error(
    "No GitLab project resolved. Pass --project <group/project>, or run inside a repo with a gitlab.com remote.",
  );
  process.exit(2);
}

const encoded = encodeURIComponent(projectPath);

// ── Read the current settings ────────────────────────────────────────────────

let project;
try {
  project = JSON.parse(
    execFileSync("glab", ["api", `projects/${encoded}`], { encoding: "utf8" }),
  );
} catch {
  console.error(
    `Could not read projects/${projectPath} — is glab authenticated and do you have Maintainer access?`,
  );
  process.exit(2);
}

const show = (v) => {
  if (v === null || v === undefined) return "_unset_";
  if (typeof v === "string") return `\`${v.replace(/\n/g, "\\n")}\``;
  return `\`${v}\``;
};

const deviations = BASELINE.filter(([key, want]) => project[key] !== want);

// ── Report ───────────────────────────────────────────────────────────────────

console.log(`### Merge settings — ${projectPath}`);
console.log("");
console.log("| Setting | Current | Expected | Verdict |");
console.log("| --- | --- | --- | --- |");
for (const [key, want] of BASELINE) {
  const ok = project[key] === want;
  console.log(
    `| \`${key}\` | ${show(project[key])} | ${show(want)} | ${
      ok ? "ok" : "deviation"
    } |`,
  );
}
console.log("");

if (deviations.length === 0) {
  console.log("Compliant with the baseline in `rules/git-flow.md`.");
  process.exit(0);
}

console.log(
  `${deviations.length} deviation(s) from \`rules/git-flow.md\`:`,
);
for (const [key, want, why] of deviations) {
  console.log(`- \`${key}\` → ${show(want)} — ${why}`);
}
console.log("");

if (!apply) {
  console.log("Report-only. To fix, after an explicit go:");
  console.log("");
  console.log(
    `    node scripts/gitlab-merge-settings.mjs --project ${projectPath} --apply`,
  );
  console.log("");
  console.log(
    "Protected-branch, approval-rule and reviewer policy are out of scope here — see `rules/git-flow.md`.",
  );
  process.exit(strict ? 1 : 0);
}

// ── Apply ────────────────────────────────────────────────────────────────────

const fields = deviations.flatMap(([key, want]) => [
  typeof want === "string" ? "--raw-field" : "--field",
  `${key}=${want}`,
]);

try {
  execFileSync("glab", ["api", "--method", "PUT", `projects/${encoded}`, ...fields], {
    encoding: "utf8",
  });
} catch (err) {
  console.error(`PUT failed: ${err.message}`);
  process.exit(2);
}

console.log(`Applied ${deviations.length} setting(s) to ${projectPath}.`);
console.log("Re-run without --apply to confirm the project now reports ok.");
