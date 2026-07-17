#!/usr/bin/env node
// Static validation for ai-workflows skills, commands, and cross-surface
// consistency. Zero dependencies; requires Node 18+ and git.
//
// Errors (exit 1): broken frontmatter, name/directory mismatch, duplicate
// names, references to files that don't exist, broken relative links,
// command-mapping targets that don't exist, canonical-sources rows pointing
// at missing files.
//
// Warnings (exit 0): skills/commands missing from the canonical-sources
// inventory, descriptions without a routing cue, unknown frontmatter keys.

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

  const expectedName = dir.replace(/^experimental\./, "");
  if (!fm.name) {
    err(rel, "frontmatter is missing 'name'");
  } else if (fm.name !== expectedName) {
    err(
      rel,
      `frontmatter name '${fm.name}' should be '${expectedName}' ` +
        "(directory name with the experimental. prefix stripped)",
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
    if (!/use (this skill )?when|use it when|gebruik/i.test(fm.description)) {
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

// ── Command mappings point at real files ─────────────────────────────────────

const MAPPINGS = "shared/command-mappings.md";
if (tracked.has(MAPPINGS)) {
  for (const match of read(MAPPINGS).matchAll(/->\s*`([^`]+)`/g)) {
    if (!tracked.has(match[1])) {
      err(MAPPINGS, `maps to \`${match[1]}\`, which is not a tracked file`);
    }
  }
} else {
  warn(MAPPINGS, "file not found; command-mapping check skipped");
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
