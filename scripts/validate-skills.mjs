#!/usr/bin/env node
// Static validation for ai-workflows skills, commands, and cross-surface
// consistency. Zero dependencies; requires Node 18+ and git.
//
// Errors (exit 1): broken frontmatter, name/directory mismatch, duplicate
// names, references to files that don't exist, broken relative links,
// mapping targets that don't exist, a skill or command missing from its routing
// registry, an adapter missing a shared marker, canonical-sources rows pointing
// at missing files, pipeline-map paths that don't exist, FEATURES.md rows
// naming untracked paths, MR-creation snippets missing the provenance label,
// skills without a metadata.owner, frontmatter values a strict YAML parser
// rejects or misreads.
//
// Warnings (exit 0): skills/commands missing from the canonical-sources
// inventory, skills/commands/rules not placed in the pipeline map, pipeline-map
// paths that exist but are untracked, skills/commands/rules/MCP servers missing
// from the FEATURES.md inventories, descriptions without a routing cue,
// SKILL.md bodies over the 500-line progressive-disclosure budget,
// unknown frontmatter keys, a skill in the risky set without an evals/<skill>/
// directory.
//
// Why routing gaps are errors and inventory gaps are warnings: the two docs are
// documentation, but shared/command-mappings.md and shared/skill-mappings.md are
// functional. A workflow missing there cannot be reached by intent on any tool,
// which is how skills/jira-ticket stayed unroutable while both inventories
// listed it.

import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { FRAGMENT_FILE, FRAGMENT_HINT } from "./changelog-fragments.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const errors = [];
const warnings = [];
const err = (file, msg) => errors.push(`${file}: ${msg}`);
const warn = (file, msg) => warnings.push(`${file}: ${msg}`);

// Validate tracked files only, so untracked work-in-progress never fails CI.
const tracked = new Set(
  execFileSync("git", ["-C", ROOT, "ls-files"], { encoding: "utf8" })
    .split("\n")
    .filter(Boolean),
);

for (const rel of tracked) {
  if (/^(skills|commands|rules\/stacks|\.github\/prompts)\/experimental\./.test(rel)) {
    err(rel, "legacy experimental workflow namespace is not allowed");
  }
}

// ── No committed conflict markers ────────────────────────────────────────────
// `git rebase --continue` bypasses the pre-commit hook, so a half-resolved
// conflict can reach a branch unnoticed. Only opener/closer lines are flagged:
// a bare ======= line can legitimately be a setext underline.
for (const rel of tracked) {
  let text;
  try {
    text = readFileSync(path.join(ROOT, rel), "utf8");
  } catch {
    continue; // unreadable or binary-ish — not this check's concern
  }
  if (/^<{7} /m.test(text) || /^>{7} /m.test(text)) {
    err(rel, "contains git conflict markers — a rebase resolution was committed half-done");
  }
}

const read = (rel) => readFileSync(path.join(ROOT, rel), "utf8");

// ── MR-creation snippets carry the provenance label ──────────────────────────
// `glab api … /merge_requests --method POST` is the route create-pr takes
// whenever the description comes from a file, and `labels` is a plain field
// there (unlike the reviewer, which needs numeric ids). A snippet that omits it
// teaches the agent to ship MRs without the only provenance signal that
// survives a squash merge — the failure rules/git-flow.md exists to prevent.
for (const rel of tracked) {
  if (!/^(skills|commands)\/.*\.md$/.test(rel)) continue;
  // Fold shell line continuations so a multi-line snippet reads as one command.
  for (const line of read(rel).replace(/\\\n\s*/g, " ").split("\n")) {
    if (!line.includes("glab api")) continue;
    if (!/\/merge_requests"/.test(line) || !/--method\s+POST/.test(line)) continue;
    if (!line.includes("labels=ai:agent-authored")) {
      err(rel, 'glab MR-creation snippet omits --field "labels=ai:agent-authored"');
    }
  }
}

// Frontmatter keys whose value is a block map of indented `key: value` lines
// instead of a scalar. Every other key folds its indented lines into one string.
const MAP_KEYS = new Set(["metadata"]);

function parseFrontmatter(rel) {
  const text = read(rel);
  if (!text.startsWith("---\n")) return { fm: null, body: text };
  const end = text.indexOf("\n---\n", 4);
  if (end === -1) return { fm: null, body: text };
  const fm = {};
  let currentKey = null;
  for (const line of text.slice(4, end).split("\n")) {
    const kv = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (kv) {
      currentKey = kv[1];
      const value = kv[2].trim();
      fm[kv[1]] = MAP_KEYS.has(kv[1]) && value === "" ? {} : value;
    } else if (currentKey && /^\s+\S/.test(line)) {
      if (typeof fm[currentKey] === "object") {
        const entry = line.match(/^\s+([A-Za-z][\w-]*):\s*(.*)$/);
        if (entry) fm[currentKey][entry[1]] = entry[2].trim();
      } else {
        fm[currentKey] += ` ${line.trim()}`;
      }
    }
  }
  // `raw` keeps the source text for the strict-YAML check; `fm` holds what a
  // YAML parser hands a tool, so the length budget counts text, not quotes.
  return { fm: unquoteValues(fm), raw: fm, body: text.slice(end + 5) };
}

function unquoteValues(fm) {
  return Object.fromEntries(
    Object.entries(fm).map(([key, value]) => [
      key,
      typeof value === "string" ? unquoteScalar(value) : value,
    ]),
  );
}

/** The text of a quoted YAML scalar; any other value comes back unchanged. */
function unquoteScalar(value) {
  if (/^"(?:[^"\\]|\\.)*"$/.test(value)) {
    try {
      return JSON.parse(value);
    } catch {
      return value; // an escape JSON cannot read; frontmatterScalarProblem reports it
    }
  }
  if (/^'(?:[^']|'')*'$/.test(value)) return value.slice(1, -1).replaceAll("''", "'");
  return value;
}

/**
 * Why a strict YAML parser would reject or misread a top-level frontmatter
 * value, or null. Narrow on purpose (zero dependencies): quoted strings must
 * close, and a plain value may not start with an indicator or carry `: ` / ` #`.
 * Block (`|`, `>`) and flow (`[`, `{`) forms are valid YAML, but parseFrontmatter
 * folds them as plain text, so the checks that read the value would be wrong.
 */
function frontmatterScalarProblem(value) {
  if (value === "") return null; // a block map such as `metadata:`
  if (value.startsWith('"')) {
    if (!/^"(?:[^"\\]|\\.)*"$/.test(value)) {
      return 'double-quoted value is unclosed or has an unescaped " inside — escape it as \\"';
    }
    try {
      JSON.parse(value);
    } catch {
      return 'double-quoted value uses an escape this validator cannot read — keep to \\" and \\\\';
    }
    return null;
  }
  if (value.startsWith("'")) {
    return /^'(?:[^']|'')*'$/.test(value)
      ? null
      : "single-quoted value is unclosed or has a lone ' inside — double it as ''";
  }
  if (/^[-?:,[\]{}#&*!|>%@`]/.test(value)) {
    return `plain value starts with the YAML indicator '${value[0]}' — wrap it in double quotes`;
  }
  if (/:(\s|$)/.test(value)) {
    return "plain value contains ': ', which strict YAML reads as a nested mapping — wrap it in double quotes";
  }
  if (/\s#/.test(value)) {
    return "plain value contains ' #', which strict YAML reads as a comment and drops the rest — wrap it in double quotes";
  }
  return null;
}

// ── Skill frontmatter and naming ─────────────────────────────────────────────

const skillDirs = [
  ...new Set(
    [...tracked]
      .filter((f) => f.startsWith("skills/"))
      .map((f) => f.split("/")[1]),
  ),
].sort();

const KNOWN_KEYS = new Set([
  "name",
  "description",
  "license",
  "argument-hint",
  "allowed-tools",
  "model",
  "metadata",
]);
// Codex rejects descriptions longer than 1024 characters.
const DESCRIPTION_LIMIT = 1024;
const seenNames = new Map();

for (const dir of skillDirs) {
  const rel = `skills/${dir}/SKILL.md`;
  if (!tracked.has(rel)) {
    err(`skills/${dir}`, "skill directory has no tracked SKILL.md");
    continue;
  }

  const { fm, body } = parseFrontmatter(rel);
  if (!fm) {
    err(rel, "missing YAML frontmatter block (--- ... ---)");
    continue;
  }

  // Progressive-disclosure budget: the procedure belongs in SKILL.md, deep-dive
  // reference material in files inside the skill directory behind a
  // conditional pointer. Oversized bodies load whole into every invocation.
  const bodyLines = body.split("\n").length;
  if (bodyLines > 500) {
    warn(
      rel,
      `body is ${bodyLines} lines; keep SKILL.md under 500 — move deep-dive ` +
        `reference material to files in the skill directory (progressive disclosure)`,
    );
  }

  for (const key of Object.keys(fm)) {
    if (!KNOWN_KEYS.has(key)) warn(rel, `unknown frontmatter key '${key}'`);
  }

  const expectedName = dir;
  if (!fm.name) {
    err(rel, "frontmatter is missing 'name'");
  } else if (fm.name !== expectedName) {
    err(
      rel,
      `frontmatter name '${fm.name}' should match directory name '${expectedName}'`,
    );
  }

  if (fm.name) {
    const previous = seenNames.get(fm.name);
    if (previous) err(rel, `duplicate skill name '${fm.name}' (also in ${previous})`);
    seenNames.set(fm.name, rel);
  }

  if (!fm.description) {
    err(rel, "frontmatter is missing 'description' (tool routing depends on it)");
  } else {
    if (fm.description.length > DESCRIPTION_LIMIT) {
      err(
        rel,
        `description is ${fm.description.length} chars; ` +
          `keep it under ${DESCRIPTION_LIMIT} (Codex hard limit)`,
      );
    }
    // A routing cue is an invocation verb followed closely by a temporal or
    // conditional word, so "Use when the user asks", "Use it when", and
    // "Use right after generating X" all count.
    const ROUTING_CUE =
      /\b(use|gebruik)\b[^.]{0,30}?\b(when|whenever|if|after|before|during|zodra|wanneer)\b/i;
    if (!ROUTING_CUE.test(fm.description)) {
      warn(rel, "description has no 'Use when ...' routing cue");
    }
  }

  // `metadata` is the Agent Skills spec's string-to-string map; Claude Code and
  // Codex load the skill without acting on it.
  const owner = typeof fm.metadata === "object" ? fm.metadata.owner : undefined;
  if (!owner) {
    err(
      rel,
      "frontmatter has no 'metadata.owner' — add `metadata:` with an indented " +
        "`owner: <gitlab username>` line",
    );
  }
}

// ── Shipped frontmatter survives a strict YAML parser ────────────────────────
// Claude Code reads frontmatter leniently, so a plain value such as
// `description: … Read-only: never runs migrate …` loads there. A strict parser
// rejects it ("mapping values are not allowed here"), and other tools that read
// the same SKILL.md — Codex among them — may use one. Quote such values.

const SHIPPED_FRONTMATTER =
  /^(?:skills\/[^/]+\/SKILL|commands\/[^/]+|agents\/[^/]+|templates\/[^/]*SKILL[^/]*)\.md$/;

for (const rel of [...tracked].filter((f) => SHIPPED_FRONTMATTER.test(f))) {
  const { raw } = parseFrontmatter(rel);
  for (const [key, value] of Object.entries(raw ?? {})) {
    if (typeof value !== "string") continue;
    const problem = frontmatterScalarProblem(value);
    if (problem) err(rel, `frontmatter '${key}': ${problem}`);
  }
}

// ── Referenced repo paths inside skill bodies ────────────────────────────────

for (const dir of skillDirs) {
  const rel = `skills/${dir}/SKILL.md`;
  if (!tracked.has(rel)) continue;
  const { body } = parseFrontmatter(rel);
  for (const match of body.matchAll(
    /`((?:commands|skills|rules|shared)\/[^`\s]+\.(?:md|mdc|json))`/g,
  )) {
    if (/[<>*]/.test(match[1])) continue; // placeholder, not a concrete path
    if (!tracked.has(match[1])) {
      err(rel, `references \`${match[1]}\`, which is not a tracked file`);
    }
  }
}

// The ambient CLAUDE.md keeps short pointers to rules that moved into skill
// references; a pointer to a renamed file would drop the rule silently.
if (tracked.has("CLAUDE.md")) {
  for (const match of read("CLAUDE.md").matchAll(
    /`((?:commands|skills|rules|shared)\/[^`\s]+\.(?:md|mdc|json))`/g,
  )) {
    if (/[<>*]/.test(match[1])) continue;
    if (!tracked.has(match[1])) {
      err("CLAUDE.md", `points at \`${match[1]}\`, which is not a tracked file`);
    }
  }
}

// ── Shipped scripts are not run through a checkout-only path ─────────────────
// `~/Web/ai-workflows/` exists only for developers who cloned this repo; a
// plugin-only install has the scripts under the plugin cache instead. Naming the
// checkout as a place to edit is fine — running a script from it is not.

for (const rel of [...tracked].filter(
  (f) => /^(skills|commands|rules)\//.test(f) && f.endsWith(".md"),
)) {
  for (const match of read(rel).matchAll(
    /\b(?:node|bash|sh|python3)\s+["']?(?:~|\$HOME)\/Web\/ai-workflows\/scripts\/([\w.-]+)/g,
  )) {
    err(
      rel,
      `runs \`${match[1]}\` via ~/Web/ai-workflows/, which only a clone has — use \`<ai-workflows>/scripts/\` and resolve it from the skill's base directory first`,
    );
  }
}

// ── Skills do not hard-code the maintainer's checkout path ───────────────────
// A skill that reads from or edits the ai-workflows repo says `<ai-workflows>`
// and resolves it. Only these skills may name the default clone location, because
// each documents a lookup or a default for developers who cloned the repo.

const CHECKOUT_PATH_ALLOWLIST = new Set([
  "skills/improve-skill/SKILL.md",
  "skills/maintenance/SKILL.md",
  "skills/setup-ai-workflows/SKILL.md",
  "skills/start-project/SKILL.md",
  "skills/upstream-rules/SKILL.md",
]);

for (const rel of [...tracked].filter((f) => f.startsWith("skills/"))) {
  if (CHECKOUT_PATH_ALLOWLIST.has(rel)) continue;
  if (read(rel).includes("~/Web/ai-workflows")) {
    err(
      rel,
      "names `~/Web/ai-workflows`, a path only a clone has — say `<ai-workflows>` and resolve it (see skills/start-project); only the skills that document the default clone location may name it",
    );
  }
}

// ── Relative markdown links in canonical docs ────────────────────────────────

const linkScanFiles = [...tracked].filter(
  (f) =>
    f.endsWith(".md") &&
    /^(skills|commands|shared|docs)\//.test(f) &&
    !f.startsWith("docs/backlog/"),
);

for (const rel of linkScanFiles) {
  const text = read(rel);
  for (const match of text.matchAll(/\]\(([^)\s]+)\)/g)) {
    const target = match[1];
    if (/^(https?:|mailto:|#)/.test(target)) continue;
    const clean = target.split("#")[0];
    if (!clean) continue;
    if (clean.startsWith("/")) {
      // Absolute local paths only work on the author's machine.
      err(rel, `absolute local path in link: (${target}) — make it repo-relative`);
      continue;
    }
    if (!existsSync(path.resolve(ROOT, path.dirname(rel), clean))) {
      err(rel, `broken relative link: (${target})`);
    }
  }
}

// ── Routing registries are accurate and complete ──────────────────────────────
// Every trigger phrase a tool can route on lives in one of these two fragments.
// A target that does not exist is a dead route; a workflow that appears in
// neither cannot be reached by intent at all.

const COMMAND_MAPPINGS = "shared/command-mappings.md";
const SKILL_MAPPINGS = "shared/skill-mappings.md";

// Collect the routing targets on the right-hand side of each mapping line, so a
// fallback named alongside the canonical target counts as routed too. Everything
// after the first `;` is a prose note — a path mentioned there is a
// cross-reference, not a route, and must not count as coverage.
function mappedTargets(rel) {
  const targets = new Set();
  if (!tracked.has(rel)) return targets;
  for (const line of read(rel).split("\n")) {
    const arrow = line.indexOf("->");
    if (arrow === -1) continue;
    const routed = line.slice(arrow).split(";")[0];
    for (const match of routed.matchAll(/`((?:skills|commands)\/[^`\s]+)`/g)) {
      targets.add(match[1].replace(/\/$/, ""));
    }
  }
  return targets;
}

if (!tracked.has(COMMAND_MAPPINGS)) {
  warn(COMMAND_MAPPINGS, "file not found; command-routing check skipped");
}
if (!tracked.has(SKILL_MAPPINGS)) {
  warn(SKILL_MAPPINGS, "file not found; skill-routing check skipped");
}

const commandRoutes = mappedTargets(COMMAND_MAPPINGS);
const skillRoutes = mappedTargets(SKILL_MAPPINGS);

for (const [rel, routes] of [
  [COMMAND_MAPPINGS, commandRoutes],
  [SKILL_MAPPINGS, skillRoutes],
]) {
  for (const target of routes) {
    const isSkillDir = target.startsWith("skills/");
    const exists = isSkillDir ? tracked.has(`${target}/SKILL.md`) : tracked.has(target);
    if (!exists) {
      err(rel, `routes to \`${target}\`, which is not a tracked workflow`);
    }
  }
}

if (tracked.has(COMMAND_MAPPINGS)) {
  for (const rel of [...tracked].filter(
    (f) => f.startsWith("commands/") && f.endsWith(".md"),
  )) {
    if (!commandRoutes.has(rel)) {
      err(
        COMMAND_MAPPINGS,
        `command \`${rel}\` has no trigger phrases; nothing can route to it`,
      );
    }
  }
}

if (tracked.has(SKILL_MAPPINGS)) {
  for (const dir of skillDirs) {
    if (tracked.has(`skills/${dir}/SKILL.md`) && !skillRoutes.has(`skills/${dir}`)) {
      err(
        SKILL_MAPPINGS,
        `skill \`skills/${dir}\` has no trigger phrases; nothing can route to it`,
      );
    }
  }
}

// ── CLAUDE.md routes only the commands no skill row covers ───────────────────
// CLAUDE.md loads in every session, and a skill row that names
// `commands/<x>.md` as its fallback already routes that runbook. So CLAUDE.md
// carries only the uncovered command rows, verbatim, and a covering skill row
// must hold every trigger of the command row it replaces there. AGENTS.md and
// the Copilot adapter keep the full command block.

function mappingRows(rel) {
  if (!tracked.has(rel)) return [];
  return read(rel)
    .split("\n")
    .filter((line) => line.startsWith("- ") && line.includes("->"))
    .map((line) => {
      const arrow = line.indexOf("->");
      const triggers = [...line.slice(0, arrow).matchAll(/`([^`]+)`/g)].map((m) => m[1]);
      const routed = line.slice(arrow).split(";")[0];
      const commands = [...routed.matchAll(/`(commands\/[^`\s]+\.md)`/g)].map((m) => m[1]);
      return { line, triggers, commands };
    });
}

if (tracked.has(COMMAND_MAPPINGS) && tracked.has(SKILL_MAPPINGS) && tracked.has("CLAUDE.md")) {
  const skillRows = mappingRows(SKILL_MAPPINGS);
  const ambientLines = read("CLAUDE.md").split("\n");

  for (const { line, triggers, commands } of mappingRows(COMMAND_MAPPINGS)) {
    const command = commands[0];
    if (!command) continue;
    const covering = skillRows.filter((row) => row.commands.includes(command));

    if (covering.length === 0) {
      if (!ambientLines.includes(line)) {
        err(
          "CLAUDE.md",
          `must route \`${command}\` (no skill row covers it) with its line from ` +
            `${COMMAND_MAPPINGS}, verbatim: ${line}`,
        );
      }
      continue;
    }

    const skillTriggers = new Set(covering.flatMap((row) => row.triggers));
    for (const trigger of triggers.filter((t) => !skillTriggers.has(t))) {
      err(
        SKILL_MAPPINGS,
        `the skill row for \`${command}\` lacks \`${trigger}\` from its command row; ` +
          "CLAUDE.md routes that runbook through the skill row only",
      );
    }
    if (ambientLines.some((l) => l.startsWith("- ") && l.includes(`-> \`${command}\``))) {
      err(
        "CLAUDE.md",
        `routes \`${command}\` in a command row, but a skill row already covers it`,
      );
    }
  }
}

// ── Adapters compose the shared fragments instead of copying them ─────────────
// A hand-maintained copy of a shared list drifts silently — that is how
// AGENTS.md ended up routing fewer commands than the fragment it duplicated.

const REQUIRED_MARKERS = {
  "CLAUDE.md": ["skill-mappings", "safety", "graphify"],
  "AGENTS.md": ["command-mappings", "skill-mappings", "safety", "graphify"],
  ".github/copilot-instructions.md": ["core-rules", "command-mappings", "safety"],
  "templates/project-CLAUDE.md": ["command-mappings", "safety", "graphify", "workflow-assets"],
  "templates/project-AGENTS.md": ["command-mappings", "safety", "graphify", "workflow-assets"],
  "templates/project-copilot-instructions.md": [
    "core-rules",
    "command-mappings",
    "safety",
    "graphify",
    "workflow-assets",
  ],
};

for (const [rel, markers] of Object.entries(REQUIRED_MARKERS)) {
  if (!tracked.has(rel)) {
    err(rel, "adapter file is missing");
    continue;
  }
  const text = read(rel);
  for (const marker of markers) {
    if (!tracked.has(`shared/${marker}.md`)) {
      err(rel, `expects shared fragment \`shared/${marker}.md\`, which does not exist`);
      continue;
    }
    if (!text.includes(`<!-- BEGIN SHARED:${marker} -->`)) {
      err(
        rel,
        `is missing the \`${marker}\` marker; inject the shared fragment instead ` +
          "of maintaining a copy",
      );
    }
  }
}

// ── The upstream-MR rule stays out of the ambient layer ──────────────────────
// Root CLAUDE.md is synced to ~/.claude/rules/ai-workflows.md and loads in every session of
// every project; the project templates become adapters that load in every
// session of a synced project. The rule only matters while an upstream skill
// runs, so it loads from these copies instead: Codex in this repo, Claude in
// this repo, and the upstream skills anywhere.

const UPSTREAM_MR_COPIES = [
  "AGENTS.md",
  ".claude/rules/upstream-mr.md",
  "skills/upstream-rules/references/upstream-mr.md",
];
const UPSTREAM_MR_AMBIENT = [
  "CLAUDE.md",
  "templates/project-CLAUDE.md",
  "templates/project-AGENTS.md",
  "templates/project-ai-workflows.md",
  "templates/project-copilot-instructions.md",
];
const UPSTREAM_MR_MARKER = "<!-- BEGIN SHARED:upstream-mr -->";

for (const rel of UPSTREAM_MR_COPIES) {
  if (!tracked.has(rel) || !read(rel).includes(UPSTREAM_MR_MARKER)) {
    err(
      rel,
      "must carry the `upstream-mr` fragment; CLAUDE.md and the project " +
        "templates no longer do",
    );
  }
}
for (const rel of UPSTREAM_MR_AMBIENT) {
  if (tracked.has(rel) && read(rel).includes(UPSTREAM_MR_MARKER)) {
    err(
      rel,
      "carries the `upstream-mr` fragment, which then loads in every session; " +
        `it belongs in ${UPSTREAM_MR_COPIES.join(", ")}`,
    );
  }
}

// ── Canonical-sources inventory is accurate and complete ─────────────────────

const CANONICAL = "docs/workflow-canonical-sources.md";
const inventoried = new Set();

if (tracked.has(CANONICAL)) {
  for (const line of read(CANONICAL).split("\n")) {
    if (!line.startsWith("| `")) continue;
    const cells = line.split("|").map((cell) => cell.trim());
    // cells: [ '', workflow, surfaces, canonical, fallback, normalized, '' ]
    for (const cell of [cells[3], cells[4]]) {
      const pathMatch = cell?.match(/`([^`]+)`/);
      if (!pathMatch) continue;
      inventoried.add(pathMatch[1]);
      if (!tracked.has(pathMatch[1])) {
        err(CANONICAL, `inventory lists \`${pathMatch[1]}\`, which is not a tracked file`);
      }
    }
  }

  for (const dir of skillDirs) {
    const rel = `skills/${dir}/SKILL.md`;
    if (tracked.has(rel) && !inventoried.has(rel)) {
      warn(CANONICAL, `skill \`${rel}\` is missing from the inventory table`);
    }
  }
  for (const rel of [...tracked].filter(
    (f) => f.startsWith("commands/") && f.endsWith(".md"),
  )) {
    if (!inventoried.has(rel)) {
      warn(CANONICAL, `command \`${rel}\` is missing from the inventory table`);
    }
  }
} else {
  warn(CANONICAL, "file not found; canonical-sources check skipped");
}

// ── Feature reference stays in sync with the tree ───────────────────────────

const FEATURES = "FEATURES.md";

if (tracked.has(FEATURES)) {
  const features = read(FEATURES);

  // Repo paths named in FEATURES.md must be tracked files, or directories
  // that contain tracked files (same rule as the canonical-sources check).
  const featureDirs = new Set();
  for (const file of tracked) {
    const parts = file.split("/");
    for (let i = 1; i < parts.length; i += 1) {
      featureDirs.add(parts.slice(0, i).join("/"));
    }
  }
  for (const match of features.matchAll(
    /`((?:skills|commands|rules|shared|scripts|templates|mcp|packages)\/[^`\s]*)`/g,
  )) {
    if (/[<>*]/.test(match[1])) continue; // placeholder, not a concrete path
    const target = match[1].replace(/\/$/, "");
    if (!tracked.has(target) && !featureDirs.has(target)) {
      err(FEATURES, `lists \`${match[1]}\`, which is not a tracked path`);
    }
  }

  // Coverage: every skill, command, rule, and MCP server appears in a table.
  for (const dir of skillDirs) {
    if (tracked.has(`skills/${dir}/SKILL.md`) && !features.includes(`\`${dir}\``)) {
      warn(FEATURES, `skill \`${dir}\` is missing from the skills table`);
    }
  }
  for (const rel of [...tracked].filter(
    (f) => f.startsWith("commands/") && f.endsWith(".md"),
  )) {
    if (!features.includes(`\`${rel}\``)) {
      warn(FEATURES, `command \`${rel}\` is missing from the commands table`);
    }
  }
  for (const rel of [...tracked].filter(
    (f) => f.startsWith("rules/") && f.endsWith(".md"),
  )) {
    if (!features.includes(`\`${rel}\``)) {
      warn(FEATURES, `rule \`${rel}\` is missing from the rules table`);
    }
  }
  if (tracked.has("mcp/servers.json")) {
    let servers = {};
    try {
      servers = JSON.parse(read("mcp/servers.json")).mcpServers ?? {};
    } catch {
      // servers.json validity is not this block's concern
    }
    for (const server of Object.keys(servers)) {
      if (!features.includes(`\`${server}\``)) {
        warn(FEATURES, `MCP server \`${server}\` is missing from the MCP table`);
      }
    }
  }
} else {
  warn(FEATURES, "file not found; feature-reference check skipped");
}

// ── Pipeline map places every surface in the process ──────────────────────────

const PIPELINE = "docs/pipeline-map.md";

if (tracked.has(PIPELINE)) {
  const pipeline = read(PIPELINE);

  // Directories are never in `tracked` (it lists files), so derive the set of
  // directories that contain tracked files.
  const trackedDirs = new Set();
  for (const file of tracked) {
    const parts = file.split("/");
    for (let i = 1; i < parts.length; i += 1) {
      trackedDirs.add(parts.slice(0, i).join("/"));
    }
  }

  const mentioned = new Set();

  for (const match of pipeline.matchAll(
    /`((?:skills|commands|rules|shared|scripts|templates|mcp|packages|docs)\/[^`\s]+)`/g,
  )) {
    if (/[<>*]/.test(match[1])) continue; // placeholder, not a concrete path
    const target = match[1].replace(/\/$/, "");
    mentioned.add(target);
    // Existence, not trackedness, is the error: a map that documents an
    // in-flight surface is fine, a map that points at nothing is a typo.
    if (!existsSync(path.join(ROOT, target))) {
      err(PIPELINE, `names \`${match[1]}\`, which does not exist`);
    } else if (!tracked.has(target) && !trackedDirs.has(target)) {
      warn(PIPELINE, `names \`${match[1]}\`, which exists but is untracked`);
    }
  }

  // Match on whole path segments, so `skills/foo-bar` never counts as coverage
  // for `skills/foo`.
  const placed = (rel) =>
    mentioned.has(rel) || [...mentioned].some((m) => m.startsWith(`${rel}/`));

  for (const dir of skillDirs) {
    if (tracked.has(`skills/${dir}/SKILL.md`) && !placed(`skills/${dir}`)) {
      warn(PIPELINE, `skill \`skills/${dir}\` is not placed in any phase`);
    }
  }
  for (const rel of [...tracked].filter(
    (f) =>
      (f.startsWith("commands/") || f.startsWith("rules/")) && f.endsWith(".md"),
  )) {
    if (!placed(rel)) {
      warn(PIPELINE, `\`${rel}\` is not placed in any phase`);
    }
  }
} else {
  warn(PIPELINE, "file not found; pipeline-map check skipped");
}

// ── The riskiest skills keep regression cases ────────────────────────────────
// A description edit that stops matching natural phrasing is the commonest
// skill regression, and only a routing case in evals/<skill>/ catches it. These
// skills drive delivery end to end, so losing their cases is flagged.

const RISKY_SKILLS = [
  "code-review",
  "create-pr",
  "refinement",
  "start-project",
  "work-backlog",
];

for (const dir of RISKY_SKILLS) {
  if (!tracked.has(`skills/${dir}/SKILL.md`)) continue;
  if (![...tracked].some((f) => f.startsWith(`evals/${dir}/`))) {
    warn(
      `skills/${dir}`,
      `is in the risky set but has no evals/${dir}/ cases — add a routing ` +
        "case (see evals/README.md)",
    );
  }
}

// ── Plugin manifest is versioned and the changelog matches ──────────────────

const PLUGIN = ".claude-plugin/plugin.json";
const CHANGELOG = "CHANGELOG.md";

/** Numeric semver compare; both inputs are already `\d+\.\d+\.\d+`. */
function compareSemver(a, b) {
  const left = a.split(".").map(Number);
  const right = b.split(".").map(Number);

  for (let index = 0; index < 3; index += 1) {
    if (left[index] !== right[index]) {
      return left[index] - right[index];
    }
  }

  return 0;
}

if (tracked.has(PLUGIN)) {
  let manifest = null;
  try {
    manifest = JSON.parse(read(PLUGIN));
  } catch {
    err(PLUGIN, "is not valid JSON");
  }

  if (manifest) {
    if (!manifest.version) {
      err(
        PLUGIN,
        "is missing 'version' — without it every commit to main ships as an unversioned plugin release",
      );
    } else if (!/^\d+\.\d+\.\d+$/.test(manifest.version)) {
      err(
        PLUGIN,
        `version '${manifest.version}' is not plain semver (MAJOR.MINOR.PATCH)`,
      );
    } else if (!tracked.has(CHANGELOG)) {
      err(CHANGELOG, "is missing — every plugin version needs a changelog entry");
    } else {
      const changelog = read(CHANGELOG);

      // Match headings at line start only. A plain substring test is satisfied
      // by prose mentioning `## [1.2.3]` or `## [Unreleased]` in backticks —
      // which this very changelog does, so the check would never fire.
      const hasHeading = (label) =>
        new RegExp(`^## \\[${label.replace(/[.[\]]/g, "\\$&")}\\]`, "m").test(
          changelog,
        );

      if (!hasHeading(manifest.version)) {
        err(
          CHANGELOG,
          `has no entry for plugin version ${manifest.version} — run ` +
            `'node scripts/assign-plugin-version.mjs --write' to cut the release`,
        );
      }

      // The landing zone content MRs add their entries to. Without it they
      // would have to invent a version heading, which is what made two MRs
      // collide on the same number and the same changelog lines.
      if (!hasHeading("Unreleased")) {
        err(
          CHANGELOG,
          "has no '## [Unreleased]' section — content MRs need it to add " +
            "entries to; the version is assigned after merge",
        );
      }

      // A heading above the manifest version means a release was written by
      // hand and the manifest never followed, so `/plugin` still serves the
      // older, version-keyed install path.
      const ahead = [...changelog.matchAll(/^## \[(\d+\.\d+\.\d+)\]/gm)]
        .map((match) => match[1])
        .filter((version) => compareSemver(version, manifest.version) > 0);

      if (ahead.length > 0) {
        err(
          CHANGELOG,
          `documents ${ahead.join(", ")} but plugin.json is still on ` +
            `${manifest.version} — the install path is version-keyed, so that ` +
            `release is invisible in /plugin`,
        );
      }
    }
  }
} else {
  warn(PLUGIN, "file not found; plugin version check skipped");
}

// ── Changelog fragments are well-formed ──────────────────────────────────────
// One file per MR under changelog.d/ (see scripts/changelog-fragments.mjs); the
// release assembles them. A misnamed file would be skipped silently at release
// time, so the name and the leading bullet are checked here, on tracked files.

const FRAGMENT_DIR = "changelog.d/";
for (const rel of tracked) {
  if (!rel.startsWith(FRAGMENT_DIR)) continue;
  const name = rel.slice(FRAGMENT_DIR.length);
  if (name.startsWith(".")) continue;
  if (!FRAGMENT_FILE.test(name)) {
    err(rel, `changelog fragment: ${FRAGMENT_HINT}`);
    continue;
  }
  if (!read(rel).trim().startsWith("- ")) {
    err(rel, `changelog fragment has no leading bullet: ${FRAGMENT_HINT}`);
  }
  // The Slack announcement reads a note only as a continuation line of its
  // bullet; anywhere else it is silently dropped from the post.
  for (const [index, line] of read(rel).split("\n").entries()) {
    if (!/^\s*<!-- ?slack:/.test(line)) continue;
    const note = /^ {2,}<!-- ?slack: ?(.+?) ?-->$/.exec(line);
    if (!note) {
      err(rel, `line ${index + 1}: put a slack note on its own line under its bullet: '  <!-- slack: <one-liner> -->'`);
    } else if (note[1].length > 120) {
      warn(rel, `line ${index + 1}: slack note is ${note[1].length} chars; keep the table row under 120`);
    }
  }
}

// ── Tests that create a git repo drop the hook's GIT_* variables ─────────────
// The pre-commit hook runs the test scripts with GIT_DIR, GIT_WORK_TREE and
// GIT_INDEX_FILE exported; a fixture's `git init` inherits them and acts on this
// repository instead of its temp directory (one run set core.bare=true in the
// shared config). See skills/create-pr/references/worktrees.md.

const STRIPS_GIT_ENV = /startsWith\(\s*["']GIT_["']\s*\)|unset GIT_DIR|env -u GIT_DIR/;
for (const rel of tracked) {
  if (!rel.startsWith("scripts/") || !/test/i.test(rel)) continue;
  const text = read(rel);
  const initsRepo = /\bgit init\b/.test(text) || (/["']init["']/.test(text) && /["']git["']/.test(text));
  if (initsRepo && !STRIPS_GIT_ENV.test(text)) {
    err(
      rel,
      "creates a git repo without dropping GIT_DIR/GIT_WORK_TREE/GIT_INDEX_FILE first; " +
        "under the pre-commit hook its git calls act on this repository " +
        "(skills/create-pr/references/worktrees.md)",
    );
  }
}

// ── "Enforced by nothing" ratchet ────────────────────────────────────────────
// docs/pipeline-map.md honestly marks policies that no hook, validator, or CI
// job backs. That honesty only works while the pile stays bounded: a new
// unenforced policy either ships its enforcement or raises this budget in the
// same MR, carrying a tracked follow-up for the enforcement it still owes.

const PIPELINE_MAP = "docs/pipeline-map.md";
const ENFORCED_BY_NOTHING_BUDGET = 0;
if (tracked.has(PIPELINE_MAP)) {
  // Match the row marker "— enforced by nothing" only, so prose *about* the
  // budget (like the paragraph introducing it) does not count against it.
  const unenforced = [...read(PIPELINE_MAP).matchAll(/— enforced by nothing/gi)]
    .length;
  if (unenforced > ENFORCED_BY_NOTHING_BUDGET) {
    err(
      PIPELINE_MAP,
      `${unenforced} policies are marked "enforced by nothing" (budget: ${ENFORCED_BY_NOTHING_BUDGET}) — ship the enforcement (hook, validator check, CI job) or raise ENFORCED_BY_NOTHING_BUDGET in the same MR with a tracked follow-up`,
    );
  } else if (unenforced < ENFORCED_BY_NOTHING_BUDGET) {
    warn(
      PIPELINE_MAP,
      `only ${unenforced} "enforced by nothing" policies remain — lower ENFORCED_BY_NOTHING_BUDGET to ${unenforced} to lock in the progress`,
    );
  }
}

// ── Report ───────────────────────────────────────────────────────────────────

if (warnings.length > 0) {
  console.log(`Warnings (${warnings.length}):`);
  for (const w of warnings) console.log(`  ~ ${w}`);
  console.log("");
}

if (errors.length > 0) {
  console.error(`Errors (${errors.length}):`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}

console.log(
  `OK: ${skillDirs.length} skills validated, ` +
    `${linkScanFiles.length} docs link-checked, no errors.`,
);
