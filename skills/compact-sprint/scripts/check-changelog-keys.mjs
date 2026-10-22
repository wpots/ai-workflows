#!/usr/bin/env node
// Checks that a compact sprint changelog still carries every ticket the
// original had in a table row, so the Phase 3 rewrite loses no delivered item.
// A key counts as present only as a whole token: RFW-29 is not found in a file
// that only names RFW-291.
//
// Usage: node check-changelog-keys.mjs <original.md> <compact.md>
//   original: git show sprint-<M>-bli-archive:docs/sprint-<M>-changelog.md, or
//             git show HEAD:docs/sprint-<M>-changelog.md before the rewrite
//   exit 0: every table-row key is present; exit 1: at least one is missing.
//   Keys named only in prose and a size above the template target are reported
//   without failing.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// The "Target size" line of the changelog template in commands/close-sprint.md.
export const MAX_BYTES = 15 * 1024;

const KEY = "[A-Z][A-Z0-9]*-[0-9A-Za-z]+";
// A combined cell such as `RFW-264/265` is tracked by its first key.
const ROW_KEY = new RegExp(`^\\|\\s*\`?(${KEY})(?:/[0-9A-Za-z]+)*\`?\\s*\\|`);
const MENTIONED_KEY = /\b[A-Z][A-Z0-9]*-[0-9]+\b/g;

export const tableRowKeys = (text) =>
  new Set(
    text
      .split("\n")
      .map((line) => ROW_KEY.exec(line)?.[1])
      .filter(Boolean),
  );

export const mentionedKeys = (text) => new Set(text.match(MENTIONED_KEY) ?? []);

const hasKey = (text, key) => new RegExp(`${key}(?![0-9A-Za-z])`).test(text);

export function compare(original, compact) {
  const rowKeys = tableRowKeys(original);
  const mentioned = mentionedKeys(original);
  return {
    rowKeys: rowKeys.size,
    mentioned: mentioned.size,
    missingRows: [...rowKeys].filter((key) => !hasKey(compact, key)),
    missingMentioned: [...mentioned].filter((key) => !hasKey(compact, key)),
    bytes: Buffer.byteLength(compact),
    overSize: Buffer.byteLength(compact) > MAX_BYTES,
  };
}

function report(result) {
  const list = (keys) => (keys.length > 0 ? ` -> ${keys.join(", ")}` : "");
  return [
    `table-row keys in the original: ${result.rowKeys}, keys mentioned: ${result.mentioned}`,
    `compact size: ${result.bytes} bytes${result.overSize ? ` (over the ${MAX_BYTES} byte target)` : ""}`,
    `table-row keys missing from the compact version: ${result.missingRows.length}${list(result.missingRows)}`,
    `other keys mentioned but missing (check each, not a failure): ${result.missingMentioned.length}${list(
      result.missingMentioned.filter((key) => !result.missingRows.includes(key)),
    )}`,
  ].join("\n");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [original, compact] = process.argv.slice(2);
  if (!original || !compact) {
    console.error("usage: node check-changelog-keys.mjs <original.md> <compact.md>");
    process.exit(2);
  }
  const result = compare(readFileSync(original, "utf8"), readFileSync(compact, "utf8"));
  console.log(report(result));
  process.exit(result.missingRows.length > 0 ? 1 : 0);
}
