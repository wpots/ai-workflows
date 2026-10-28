// What a release changed in the files a project sync delivers — the answer to
// "do developers have to re-sync their projects for this version?" in the
// Slack announcement (scripts/announce-release.mjs).
//
// PROJECT_SYNC_PATHSPECS is the source set scripts/project-sync-freshness.sh
// digests into a project's .claude/ai-workflows-stamp: a change there is
// exactly what makes the SessionStart hook call a project stale.
// scripts/test-release-automation.mjs keeps the two lists in step.

import { execFileSync } from "node:child_process";

export const PROJECT_SYNC_PATHSPECS = [
  "rules",
  "commands",
  "shared",
  "templates/project-ai-workflows.md",
  "templates/project-CLAUDE.md",
  "templates/project-AGENTS.md",
  "templates/project-claude-settings.json",
  "scripts/sync.sh",
  "scripts/project-sync-freshness.sh",
];

// The release MR merges with `release: x.y.z` in its message (the release
// commit itself, and the merge commit's body); git matches --grep per line.
const RELEASE_LINE = "^release: [0-9][0-9.]*$";

function git(root, args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
}

/**
 * `{ from, to }`: the commit that released `version` (HEAD when `atHead`) and
 * the previous release before it. Null when either is out of reach, e.g. in a
 * shallow clone — the announcement then says nothing about syncing.
 */
export function releaseRange(root, version, { atHead = false } = {}) {
  try {
    const to = atHead
      ? git(root, ["rev-parse", "HEAD"])
      : git(root, ["log", "-1", "--format=%H", `--grep=^release: ${version.replaceAll(".", "\\.")}$`]);
    const from = to && git(root, ["log", "-1", "--format=%H", `--grep=${RELEASE_LINE}`, `${to}^1`]);

    return to && from ? { from, to } : null;
  } catch {
    return null;
  }
}

/** The synced files that differ between the two commits, in git's path order; null when git cannot tell. */
export function changedSyncPaths(root, { from, to }) {
  try {
    const out = git(root, ["diff", "--name-only", from, to, "--", ...PROJECT_SYNC_PATHSPECS]);
    return out ? out.split("\n") : [];
  } catch {
    return null;
  }
}
