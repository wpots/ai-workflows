// The Slack announcement of a released plugin version, as Block Kit: what to
// do (update the plugin, sync projects, one-off actions) and what changed, as
// one table. Posted by scripts/announce-release.mjs.
//
// Two inputs decide the shape:
// - `syncPaths`: the project-synced files the release changed
//   (scripts/project-sync-paths.mjs). Non-empty adds the "Projecten syncen"
//   block; empty says syncing is not needed; null (unknown) says neither.
// - per changelog entry its `<!-- slack: … -->` note: the Dutch one-liner that
//   puts the entry in the table, optionally `<onderdeel> | <tekst>`. Entries
//   without one are counted under the table, so the author decides what the
//   channel sees. A release without any note falls back to the first sentence
//   of every entry, which is all releases cut before notes existed.
//
// Slack allows one table block per message, so the action overview is a
// section with fields.

import { entries, firstSentence } from "./changelog-sections.mjs";

const ACTION = "Action required";

const TYPE_LABELS = {
  Added: "✨ Nieuw",
  Changed: "🔧 Gewijzigd",
  Deprecated: "⏳ Deprecated",
  Removed: "🗑️ Verwijderd",
  Fixed: "🐛 Fix",
  Security: "🔒 Security",
};

const MONTHS = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

const SYNC_COMMANDS = [
  "cd ~/Web/ai-workflows",
  "git checkout main && git pull --ff-only",
  "./scripts/sync.sh --dry-run --project ~/Web/<project>",
  "./scripts/sync.sh --project ~/Web/<project>",
];

/** Slack mrkdwn needs &, < and > escaped; Slack turns them back on display. */
function escapeMrkdwn(text) {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

/** Changelog Markdown -> Slack mrkdwn: escapes, links, bold. */
function toMrkdwn(text) {
  return escapeMrkdwn(text)
    .replaceAll(/\[([^\]]+)\]\(([^)\s]+)\)/g, "<$2|$1>")
    .replaceAll(/\*\*([^*]+)\*\*/g, "*$1*");
}

function dutchDate(iso) {
  const [year, month, day] = iso.split("-").map(Number);
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

function plural(count, one, many) {
  return count === 1 ? `1 ${one}` : `${count} ${many}`;
}

function pathName(path) {
  const skill = /^skills\/([^/]+)/.exec(path);
  if (skill) {
    return skill[1];
  }
  const command = /^commands\/([^/]+)\.md$/.exec(path);
  return command ? command[1] : path;
}

/**
 * Split "`skills/npm-maintenance`, `commands/x.md` — rest" into
 * `{ component: "npm-maintenance, x", rest }`; component is null without
 * leading paths, and rest is then the whole text.
 */
export function splitLead(text) {
  const dash = text.indexOf(" — ");
  const lead = dash === -1 ? "" : text.slice(0, dash);
  const paths = [...lead.matchAll(/`([^`]+)`/g)].map((match) => match[1]);
  const glue = lead.replaceAll(/`[^`]+`/g, "").replaceAll(",", " ").replaceAll(" and ", " ").trim();

  if (paths.length === 0 || glue !== "") {
    return { component: null, rest: text };
  }

  return { component: [...new Set(paths.map(pathName))].join(", "), rest: text.slice(dash + 3) };
}

function splitNote(note) {
  const bar = note.indexOf("|");
  return bar === -1 ? [null, note] : [note.slice(0, bar).trim(), note.slice(bar + 1).trim()];
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function row(entry) {
  const lead = splitLead(entry.text);
  const [named, summary] = entry.slack
    ? splitNote(entry.slack)
    : [null, capitalize(firstSentence(lead.rest))];

  return {
    type: TYPE_LABELS[entry.section] ?? entry.section ?? "Wijziging",
    component: named ?? lead.component,
    text: summary,
  };
}

/**
 * Table rows `{ type, component, text }` (component null when the entry names
 * none) and how many entries stayed out. Without any note the first sentences
 * stand in, capped harder since they run long.
 */
export function changeRows(body, maxRows = 15, maxFallbackRows = 8) {
  const changes = entries(body).filter((entry) => entry.section !== ACTION);
  const noted = changes.filter((entry) => entry.slack);
  const rows = noted.length > 0 ? noted.slice(0, maxRows).map(row) : changes.slice(0, maxFallbackRows).map(row);

  return { rows, rest: changes.length - rows.length };
}

/** The `### Action required` entries as mrkdwn lines (note, else the full entry). */
export function actionLines(body) {
  return entries(body)
    .filter((entry) => entry.section === ACTION)
    .map((entry) => `• ${entry.slack ? escapeMrkdwn(entry.slack) : toMrkdwn(entry.text)}`);
}

const ADAPTERS = "de project-adapters (`CLAUDE.md`, `AGENTS.md`, Copilot)";
const SYNC_SCRIPT = "het sync-script";

/**
 * Synced paths -> what a developer recognises, biggest reach first: the
 * adapters, then rule and command files, then the sync script.
 */
export function syncLabels(paths, max = 6) {
  const rank = (path) => ["rules/", "commands/"].findIndex((prefix) => path.startsWith(prefix));
  const files = paths.filter((path) => rank(path) !== -1).sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
  const labels = [
    ...(paths.some((path) => path.startsWith("shared/") || path.startsWith("templates/")) ? [ADAPTERS] : []),
    ...files.map((path) => `\`${path}\``),
    ...(paths.some((path) => path.startsWith("scripts/")) ? [SYNC_SCRIPT] : []),
  ];

  const shown = labels.slice(0, max);
  return labels.length > max ? [...shown, `+ ${labels.length - max} meer`] : shown;
}

const plain = (text) => ({ type: "plain_text", text, emoji: true });
const mrkdwn = (text) => ({ type: "mrkdwn", text });
const header = (text) => ({ type: "header", text: plain(text) });
const section = (text) => ({ type: "section", text: mrkdwn(text) });
const context = (text) => ({ type: "context", elements: [mrkdwn(text)] });

/** `text` with `inline code` as a rich_text table cell. */
function richCell(text, style = null) {
  const elements = text
    .split("`")
    .map((part, index) => {
      const code = index % 2 === 1;
      if (!code && !style) {
        return { type: "text", text: part };
      }
      return { type: "text", text: part, style: { ...style, ...(code ? { code: true } : {}) } };
    })
    .filter((element) => element.text);

  return { type: "rich_text", elements: [{ type: "rich_text_section", elements }] };
}

function changesTable(rows) {
  const head = ["Type", "Onderdeel", "Wat verandert"].map((title) => richCell(title, { bold: true }));

  return {
    type: "table",
    column_settings: [{ is_wrapped: false }, { is_wrapped: true }, { is_wrapped: true }],
    rows: [
      head,
      ...rows.map((change) => [
        { type: "raw_text", text: change.type },
        change.component ? richCell(`\`${change.component}\``) : { type: "raw_text", text: "–" },
        richCell(change.text),
      ]),
    ],
  };
}

function syncField(syncPaths) {
  if (!Array.isArray(syncPaths)) {
    return "❔ Zeg ja als Claude meldt dat de project sync stale is";
  }
  return syncPaths.length > 0 ? "✅ Nodig, zie hieronder" : "➖ Niet nodig deze keer";
}

function overview(syncPaths, actionCount) {
  const fields = [
    mrkdwn("*Plugin updaten*\n✅ Iedereen met Claude Code"),
    mrkdwn(`*Projecten syncen*\n${syncField(syncPaths)}`),
    mrkdwn("*Codex*\n✅ `./scripts/sync.sh` draaien"),
  ];

  if (actionCount > 0) {
    const points = plural(actionCount, "punt", "punten");
    fields.push(mrkdwn(`*Eenmalige actie*\n⚠️ ${points}, zie hieronder`));
  }

  return { type: "section", fields };
}

function updateBlocks(version) {
  return [
    header("🔄 Plugin updaten"),
    section(
      [
        "```/plugin marketplace update ai-workflows\n/reload-plugins```",
        `Check met \`/plugin\` dat greenberry op *${version}* staat. Loopt hij achter? Dan mist bijna altijd ` +
          '`"autoUpdate": true` bij de marketplace-entry in `~/.claude/settings.json`; auto-update werkt alleen via SSH.',
        "Codex: draai `./scripts/sync.sh` vanuit een bijgewerkte ai-workflows-checkout.",
      ].join("\n"),
    ),
  ];
}

function syncBlocks(syncPaths) {
  const commands = escapeMrkdwn(SYNC_COMMANDS.join("\n"));

  return [
    header("🗂️ Projecten syncen"),
    section(
      [
        `Gewijzigd in wat een project krijgt: ${syncLabels(syncPaths).join(", ")}.`,
        "Makkelijkst: meldt Claude bij het opstarten dat de project sync stale is? Zeg ja. Zelf doen:",
        "```" + commands + "```",
        "Commit de gesyncte files, inclusief `.claude/ai-workflows-stamp`, als losse `chore`-commit via je gewone " +
          "MR-flow. Projectspecifieke dingen horen in `CONVENTIONS.md`; die blijft staan.",
      ].join("\n"),
    ),
  ];
}

function footer(rest, projectUrl) {
  const parts = [
    `<${projectUrl}/-/blob/main/CHANGELOG.md|Volledige changelog>`,
    `<${projectUrl}/-/blob/main/docs/keep-current.md|keep-current.md>`,
  ];

  if (rest > 0) {
    parts.unshift(`+ ${plural(rest, "andere wijziging", "andere wijzigingen")}`);
  }

  return context(parts.join(" · "));
}

/**
 * `{ text, blocks }` for the incoming webhook: `text` is the notification
 * fallback, `blocks` the message.
 */
export function buildAnnouncement({ version, date, body, projectUrl, syncPaths, maxRows = 15 }) {
  const needsSync = Array.isArray(syncPaths) && syncPaths.length > 0;
  const actions = actionLines(body);
  const { rows, rest } = changeRows(body, maxRows);
  const todo = needsSync ? "*plugin updaten én je projecten syncen*" : "*de plugin updaten*";
  const released = date ? ` · ${dutchDate(date)}` : "";

  const blocks = [
    header(`📦 greenberry plugin ${version}`),
    context(`ai-workflows${released} · <${projectUrl}/-/blob/main/CHANGELOG.md|changelog>`),
    section(`Hoi devs :wave: er staat een nieuwe versie van de greenberry plugin klaar. Deze keer: ${todo}.`),
    overview(syncPaths, actions.length),
    { type: "divider" },
    ...updateBlocks(version),
    ...(needsSync ? syncBlocks(syncPaths) : []),
    ...(actions.length > 0 ? [header("⚠️ Eenmalig"), section(actions.join("\n"))] : []),
    header("✨ Wat is er nieuw"),
    ...(rows.length > 0 ? [changesTable(rows)] : []),
    footer(rest, projectUrl),
  ];

  const summary = needsSync ? "plugin updaten en projecten syncen" : "plugin updaten";
  return { text: `📦 greenberry plugin ${version} staat klaar: ${summary}.`, blocks };
}

function cellText(cell) {
  if (cell.type === "raw_text") {
    return cell.text;
  }
  return cell.elements[0].elements.map((part) => (part.style?.code ? `\`${part.text}\`` : part.text)).join("");
}

function blockText(block) {
  switch (block.type) {
    case "header":
      return `*${block.text.text}*`;
    case "section":
      return block.text?.text ?? block.fields.map((field) => field.text.replace("\n", ": ")).join("\n");
    case "context":
      return `_${block.elements.map((element) => element.text).join(" ")}_`;
    case "table":
      return block.rows
        .slice(1)
        .map(([type, name, what]) => `• ${cellText(type)} · ${cellText(name)} — ${cellText(what)}`)
        .join("\n");
    case "divider":
      return "———";
    default:
      return "";
  }
}

/**
 * The blocks as one mrkdwn message: the dry-run preview, and what to paste by
 * hand when the webhook is missing.
 */
export function toPlainMrkdwn({ blocks }) {
  return blocks.map(blockText).join("\n\n");
}
