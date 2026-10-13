// Changelog fragments: one file per MR under changelog.d/, assembled into the
// `## [x.y.z]` section when the release is cut (scripts/assign-plugin-version.mjs).
//
// Why fragments: every content MR used to insert at the same spot under
// `## [Unreleased]`, so whichever MR merged second conflicted — three times on
// 2026-10-07 alone. A file per change never conflicts (towncrier / changesets
// pattern).
//
// File name: changelog.d/<section>.<slug>.md — section is a key of
// FRAGMENT_SECTIONS, slug is [a-z0-9-]. Content: one or more `- ` bullets,
// exactly as they would read under the `### <Section>` heading, continuation
// lines indented by two spaces. The word BREAKING anywhere makes the release a
// MAJOR.
//
// `action` is our one addition to Keep a Changelog: something a developer has
// to do once after updating (delete a file, re-run a skill). It lands under
// `### Action required` and gets its own block in the Slack announcement.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** Fragment file prefix -> `### <Section>` heading. */
export const FRAGMENT_SECTIONS = {
  action: "Action required",
  added: "Added",
  changed: "Changed",
  deprecated: "Deprecated",
  removed: "Removed",
  fixed: "Fixed",
  security: "Security",
};

/** Keep a Changelog order, actions first; also the order sections are rendered in. */
export const SECTION_ORDER = Object.values(FRAGMENT_SECTIONS);

export const FRAGMENT_FILE = new RegExp(
  `^(${Object.keys(FRAGMENT_SECTIONS).join("|")})\\.([a-z0-9][a-z0-9-]*)\\.md$`,
);

export const FRAGMENT_HINT =
  `name it changelog.d/<${Object.keys(FRAGMENT_SECTIONS).join("|")}>.<slug>.md ` +
  "and start it with a '- ' bullet";

function sectionFromFile(name) {
  const match = FRAGMENT_FILE.exec(name);
  return match ? FRAGMENT_SECTIONS[match[1]] : null;
}

/**
 * Every fragment in `dir`, sorted by file name:
 * `{ fragments: [{ file, section, body }], errors: [string] }`.
 * A missing directory is simply "no fragments". Dotfiles are ignored.
 */
export function readFragments(dir) {
  const fragments = [];
  const errors = [];

  if (!existsSync(dir)) {
    return { fragments, errors };
  }

  for (const name of readdirSync(dir).sort()) {
    if (name.startsWith(".")) {
      continue;
    }

    const section = sectionFromFile(name);

    if (!section) {
      errors.push(`changelog.d/${name}: ${FRAGMENT_HINT}`);
      continue;
    }

    const body = readFileSync(join(dir, name), "utf8").trim();

    if (!body.startsWith("- ")) {
      errors.push(`changelog.d/${name}: ${FRAGMENT_HINT}`);
      continue;
    }

    fragments.push({ file: name, section, body });
  }

  return { fragments, errors };
}

/**
 * The entries already written under `## [Unreleased]` by hand (the flow before
 * fragments), grouped by their `### <Section>` heading: Map<section, text>.
 */
export function groupUnreleased(body) {
  const groups = new Map();
  let section = null;
  let lines = [];

  const flush = () => {
    const text = lines.join("\n").trim();
    if (section && text) {
      groups.set(section, groups.has(section) ? `${groups.get(section)}\n${text}` : text);
    }
    lines = [];
  };

  for (const line of body.split("\n")) {
    const heading = /^### (.+)$/.exec(line);
    if (heading) {
      flush();
      section = heading[1].trim();
      continue;
    }
    lines.push(line);
  }

  flush();
  return groups;
}

/** Merge hand-written groups and fragments: Map<section, text>, hand-written first. */
export function mergeGroups(unreleasedGroups, fragments) {
  const groups = new Map(unreleasedGroups);

  for (const fragment of fragments) {
    const existing = groups.get(fragment.section);
    groups.set(fragment.section, existing ? `${existing}\n${fragment.body}` : fragment.body);
  }

  return groups;
}

/** `major` | `minor` | `patch` from the merged groups (same rule as before fragments). */
export function inferBump(groups) {
  const texts = [...groups.values()];

  if (groups.has("Removed") || texts.some((text) => /BREAKING/.test(text))) {
    return "major";
  }

  return groups.has("Added") ? "minor" : "patch";
}

/** The section body for one release: `### Added\n\n…\n\n### Fixed\n\n…\n`. */
export function renderSections(groups) {
  const known = SECTION_ORDER.filter((section) => groups.has(section));
  const unknown = [...groups.keys()].filter((section) => !SECTION_ORDER.includes(section));

  return [...known, ...unknown]
    .map((section) => `### ${section}\n\n${groups.get(section)}\n`)
    .join("\n");
}
