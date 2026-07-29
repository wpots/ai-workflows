#!/usr/bin/env node
// Static validation for ai-workflows skills, commands, and cross-surface
// consistency. Zero dependencies; requires Node 18+ and git.
//
// Errors (exit 1): broken frontmatter, name/directory mismatch, duplicate
// names, references to files that don't exist, broken relative links,
// mapping targets that don't exist, a skill or command missing from its routing
// registry, an adapter missing a shared marker, canonical-sources rows pointing
// at missing files, pipeline-map paths that don't exist, FEATURES.md rows
// naming untracked paths.
//
// Warnings (exit 0): skills/commands missing from the canonical-sources
// inventory, skills/commands/rules not placed in the pipeline map, pipeline-map
// paths that exist but are untracked, skills/commands/rules/MCP servers missing
// from the FEATURES.md inventories, descriptions without a routing cue,
// unknown frontmatter keys.
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

const read = (rel) => readFileSync(path.join(ROOT, rel), "utf8");

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
      fm[kv[1]] = kv[2].trim();
    } else if (currentKey && /^\s+\S/.test(line)) {
      fm[currentKey] += ` ${line.trim()}`;
    }
  }
  return { fm, body: text.slice(end + 5) };
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

  const { fm } = parseFrontmatter(rel);
  if (!fm) {
    err(rel, "missing YAML frontmatter block (--- ... ---)");
    continue;
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

// ── Adapters compose the shared fragments instead of copying them ─────────────
// A hand-maintained copy of a shared list drifts silently — that is how
// AGENTS.md ended up routing fewer commands than the fragment it duplicated.

const REQUIRED_MARKERS = {
  "CLAUDE.md": ["command-mappings", "skill-mappings", "safety", "graphify"],
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

// ── Plugin manifest is versioned and the changelog matches ──────────────────

const PLUGIN = ".claude-plugin/plugin.json";
const CHANGELOG = "CHANGELOG.md";

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
    } else if (!read(CHANGELOG).includes(`## [${manifest.version}]`)) {
      err(
        CHANGELOG,
        `has no entry for plugin version ${manifest.version} — add ` +
          `'## [${manifest.version}] - YYYY-MM-DD' in the same MR as the bump`,
      );
    }
  }
} else {
  warn(PLUGIN, "file not found; plugin version check skipped");
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
