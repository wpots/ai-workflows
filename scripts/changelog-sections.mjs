// Shared CHANGELOG.md readers for the release automation
// (scripts/release-train.mjs, scripts/announce-release.mjs,
// scripts/publish-release.mjs) and their tests.
//
// The changelog follows Keep a Changelog: one `## [x.y.z] - date` heading per
// release, `### Added` / `### Changed` / … underneath, one `- ` entry per
// change, continuation lines indented by two spaces. An entry may carry one
// `<!-- slack: … -->` continuation line: the Dutch one-liner the Slack
// announcement shows for it (scripts/release-announcement.mjs). GitLab renders
// the comment invisibly, so CHANGELOG.md reads the same with or without it.

// A line of its own, so prose that quotes the syntax inline is not a note.
const SLACK_NOTE = /^ +<!-- ?slack: ?(.+?) ?-->$/;

const ABBREVIATIONS = /(?:^|[\s(])(?:e\.g|i\.e|vs|etc|cf|resp)$/i;

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Body of the `## [<heading>]` section (heading: "Unreleased" or "2.5.0"),
 * trimmed, up to the next `## [` heading. Null when the heading is missing.
 * Anchored to a heading line, so the intro prose that mentions
 * `## [Unreleased]` inline does not match.
 */
export function sectionBody(changelog, heading) {
  const match = new RegExp(`^## \\[${escapeRegExp(heading)}\\][^\\n]*$`, "m").exec(
    changelog,
  );

  if (!match) {
    return null;
  }

  const after = match.index + match[0].length;
  const next = changelog.indexOf("\n## [", after);

  return changelog.slice(after, next === -1 ? changelog.length : next).trim();
}

/**
 * `[{ section, text, slack }]` — every `- ` entry of a section body, joined to
 * one line; `slack` is its `<!-- slack: … -->` note line (or null), which
 * stays out of `text`.
 */
export function entries(body) {
  const out = [];
  let section = null;
  let current = null;

  const flush = () => {
    if (current) {
      out.push({ section: current.section, text: current.lines.join(" "), slack: current.slack });
      current = null;
    }
  };

  for (const line of body.split("\n")) {
    const heading = /^### (.+)$/.exec(line);

    if (heading) {
      flush();
      section = heading[1];
      continue;
    }

    if (line.startsWith("- ")) {
      flush();
      current = { section, lines: [line.slice(2).trim()], slack: null };
      continue;
    }

    const note = current && SLACK_NOTE.exec(line);

    if (note) {
      current.slack = note[1];
      continue;
    }

    if (current && /^\s+\S/.test(line)) {
      current.lines.push(line.trim());
      continue;
    }

    if (!line.trim()) {
      flush();
    }
  }

  flush();
  return out;
}

/** The first sentence of an entry: up to a period followed by whitespace, outside backticks. */
export function firstSentence(text) {
  let inCode = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (char === "`") {
      inCode = !inCode;
      continue;
    }

    if (inCode || char !== ".") {
      continue;
    }

    const atEnd = index === text.length - 1;
    const beforeSpace = !atEnd && /\s/.test(text[index + 1]);

    if ((atEnd || beforeSpace) && !ABBREVIATIONS.test(text.slice(0, index))) {
      return text.slice(0, index + 1);
    }
  }

  return text;
}

/** The release date from `## [<version>] - <date>`, or null. */
export function sectionDate(changelog, version) {
  const match = new RegExp(
    `^## \\[${escapeRegExp(version)}\\] - (\\d{4}-\\d{2}-\\d{2})\\s*$`,
    "m",
  ).exec(changelog);

  return match ? match[1] : null;
}
