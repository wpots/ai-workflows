// Shared CHANGELOG.md readers for the release automation
// (scripts/release-train.mjs, scripts/announce-release.mjs) and their tests.
//
// The changelog follows Keep a Changelog: one `## [x.y.z] - date` heading per
// release, `### Added` / `### Changed` / … underneath, one `- ` entry per
// change, continuation lines indented by two spaces.

const SECTION_LABELS = {
  Added: "Nieuw",
  Changed: "Gewijzigd",
  Fixed: "Fix",
  Removed: "Verwijderd",
  Deprecated: "Deprecated",
  Security: "Security",
};

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

/** `[{ section, text }]` — every `- ` entry of a section body, joined to one line. */
export function entries(body) {
  const out = [];
  let section = null;
  let current = null;

  const flush = () => {
    if (current) {
      out.push({ section: current.section, text: current.lines.join(" ") });
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
      current = { section, lines: [line.slice(2).trim()] };
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

/**
 * The Slack (mrkdwn) announcement for a released version: the update
 * reminder, then one bullet per changelog entry, capped.
 */
export function renderAnnouncement({ version, body, projectUrl, maxBullets = 10 }) {
  const all = entries(body);
  const shown = all.slice(0, maxBullets);
  const bullets = shown.map((entry) => {
    const label = SECTION_LABELS[entry.section] ?? entry.section ?? "Wijziging";
    return `• ${label}: ${firstSentence(entry.text)}`;
  });
  const rest = all.length - shown.length;

  if (rest > 0) {
    bullets.push(`_+ ${rest} meer in de changelog_`);
  }

  return [
    `:package: *greenberry plugin ${version}* staat klaar (ai-workflows). Even updaten, anders draai je op oude skills en rules.`,
    "",
    "*Updaten*",
    "`/plugin marketplace update ai-workflows` en daarna `/reload-plugins`; check met `/plugin` dat greenberry op " +
      `${version} staat. Loopt hij achter? Dan mist meestal \`"autoUpdate": true\` bij de marketplace-entry in ` +
      "`~/.claude/settings.json` (auto-update werkt alleen via SSH). Projecten: zeg ja als Claude bij het " +
      `opstarten meldt dat de project sync stale is. Meer: <${projectUrl}/-/blob/main/docs/keep-current.md|keep-current.md>`,
    "",
    "*Wat is er nieuw*",
    ...bullets,
    "",
    `Changelog: <${projectUrl}/-/blob/main/CHANGELOG.md|CHANGELOG.md>`,
  ].join("\n");
}
