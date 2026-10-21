#!/usr/bin/env node
// Regression tests for the changelog readers behind release-train,
// announce-release and publish-release, the fragment reader, the backlog
// archive, and the version assignment itself.
// Run: node --test scripts/test-release-automation.mjs

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  applyArchive,
  describeItem,
  planArchive,
  renderArchived,
  renderStatus,
} from "./backlog-archive.mjs";
import {
  FRAGMENT_FILE,
  groupUnreleased,
  inferBump,
  mergeGroups,
  readFragments,
  renderSections,
} from "./changelog-fragments.mjs";
import { entries, firstSentence, sectionBody, sectionDate } from "./changelog-sections.mjs";
import { changedSyncPaths, PROJECT_SYNC_PATHSPECS, releaseRange } from "./project-sync-paths.mjs";
import {
  buildAnnouncement,
  changeRows,
  splitLead,
  syncLabels,
  toPlainMrkdwn,
} from "./release-announcement.mjs";
import { readyTitle, releaseTitle } from "./release-mr.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// The pre-commit hook runs this file with GIT_DIR, GIT_WORK_TREE and
// GIT_INDEX_FILE exported. The fixtures below run git in temp directories, and
// with those inherited every call lands in this repo instead: a hook run set
// core.bare=true in its config and replaced the worktree's index with the
// fixture's files. Without them each git call finds its repo from its cwd.
for (const key of Object.keys(process.env)) {
  if (key.startsWith("GIT_")) {
    delete process.env[key];
  }
}

const FIXTURE = `# Changelog

Describe the change under \`## [Unreleased]\` in the same MR.

## [Unreleased]

### Added

- \`skills/one\` — does the first thing (e.g. this). Second sentence.
  Continues here.

### Fixed

- \`scripts/two.mjs\` — fixes \`a.b\` without stopping. More.

## [1.2.0] - 2026-01-02

### Changed

- \`skills/three\` — changed. Tail.

## [1.1.0] - 2026-01-01

### Added

- old entry.
`;

test("sectionBody anchors to the heading line, not the intro prose", () => {
  const body = sectionBody(FIXTURE, "Unreleased");
  assert.ok(body.startsWith("### Added"));
  assert.ok(body.includes("scripts/two.mjs"));
  assert.ok(!body.includes("[1.2.0]"));
});

test("sectionBody reads one released version and returns null for a missing one", () => {
  assert.equal(sectionBody(FIXTURE, "1.2.0"), "### Changed\n\n- `skills/three` — changed. Tail.");
  assert.equal(sectionBody(FIXTURE, "9.9.9"), null);
});

test("entries joins continuation lines and keeps the section", () => {
  const found = entries(sectionBody(FIXTURE, "Unreleased"));
  assert.deepEqual(
    found.map((entry) => entry.section),
    ["Added", "Fixed"],
  );
  assert.equal(
    found[0].text,
    "`skills/one` — does the first thing (e.g. this). Second sentence. Continues here.",
  );
});

test("firstSentence skips periods inside backticks and after abbreviations", () => {
  assert.equal(
    firstSentence("`skills/one` — does the first thing (e.g. this). Second sentence."),
    "`skills/one` — does the first thing (e.g. this).",
  );
  assert.equal(
    firstSentence("`scripts/two.mjs` — fixes `a.b` without stopping. More."),
    "`scripts/two.mjs` — fixes `a.b` without stopping.",
  );
  assert.equal(firstSentence("no period at all"), "no period at all");
});

const NOTED = `## [2.0.0] - 2026-10-12

### Action required

- Delete \`.claude/skills/verify/SKILL.md\` and re-sync, see [the doc](https://x.example/d).
- Re-run setup.
  <!-- slack: Draai \`setup-ai-workflows\` opnieuw voor de <Hosting>-sectie -->

### Added

- \`skills/one\`, \`skills/two\` — adds things. More.
  <!-- slack: Doet nieuwe dingen -->
- \`skills/quiet\` — internal only.

### Fixed

- Browser checks pick a tool by purpose.
  <!-- slack: browserverificatie | Kiest de tool op doel -->
`;

const PROJECT = "https://gitlab.example/p";

function blocksOf(type, payload) {
  return payload.blocks.filter((block) => block.type === type);
}

function headers(payload) {
  return blocksOf("header", payload).map((block) => block.text.text);
}

test("entries lifts the slack note out of the entry text", () => {
  const found = entries(sectionBody(NOTED, "2.0.0"));
  assert.equal(found[1].text, "Re-run setup.");
  assert.equal(found[1].slack, "Draai `setup-ai-workflows` opnieuw voor de <Hosting>-sectie");
  assert.equal(found[3].slack, null);

  const quoted = entries("- Adds a `<!-- slack: x -->` line.\n  More prose.");
  assert.deepEqual(quoted, [{ section: null, text: "Adds a `<!-- slack: x -->` line. More prose.", slack: null }]);

  assert.equal(sectionDate(NOTED, "2.0.0"), "2026-10-12");
  assert.equal(sectionDate(NOTED, "9.9.9"), null);
});

test("splitLead names the leading skill and command paths, nothing else", () => {
  assert.deepEqual(splitLead("`skills/one`, `skills/two/references/x.md` — adds."), {
    component: "one, two",
    rest: "adds.",
  });
  assert.deepEqual(splitLead("`commands/create-pr.md` and `CLAUDE.md` — changed."), {
    component: "create-pr, CLAUDE.md",
    rest: "changed.",
  });
  assert.deepEqual(splitLead("Browser checks — pick a tool."), { component: null, rest: "Browser checks — pick a tool." });
  assert.equal(splitLead("`skills/one` adds things without a dash.").component, null);
});

test("changeRows shows only noted entries, counts the rest, and honours an explicit component", () => {
  const { rows, rest } = changeRows(sectionBody(NOTED, "2.0.0"));
  assert.deepEqual(rows, [
    { type: "✨ Nieuw", component: "one, two", text: "Doet nieuwe dingen" },
    { type: "🐛 Fix", component: "browserverificatie", text: "Kiest de tool op doel" },
  ]);
  assert.equal(rest, 1);
});

test("changeRows falls back to the first sentence of every entry when no entry has a note", () => {
  const { rows, rest } = changeRows(sectionBody(FIXTURE, "Unreleased"), 15, 1);
  assert.deepEqual(rows, [{ type: "✨ Nieuw", component: "one", text: "Does the first thing (e.g. this)." }]);
  assert.equal(rest, 1);
});

test("syncLabels puts the adapters first, then rules, commands and the sync script", () => {
  assert.deepEqual(
    syncLabels(["commands/a.md", "rules/b.md", "scripts/sync.sh", "shared/c.md", "templates/project-CLAUDE.md"]),
    [
      "de project-adapters (`CLAUDE.md`, `AGENTS.md`, Copilot)",
      "`rules/b.md`",
      "`commands/a.md`",
      "het sync-script",
    ],
  );
  assert.deepEqual(syncLabels(["rules/a.md", "rules/b.md", "rules/c.md"], 2), ["`rules/a.md`", "`rules/b.md`", "+ 1 meer"]);
});

test("buildAnnouncement with a sync: sync block, escaped commands, actions, one table", () => {
  const payload = buildAnnouncement({
    version: "2.0.0",
    date: "2026-10-12",
    body: sectionBody(NOTED, "2.0.0"),
    projectUrl: PROJECT,
    syncPaths: ["rules/testing.md"],
  });
  const text = toPlainMrkdwn(payload);

  assert.equal(payload.text, "📦 greenberry plugin 2.0.0 staat klaar: plugin updaten en projecten syncen.");
  assert.deepEqual(headers(payload), [
    "📦 greenberry plugin 2.0.0",
    "🔄 Plugin updaten",
    "🗂️ Projecten syncen",
    "⚠️ Eenmalig",
    "✨ Wat is er nieuw",
  ]);
  assert.equal(blocksOf("table", payload).length, 1);
  assert.ok(text.includes("ai-workflows · 12 okt 2026"));
  assert.ok(text.includes("*Projecten syncen*: ✅ Nodig, zie hieronder"));
  assert.ok(text.includes("*Eenmalige actie*: ⚠️ 2 punten, zie hieronder"));
  assert.ok(text.includes("Gewijzigd in wat een project krijgt: `rules/testing.md`."));
  assert.ok(text.includes("git checkout main &amp;&amp; git pull --ff-only"));
  assert.ok(text.includes("--project ~/Web/&lt;project&gt;"));
  assert.ok(text.includes("• Delete `.claude/skills/verify/SKILL.md` and re-sync, see <https://x.example/d|the doc>."));
  assert.ok(text.includes("• Draai `setup-ai-workflows` opnieuw voor de &lt;Hosting&gt;-sectie"));
  assert.ok(text.includes("• ✨ Nieuw · `one, two` — Doet nieuwe dingen"));
  assert.ok(text.includes(`+ 1 andere wijziging · <${PROJECT}/-/blob/main/CHANGELOG.md|Volledige changelog>`));
});

test("buildAnnouncement without a sync, and with an unknown one", () => {
  const quiet = buildAnnouncement({ version: "1.2.0", body: sectionBody(FIXTURE, "1.2.0"), projectUrl: PROJECT, syncPaths: [] });
  assert.ok(!headers(quiet).includes("🗂️ Projecten syncen"));
  assert.ok(!headers(quiet).includes("⚠️ Eenmalig"));
  assert.ok(toPlainMrkdwn(quiet).includes("*Projecten syncen*: ➖ Niet nodig deze keer"));
  assert.ok(toPlainMrkdwn(quiet).includes("Deze keer: *de plugin updaten*."));

  const unknown = buildAnnouncement({ version: "1.2.0", body: sectionBody(FIXTURE, "1.2.0"), projectUrl: PROJECT, syncPaths: null });
  assert.ok(
    toPlainMrkdwn(unknown).includes("*Projecten syncen*: ❔ Zeg ja als Claude meldt dat de project sync stale is"),
  );
});

test("PROJECT_SYNC_PATHSPECS is the set project-sync-freshness.sh digests", () => {
  const script = readFileSync(join(ROOT, "scripts", "project-sync-freshness.sh"), "utf8");
  const templates = /ADAPTER_TEMPLATES=\(([^)]*)\)/.exec(script)[1].split(/\s+/).filter(Boolean);
  const dirs = [...script.matchAll(/"\$SOURCE_DIR\/([a-z]+)"/g)].map((match) => match[1]);
  const scripts = [...script.matchAll(/cat "\$SOURCE_DIR\/(scripts\/[^"]+)"/g)].map((match) => match[1]);

  const byName = (a, b) => a.localeCompare(b);
  assert.deepEqual(
    [...PROJECT_SYNC_PATHSPECS].sort(byName),
    [...dirs, ...templates.map((name) => `templates/${name}`), ...scripts].sort(byName),
  );
});

test("releaseRange and changedSyncPaths diff the synced files between two releases", () => {
  const repo = mkdtempSync(join(tmpdir(), "release-range-"));
  const git = (...args) =>
    execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@example.com", ...args], {
      cwd: repo,
      encoding: "utf8",
    });
  const commit = (file, message) => {
    mkdirSync(dirname(join(repo, file)), { recursive: true });
    writeFileSync(join(repo, file), `${message}\n`);
    git("add", "-A");
    git("commit", "-q", "-m", message);
  };

  git("init", "-q");
  commit("rules/a.md", "release: 1.0.0");
  commit("rules/a.md", "change a rule");
  commit("skills/x/SKILL.md", "change a skill");
  commit("templates/project-CLAUDE.md", "change an adapter");
  commit("CHANGELOG.md", "release: 1.1.0");

  const expected = ["rules/a.md", "templates/project-CLAUDE.md"];
  assert.deepEqual(changedSyncPaths(repo, releaseRange(repo, "1.1.0", { atHead: true })), expected);

  commit("skills/x/SKILL.md", "after the release");
  assert.deepEqual(changedSyncPaths(repo, releaseRange(repo, "1.1.0")), expected);
  assert.equal(releaseRange(repo, "1.0.0"), null);
  rmSync(repo, { recursive: true });
});

test("an action fragment lands under Action required, first, and does not bump on its own", () => {
  assert.ok(FRAGMENT_FILE.test("action.delete-verify.md"));
  const dir = mkdtempSync(join(tmpdir(), "fragments-action-"));
  writeFileSync(join(dir, "action.delete-verify.md"), "- delete it.\n");
  writeFileSync(join(dir, "fixed.bug.md"), "- a fix.\n");

  const { fragments, errors } = readFragments(dir);
  assert.deepEqual(errors, []);
  const groups = mergeGroups(new Map(), fragments);
  assert.equal(inferBump(groups), "patch");
  assert.equal(renderSections(groups), "### Action required\n\n- delete it.\n\n### Fixed\n\n- a fix.\n");
  rmSync(dir, { recursive: true });
});

test("readFragments parses well-named bullet files, reports the rest, tolerates a missing dir", () => {
  const dir = mkdtempSync(join(tmpdir(), "fragments-"));
  writeFileSync(join(dir, "added.one.md"), "- one\n  more\n");
  writeFileSync(join(dir, "fixed.two.md"), "- two\n");
  writeFileSync(join(dir, "Added.bad-case.md"), "- x\n");
  writeFileSync(join(dir, "changed.no-bullet.md"), "no bullet\n");
  writeFileSync(join(dir, ".gitkeep"), "");

  const { fragments, errors } = readFragments(dir);
  assert.deepEqual(
    fragments.map((fragment) => [fragment.file, fragment.section, fragment.body]),
    [
      ["added.one.md", "Added", "- one\n  more"],
      ["fixed.two.md", "Fixed", "- two"],
    ],
  );
  assert.equal(errors.length, 2);
  assert.ok(errors[0].includes("Added.bad-case.md"));
  assert.ok(errors[1].includes("changed.no-bullet.md"));
  assert.deepEqual(readFragments(join(dir, "missing")), { fragments: [], errors: [] });
  rmSync(dir, { recursive: true });
});

test("mergeGroups keeps hand-written entries first; inferBump and renderSections follow the sections", () => {
  const handWritten = groupUnreleased("\n\n### Changed\n\n- hand\n  written\n\n### Fixed\n\n- old fix\n");
  const groups = mergeGroups(handWritten, [
    { file: "changed.x.md", section: "Changed", body: "- fragment" },
    { file: "added.y.md", section: "Added", body: "- new" },
  ]);

  assert.equal(groups.get("Changed"), "- hand\n  written\n- fragment");
  assert.equal(inferBump(groups), "minor");
  assert.equal(inferBump(new Map([["Fixed", "- x"]])), "patch");
  assert.equal(inferBump(new Map([["Changed", "- BREAKING: x"]])), "major");
  assert.equal(inferBump(new Map([["Removed", "- x"]])), "major");
  assert.equal(
    renderSections(groups),
    "### Added\n\n- new\n\n### Changed\n\n- hand\n  written\n- fragment\n\n### Fixed\n\n- old fix\n",
  );
});

test("assign-plugin-version folds fragments and Unreleased entries into one release and removes the fragments", () => {
  const root = mkdtempSync(join(tmpdir(), "release-root-"));
  mkdirSync(join(root, ".claude-plugin"));
  mkdirSync(join(root, "changelog.d"));
  writeFileSync(
    join(root, ".claude-plugin", "plugin.json"),
    '{\n  "name": "x",\n  "version": "1.0.0"\n}\n',
  );
  writeFileSync(
    join(root, "CHANGELOG.md"),
    "# Changelog\n\nIntro mentions `## [Unreleased]`.\n\n## [Unreleased]\n\n### Changed\n\n- hand-written entry.\n\n## [1.0.0] - 2026-01-01\n\n### Added\n\n- first.\n",
  );
  writeFileSync(join(root, "changelog.d", "added.feature.md"), "- a feature.\n  continued.\n");
  writeFileSync(join(root, "changelog.d", "fixed.bug.md"), "- a fix.\n");
  mkdirSync(join(root, "docs", "backlog"), { recursive: true });
  writeFileSync(join(root, "docs", "backlog", "feat-done.md"), "# Done\n\n## Status\n\ndone\n");
  writeFileSync(join(root, "docs", "backlog", "feat-open.md"), "# Open\n\n## Status\n\ndraft\n");
  execFileSync("git", ["init", "-q"], { cwd: root });
  execFileSync("git", ["add", "."], { cwd: root });

  const script = join(ROOT, "scripts", "assign-plugin-version.mjs");
  const run = (...extra) =>
    execFileSync(process.execPath, [script, "--root", root, "--date", "2026-02-02", ...extra], {
      encoding: "utf8",
    });

  const plan = run();
  assert.match(plan, /1\.0\.0 -> 1\.1\.0 \(minor\)/);
  assert.match(plan, /fragments\s+2 \+ entries still under Unreleased/);
  assert.match(plan, /backlog\s+1 to archive/);
  assert.match(plan, /Dry run/);
  assert.ok(existsSync(join(root, "changelog.d", "added.feature.md")));
  assert.ok(existsSync(join(root, "docs", "backlog", "feat-done.md")));

  run("--write");
  const changelog = readFileSync(join(root, "CHANGELOG.md"), "utf8");
  assert.ok(
    changelog.includes(
      "## [Unreleased]\n\n## [1.1.0] - 2026-02-02\n\n### Added\n\n- a feature.\n  continued.\n\n### Changed\n\n- hand-written entry.\n\n### Fixed\n\n- a fix.\n\n## [1.0.0] - 2026-01-01",
    ),
    changelog,
  );
  assert.match(readFileSync(join(root, ".claude-plugin", "plugin.json"), "utf8"), /"version": "1\.1\.0"/);
  assert.ok(!existsSync(join(root, "changelog.d", "added.feature.md")));
  assert.ok(!existsSync(join(root, "changelog.d", "fixed.bug.md")));
  assert.ok(!existsSync(join(root, "docs", "backlog", "feat-done.md")));
  assert.ok(existsSync(join(root, "docs", "backlog", "feat-open.md")));
  assert.match(run(), /^Nothing to release/);
  rmSync(root, { recursive: true });
});

test("describeItem reads the Status past a template comment, the title and the MR", () => {
  const text =
    "# Feature: A\n\n## Status\n\n<!-- draft | ready | in-progress | done -->\n\n**Done**\n\n" +
    "## Related\n\n- MR: https://gitlab.example/p/-/merge_requests/42\n";
  assert.deepEqual(describeItem("docs/backlog/feat-a.md", text), {
    path: "docs/backlog/feat-a.md",
    file: "feat-a.md",
    title: "Feature: A",
    status: "done",
    mr: "!42",
  });
  assert.equal(describeItem("docs/backlog/x.md", "# X\n\n## Status\n\n## Priority\n").status, null);
});

test("planArchive archives done and superseded items unless a living doc still names them", () => {
  const root = mkdtempSync(join(tmpdir(), "backlog-root-"));
  const item = (status, extra = "") => `# Item ${status}\n\n## Status\n\n${status}\n${extra}`;
  mkdirSync(join(root, "docs", "backlog"), { recursive: true });
  writeFileSync(join(root, "docs", "backlog", "feat-done.md"), item("done"));
  writeFileSync(join(root, "docs", "backlog", "spike-old.md"), item("superseded"));
  writeFileSync(join(root, "docs", "backlog", "feat-named.md"), item("done"));
  writeFileSync(
    join(root, "docs", "backlog", "feat-open.md"),
    item("in-progress", "\nDepends on: [feat-done.md](feat-done.md)\n"),
  );
  writeFileSync(join(root, "docs", "backlog", "_template.md"), item("draft"));
  writeFileSync(join(root, "docs", "map.md"), "filed: `docs/backlog/feat-named.md`; not x-feat-done.md\n");
  writeFileSync(join(root, "CHANGELOG.md"), "- delivered `docs/backlog/spike-old.md`\n");
  execFileSync("git", ["init", "-q"], { cwd: root });
  execFileSync("git", ["add", "."], { cwd: root });

  const plan = planArchive(root);
  assert.equal(plan.items.length, 4);
  assert.deepEqual(
    plan.archive.map((entry) => entry.file),
    ["feat-done.md", "spike-old.md"],
  );
  assert.deepEqual(
    plan.kept.map((entry) => [entry.file, entry.namedIn]),
    [["feat-named.md", ["docs/map.md"]]],
  );

  const status = renderStatus(plan, "1.1.0");
  assert.ok(status.includes("`git show v1.1.0^1:docs/backlog/<file>`"), status);
  assert.ok(status.includes("- `feat-done.md` — Item done"), status);
  assert.ok(status.includes("- `feat-named.md` — named in `docs/map.md`"), status);
  assert.ok(status.includes("Still open: in-progress 1 (`feat-open.md`)"), status);

  applyArchive(root, plan);
  assert.ok(!existsSync(join(root, "docs", "backlog", "feat-done.md")));
  assert.ok(!existsSync(join(root, "docs", "backlog", "spike-old.md")));
  assert.ok(existsSync(join(root, "docs", "backlog", "feat-named.md")));
  rmSync(root, { recursive: true });
});

test("renderArchived links each item at the given commit", () => {
  assert.equal(
    renderArchived(
      [{ path: "docs/backlog/feat-a.md", file: "feat-a.md", title: "Feature: A", mr: "!42" }],
      "https://gitlab.example/p/-/blob/abc123",
    ),
    "### Backlog\n\nDelivered and archived with this release:\n\n" +
      "- [Feature: A](https://gitlab.example/p/-/blob/abc123/docs/backlog/feat-a.md) (!42)",
  );
});

test("the release MR opens as a draft, keeps its state on a re-cut, and --ready drops only the prefix", () => {
  assert.equal(releaseTitle("2.10.0", { draft: true }), "Draft: release: 2.10.0");
  assert.equal(releaseTitle("2.10.1", { draft: false }), "release: 2.10.1");
  assert.equal(readyTitle("Draft: release: 2.10.0"), "release: 2.10.0");
  assert.equal(readyTitle("release: 2.10.0"), "release: 2.10.0");
});

test("every backlog item in the repo has a readable Status, so a release can archive it", () => {
  const unreadable = planArchive(ROOT)
    .items.filter((entry) => entry.status === null)
    .map((entry) => entry.file);
  assert.deepEqual(unreadable, []);
});

test("the real repo parses: 2.5.0 has entries, Unreleased is readable, fragments are well-formed", () => {
  const changelog = readFileSync(join(ROOT, "CHANGELOG.md"), "utf8");
  const released = sectionBody(changelog, "2.5.0");
  assert.ok(released !== null);
  assert.ok(entries(released).length >= 5);
  assert.notEqual(sectionBody(changelog, "Unreleased"), null);
  assert.deepEqual(readFragments(join(ROOT, "changelog.d")).errors, []);

  const announced = buildAnnouncement({ version: "2.5.0", body: released, projectUrl: PROJECT, syncPaths: null });
  assert.equal(blocksOf("table", announced).length, 1);
});
