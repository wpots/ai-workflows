#!/usr/bin/env node
// Reports which checks a project's CI runs, so run-checks can run the same
// list locally. Reads .gitlab-ci.yml line by line in the include forms
// ci-components documents, and falls back to "approximate" with a note on
// anything else. Never runs a job, pulls an image or executes a CI script.
//
// Usage: node ci-parity.mjs [project-dir]   (prints a JSON report)
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// The `scripts` default of templates/node-npm.yml and templates/node-pnpm.yml
// in greenberrynl/config/ci-components (4.0.0-rc.1).
export const VERIFY_DEFAULT_SCRIPTS = ["lint:check", "type-check", "test"];

const RESERVED_TOP_LEVEL = new Set([
  "after_script",
  "before_script",
  "cache",
  "default",
  "image",
  "include",
  "services",
  "spec",
  "stages",
  "variables",
  "workflow",
]);

const COMPONENT = /^\s*(?:- )?component:\s*["']?\S*\/ci-components\/(node-npm|node-pnpm)@([^\s"'#]+)/;
const CONFIG_CI = /^\s*(?:- )?project:\s*["']?greenberrynl\/config\/ci["']?\s*(?:#.*)?$/;
const REF = /^\s*(?:- )?ref:\s*["']?([^\s"'#]+)/;
const LOCAL = /^\s*(?:- )?local:\s*["']?([^\s"'#]+)/;

const readIfExists = (file) => (existsSync(file) ? readFileSync(file, "utf8") : null);
const indentOf = (line) => line.length - line.trimStart().length;
const isBlank = (line) => line.trim() === "" || line.trimStart().startsWith("#");
const isEntry = (trimmed) => trimmed.startsWith("- ");

const stripComment = (value) => {
  const at = value.search(/\s#/);
  return (at === -1 ? value : value.slice(0, at)).trim();
};

const unquote = (value) => {
  const bare = stripComment(value);
  const quoted = bare.length > 1 && (bare.startsWith('"') || bare.startsWith("'"));
  return quoted && bare.endsWith(bare[0]) ? bare.slice(1, -1) : bare;
};

// The list items of the top-level `include:` block, each as its own lines.
function includeItems(lines) {
  const start = lines.findIndex((line) => line.startsWith("include:"));
  if (start === -1) return [];
  const inline = stripComment(lines[start].slice("include:".length));
  if (inline) return [[`- local: ${inline}`]];
  const items = [];
  let itemIndent = null;
  for (const line of lines.slice(start + 1).filter((candidate) => !isBlank(candidate))) {
    if (indentOf(line) === 0) break;
    if (isEntry(line.trimStart()) && (itemIndent === null || indentOf(line) === itemIndent)) {
      itemIndent = indentOf(line);
      items.push([line]);
    } else {
      items.at(-1)?.push(line);
    }
  }
  return items;
}

function readBlockList(itemLines, index) {
  const keyIndent = indentOf(itemLines[index]);
  const values = [];
  for (const line of itemLines.slice(index + 1).filter((candidate) => !isBlank(candidate))) {
    const trimmed = line.trimStart();
    if (indentOf(line) < keyIndent || (indentOf(line) === keyIndent && !isEntry(trimmed))) break;
    if (!isEntry(trimmed)) return { raw: trimmed };
    values.push(unquote(trimmed.slice(2)));
  }
  return { values };
}

const splitFlow = (flow) => {
  const inner = flow.slice(1, -1).trim();
  return inner === "" ? [] : inner.split(",").map(unquote);
};

// The values of `key:` inside one include item, as a flow or block list.
// Returns { values } or { raw } when the value is not a plain list of names.
function readList(itemLines, key) {
  const keyPattern = new RegExp(String.raw`^\s*(?:- )?${key}:`);
  const index = itemLines.findIndex((line) => keyPattern.test(line));
  if (index === -1) return null;
  const line = itemLines[index];
  const rest = stripComment(line.slice(line.indexOf(`${key}:`) + key.length + 1));
  let list;
  if (rest === "") list = readBlockList(itemLines, index);
  else if (rest.startsWith("[") && rest.endsWith("]")) list = { values: splitFlow(rest) };
  else return { raw: rest };
  if (list.raw !== undefined) return list;
  const unreadable = list.values.find((value) => value === "" || value.includes("$"));
  return unreadable === undefined ? list : { raw: rest || unreadable };
}

function topLevelJobName(line) {
  const name = unquote(line.slice(0, line.indexOf(":")));
  const isJob = line.includes(":") && name !== "" && !name.startsWith(".");
  return isJob && !RESERVED_TOP_LEVEL.has(name) ? name : null;
}

const scriptEntry = (trimmed) => {
  const command = unquote(trimmed.slice(2));
  return /^[|>][+-]?$/.test(command) ? "(multi-line command)" : command;
};

// Folds one indented line into the job it belongs to: its `script:` entries
// and its `extends:`.
function readJobLine(job, line) {
  const indent = indentOf(line);
  const trimmed = line.trimStart();
  const inScript =
    job.scriptIndent !== null &&
    (indent > job.scriptIndent || (indent === job.scriptIndent && isEntry(trimmed)));
  if (inScript) {
    if (isEntry(trimmed)) job.script.push(scriptEntry(trimmed));
    return;
  }
  job.scriptIndent = null;
  job.childIndent ??= indent;
  if (indent !== job.childIndent) return;
  const key = /^([\w-]+):(.*)$/.exec(trimmed);
  if (key?.[1] === "script") {
    if (stripComment(key[2])) job.script.push(unquote(key[2]));
    else job.scriptIndent = indent;
  } else if (key?.[1] === "extends") {
    job.extends = unquote(key[2]);
  }
}

// Top-level jobs the file defines itself, with their `script:` lines.
function projectJobs(lines) {
  const jobs = [];
  let job = null;
  for (const line of lines.filter((candidate) => !isBlank(candidate) && !candidate.startsWith("---"))) {
    if (indentOf(line) > 0) {
      if (job) readJobLine(job, line);
      continue;
    }
    const name = topLevelJobName(line);
    job = name ? { name, script: [], extends: null, childIndent: null, scriptIndent: null } : null;
    if (job) jobs.push(job);
  }
  return jobs.map(({ name, script, extends: parent }) => ({ name, script, extends: parent }));
}

// Script names a Husky hook runs with `<pm> run <name>` or `<pm> test`.
function hookScripts(text) {
  const names = [];
  for (const [, verb, args] of text.matchAll(/\b(?:npm|pnpm) +(run-script|run|test)\b([^\n&|;]*)/g)) {
    const name = verb === "test" ? "test" : args.trim().split(/\s+/).find((token) => !token.startsWith("-"));
    if (name) names.push(name);
  }
  return names;
}

function definedScripts(packageText, notes) {
  if (packageText === null) return [];
  try {
    const parsed = JSON.parse(packageText);
    const scripts = parsed !== null && typeof parsed === "object" ? parsed.scripts : null;
    return scripts !== null && typeof scripts === "object" ? Object.keys(scripts) : [];
  } catch {
    notes.push("package.json is not valid JSON, so its scripts could not be checked");
    return [];
  }
}

function lockfileManager(dir) {
  if (existsSync(path.join(dir, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(path.join(dir, "package-lock.json"))) return "npm";
  return null;
}

// Fills the report for a project that includes node-npm or node-pnpm.
function readComponent(report, dir, nodeItems) {
  const [, component, version] = nodeItems[0].map((line) => COMPONENT.exec(line)).find(Boolean);
  if (nodeItems.length > 1) {
    report.notes.push(`more than one node component include; read the first, ${component}`);
  }
  const input = readList(nodeItems[0], "scripts");
  if (input?.raw !== undefined) {
    report.parityLine = `CI parity: approximate (the scripts input of ${component} is not a plain list: ${input.raw})`;
    return;
  }
  const manager = component === "node-pnpm" ? "pnpm" : "npm";
  if (report.packageManager !== null && report.packageManager !== manager) {
    report.notes.push(`the lockfile says ${report.packageManager}, while ${component} runs ${manager}`);
  }
  const scripts = input?.values ?? VERIFY_DEFAULT_SCRIPTS;
  const defined = definedScripts(readIfExists(path.join(dir, "package.json")), report.notes);
  const prePush = readIfExists(path.join(dir, ".husky", "pre-push"));
  const hook = prePush === null ? null : hookScripts(prePush);
  Object.assign(report, {
    parity: "exact",
    parityLine: `CI parity: exact (ci-components ${version})`,
    packageManager: manager,
    component,
    scripts,
    scriptsSource: input ? "input" : "default",
    missingScripts: scripts.filter((name) => !defined.includes(name)),
    prePushDrift: hook && {
      onlyInCi: scripts.filter((name) => !hook.includes(name)),
      onlyInPrePush: hook.filter((name) => !scripts.includes(name)),
    },
  });
}

export function analyze(dir) {
  const report = {
    parity: "none",
    parityLine: "CI parity: no CI config found",
    packageManager: lockfileManager(dir),
    component: null,
    scripts: null,
    scriptsSource: null,
    missingScripts: [],
    prePushDrift: null,
    projectJobs: [],
    notes: [],
  };
  const ci = readIfExists(path.join(dir, ".gitlab-ci.yml"));
  if (ci === null) return report;

  const lines = ci.split("\n");
  const items = includeItems(lines);
  report.parity = "approximate";
  report.parityLine = "CI parity: approximate (no ci-components or config/ci include)";
  report.projectJobs = projectJobs(lines);

  const nodeItems = items.filter((item) => item.some((line) => COMPONENT.test(line)));
  if (nodeItems.length > 0) {
    readComponent(report, dir, nodeItems);
    return report;
  }
  const configItem = items.find((item) => item.some((line) => CONFIG_CI.test(line)));
  const localFiles = items.flatMap((item) => item.map((line) => LOCAL.exec(line)?.[1]).filter(Boolean));
  if (configItem) {
    const ref = configItem.map((line) => REF.exec(line)?.[1]).find(Boolean);
    report.parityLine = `CI parity: approximate (config/ci ${ref ?? "default branch"})`;
  } else if (localFiles.length > 0) {
    report.parityLine = `CI parity: approximate (local include not read: ${localFiles.join(", ")})`;
  }
  return report;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(analyze(path.resolve(process.argv[2] ?? ".")), null, 2));
}
