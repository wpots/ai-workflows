// Shared by the jobs that act once a release MR has merged
// (scripts/announce-release.mjs, scripts/publish-release.mjs).

import { execFileSync } from "node:child_process";

/**
 * Whether HEAD changed the version in .claude-plugin/plugin.json against its
 * first parent: true for a release merge, false for a content merge, null
 * when HEAD^1 is not available (the CI job needs GIT_DEPTH 2 or deeper).
 */
export function headIsRelease(root) {
  try {
    execFileSync("git", ["diff", "--quiet", "HEAD^1", "HEAD", "--", ".claude-plugin/plugin.json"], {
      cwd: root,
      stdio: "ignore",
    });
    return false;
  } catch (error) {
    return error.status === 1 ? true : null;
  }
}
