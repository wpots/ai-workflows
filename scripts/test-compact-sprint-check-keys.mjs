// Tests for skills/compact-sprint/scripts/check-changelog-keys.mjs. Run: node --test scripts/test-compact-sprint-check-keys.mjs
import assert from "node:assert/strict";
import { test } from "node:test";

import { compare, MAX_BYTES, tableRowKeys } from "../skills/compact-sprint/scripts/check-changelog-keys.mjs";

const original = [
  "| Ticket | Wat | Bewijs | Status |",
  "| --- | --- | --- | --- |",
  "| RFW-29 | Header | `aaaaaaaa` | Done |",
  "| `RFW-291` | Footer | `bbbbbbbb` | Done |",
  "| RFW-264/265 | Testomgeving | `cccccccc` | Done |",
  "| Newsletter-copy CMS-beheerbaar (BLI RFW-XXX) | `dddddddd` |",
].join("\n");

test("table-row keys: plain, backticked and combined rows; ticketless rows are skipped", () => {
  assert.deepEqual([...tableRowKeys(original)], ["RFW-29", "RFW-291", "RFW-264"]);
});

test("a compact version that keeps every row key passes", () => {
  const compact = "| RFW-29 | x |\n| RFW-291 | x |\n| RFW-264/265 | x |";
  const result = compare(original, compact);
  assert.deepEqual(result.missingRows, []);
  assert.equal(result.overSize, false);
});

test("RFW-29 is not found in a file that only names RFW-291", () => {
  const compact = "| RFW-291 | x |\n| RFW-264/265 | x |";
  assert.deepEqual(compare(original, compact).missingRows, ["RFW-29"]);
});

test("a key mentioned only in prose is reported but is not a missing row", () => {
  const withProse = `${original}\n- RFW-77: scope beperkt tot de werkzoekende.`;
  const compact = "| RFW-29 | x |\n| RFW-291 | x |\n| RFW-264/265 | x |";
  const result = compare(withProse, compact);
  assert.deepEqual(result.missingRows, []);
  assert.deepEqual(result.missingMentioned, ["RFW-77"]);
});

test("a compact version over the template target is flagged", () => {
  const compact = `| RFW-29 | x |\n| RFW-291 | x |\n| RFW-264/265 | x |\n${"x".repeat(MAX_BYTES)}`;
  assert.equal(compare(original, compact).overSize, true);
});
