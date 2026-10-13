#!/usr/bin/env node
// The release is where this repo's backlog is reconciled. ai-workflows has no
// sprints, so no sprint close archives delivered items: cutting a release
// (scripts/assign-plugin-version.mjs --write, from the `release_train` CI job
// or by hand) removes every item in docs/backlog/ whose Status is `done` or
// `superseded`, and the release MR carries the backlog status rendered here.
// The release tag is the archive anchor — `git show v<x.y.z>^1:docs/backlog/<file>`
// reads a removed item back — and the GitLab Release lists what it archived
// (scripts/publish-release.mjs).
//
// An item a living doc still names (tracked Markdown outside docs/backlog/,
// CHANGELOG.md and changelog.d/) stays: the validator's link and pipeline-map
// checks would fail on the removal. The status names the doc, so the
// reference can be dropped and the next release archives the item.
//
// Usage:
//   node scripts/backlog-archive.mjs            # print the status, write nothing
//   node scripts/backlog-archive.mjs --write    # remove the archivable items
//   node scripts/backlog-archive.mjs --root <dir>

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const BACKLOG_DIR = "docs/backlog";

const ARCHIVED = new Set(["done", "superseded"]);
const OPEN_ORDER = ["in-progress", "ready", "draft"];

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** First line under `## Status` that is neither blank nor an HTML comment, as one lowercase word. */
function readStatus(text) {
  const lines = text.split("\n");
  const start = lines.findIndex((line) => /^## Status\s*$/.test(line));

  if (start === -1) {
    return null;
  }

  for (const line of lines.slice(start + 1)) {
    if (line.startsWith("## ")) {
      return null;
    }

    const clean = line.trim().replace(/[*`]/g, "");

    if (!clean || clean.startsWith("<!--")) {
      continue;
    }

    return /^[a-z-]+/i.exec(clean)?.[0].toLowerCase() ?? null;
  }

  return null;
}

/** `{ path, file, title, status, mr }` for one backlog item's Markdown. */
export function describeItem(path, text) {
  const file = basename(path);
  const mr = /^- MR:.*?(?:merge_requests\/|!)(\d+)/m.exec(text)?.[1];

  return {
    path,
    file,
    title: /^# (.+)$/m.exec(text)?.[1].trim() ?? file,
    status: readStatus(text),
    mr: mr ? `!${mr}` : null,
  };
}

function trackedFiles(root) {
  return execFileSync("git", ["ls-files", "-z"], { cwd: root, encoding: "utf8" })
    .split("\0")
    .filter(Boolean);
}

/**
 * `{ items, archive, kept }`: every tracked backlog item, the `done` and
 * `superseded` ones that can go, and the ones a living doc still names
 * (each with `namedIn`).
 */
export function planArchive(root) {
  if (!existsSync(join(root, BACKLOG_DIR))) {
    return { items: [], archive: [], kept: [] };
  }

  const tracked = trackedFiles(root);
  const read = (file) => readFileSync(join(root, file), "utf8");
  const items = tracked
    .filter(
      (file) =>
        dirname(file) === BACKLOG_DIR && file.endsWith(".md") && !basename(file).startsWith("_"),
    )
    .map((file) => describeItem(file, read(file)));
  const livingDocs = tracked
    .filter(
      (file) =>
        file.endsWith(".md") &&
        !file.startsWith(`${BACKLOG_DIR}/`) &&
        !file.startsWith("changelog.d/") &&
        file !== "CHANGELOG.md",
    )
    .map((file) => [file, read(file)]);
  const archive = [];
  const kept = [];

  for (const item of items.filter((entry) => ARCHIVED.has(entry.status))) {
    // Whole file name only: `feat-a.md` must not match inside `x-feat-a.md`.
    const named = new RegExp(`(?:^|[^\\w.-])${escapeRegExp(item.file)}`);
    const namedIn = livingDocs.filter(([, text]) => named.test(text)).map(([file]) => file);

    if (namedIn.length > 0) {
      kept.push({ ...item, namedIn });
    } else {
      archive.push(item);
    }
  }

  return { items, archive, kept };
}

export function applyArchive(root, plan) {
  for (const item of plan.archive) {
    unlinkSync(join(root, item.path));
  }
}

const itemLine = (item) => `- \`${item.file}\` — ${item.title}${item.mr ? ` (${item.mr})` : ""}`;

/** The backlog section of the release MR description. */
export function renderStatus(plan, version = "<x.y.z>") {
  const lines = ["### Backlog", ""];

  if (plan.archive.length > 0) {
    lines.push(
      `Archived by this release: removed from \`${BACKLOG_DIR}/\`, readable after the merge ` +
        `with \`git show v${version}^1:${BACKLOG_DIR}/<file>\`.`,
      "",
      ...plan.archive.map(itemLine),
      "",
    );
  } else {
    lines.push("Nothing to archive: no item is `done` or `superseded`.", "");
  }

  if (plan.kept.length > 0) {
    lines.push(
      "Done, but kept: a living doc still names it. Drop the reference, and the next release archives it.",
      "",
      ...plan.kept.map(
        (item) => `- \`${item.file}\` — named in ${item.namedIn.map((file) => `\`${file}\``).join(", ")}`,
      ),
      "",
    );
  }

  const open = new Map();

  for (const item of plan.items) {
    if (item.status !== null && !ARCHIVED.has(item.status)) {
      open.set(item.status, [...(open.get(item.status) ?? []), item.file]);
    }
  }

  const rank = (status) =>
    OPEN_ORDER.includes(status) ? OPEN_ORDER.indexOf(status) : OPEN_ORDER.length;
  const parts = [...open.keys()]
    .sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
    .map((status) => {
      const files = open.get(status);
      // In progress after its merge means a post-merge check is still open.
      return status === "in-progress"
        ? `${status} ${files.length} (${files.map((file) => `\`${file}\``).join(", ")})`
        : `${status} ${files.length}`;
    });

  if (parts.length > 0) {
    lines.push(`Still open: ${parts.join(" · ")}`, "");
  }

  const unreadable = plan.items.filter((item) => item.status === null);

  if (unreadable.length > 0) {
    lines.push(
      `Status unreadable, so never archived: ${unreadable.map((item) => `\`${item.file}\``).join(", ")}`,
    );
  }

  return lines.join("\n").trimEnd();
}

/** The backlog section of the GitLab Release: archived items, linked where they still exist. */
export function renderArchived(items, blobBase) {
  return [
    "### Backlog",
    "",
    "Delivered and archived with this release:",
    "",
    ...items.map((item) => `- [${item.title}](${blobBase}/${item.path})${item.mr ? ` (${item.mr})` : ""}`),
  ].join("\n");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const rootIndex = args.indexOf("--root");
  const root =
    rootIndex === -1 ? join(dirname(fileURLToPath(import.meta.url)), "..") : args[rootIndex + 1];
  const plan = planArchive(root);

  console.log(renderStatus(plan));

  if (args.includes("--write")) {
    applyArchive(root, plan);
    console.log(`\n✔ Archived ${plan.archive.length} item(s) from ${BACKLOG_DIR}/.`);
  } else {
    console.log("\nDry run — pass --write to remove them.");
  }
}
