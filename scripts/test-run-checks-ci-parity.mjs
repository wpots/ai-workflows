// Tests for skills/run-checks/scripts/ci-parity.mjs. Run: node --test scripts/test-run-checks-ci-parity.mjs
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";

import { analyze, VERIFY_DEFAULT_SCRIPTS } from "../skills/run-checks/scripts/ci-parity.mjs";

const root = mkdtempSync(path.join(os.tmpdir(), "ci-parity-"));
after(() => rmSync(root, { recursive: true, force: true }));

let counter = 0;
function project(files) {
  counter += 1;
  const dir = path.join(root, `p${counter}`);
  for (const [name, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, name)), { recursive: true });
    writeFileSync(path.join(dir, name), content);
  }
  mkdirSync(dir, { recursive: true });
  return dir;
}

const packageJson = (...names) =>
  JSON.stringify({ scripts: Object.fromEntries(names.map((name) => [name, "true"])) });

const NPM_COMPONENT = "$CI_SERVER_FQDN/greenberrynl/config/ci-components/node-npm@4.0.0-rc.1";

test("no .gitlab-ci.yml: no parity, convention sweep", () => {
  const report = analyze(project({ "package.json": packageJson("lint", "test") }));
  assert.equal(report.parity, "none");
  assert.equal(report.parityLine, "CI parity: no CI config found");
  assert.equal(report.scripts, null);
});

test("node-npm with a flow scripts input: exactly those scripts, in order", () => {
  const dir = project({
    "package-lock.json": "{}",
    "package.json": packageJson("lint:check", "type-check", "test", "build"),
    ".gitlab-ci.yml": [
      "include:",
      `  - component: ${NPM_COMPONENT}`,
      "    inputs:",
      '      node_version: "24.15.0"',
      "      scripts: [lint:check, test]",
      "",
    ].join("\n"),
  });
  const report = analyze(dir);
  assert.equal(report.parity, "exact");
  assert.equal(report.parityLine, "CI parity: exact (ci-components 4.0.0-rc.1)");
  assert.deepEqual(report.scripts, ["lint:check", "test"]);
  assert.equal(report.scriptsSource, "input");
  assert.equal(report.packageManager, "npm");
  assert.deepEqual(report.missingScripts, []);
  assert.equal(report.prePushDrift, null);
});

test("node-pnpm with a quoted block list: pnpm and the listed scripts", () => {
  const dir = project({
    "pnpm-lock.yaml": "",
    "package.json": packageJson("lint:check", "test:unit"),
    ".gitlab-ci.yml": [
      "---",
      "include:",
      "  - component: $CI_SERVER_FQDN/greenberrynl/config/ci-components/workflow@{sha}",
      "  - component: $CI_SERVER_FQDN/greenberrynl/config/ci-components/node-pnpm@{sha}",
      "    inputs:",
      '      node_version: "24.15.0"',
      "      scripts:",
      '        - "lint:check"',
      "        - 'test:unit'  # unit tests only",
      "      verify_paths:",
      '        - "src/**"',
    ].join("\n"),
  });
  const report = analyze(dir);
  assert.equal(report.parityLine, "CI parity: exact (ci-components {sha})");
  assert.equal(report.component, "node-pnpm");
  assert.equal(report.packageManager, "pnpm");
  assert.deepEqual(report.scripts, ["lint:check", "test:unit"]);
});

test("no scripts input: the component default", () => {
  const dir = project({
    "package.json": packageJson("lint:check", "type-check", "test"),
    ".gitlab-ci.yml": `include:\n  - component: ${NPM_COMPONENT}\n    inputs:\n      node_version: "24.15.0"\n`,
  });
  const report = analyze(dir);
  assert.deepEqual(report.scripts, VERIFY_DEFAULT_SCRIPTS);
  assert.equal(report.scriptsSource, "default");
});

test("a listed script package.json lacks is reported as missing", () => {
  const dir = project({
    "package.json": packageJson("lint:check", "test"),
    ".gitlab-ci.yml": `include:\n  - component: ${NPM_COMPONENT}\n`,
  });
  assert.deepEqual(analyze(dir).missingScripts, ["type-check"]);
});

test("pre-push drift lists names on one side only", () => {
  const dir = project({
    "package.json": packageJson("lint:check", "type-check", "test", "build"),
    ".gitlab-ci.yml": `include:\n  - component: ${NPM_COMPONENT}\n`,
    ".husky/pre-push": "#!/usr/bin/env sh\nnpm run lint:check && npm test\nnpm run -s build\n",
  });
  assert.deepEqual(analyze(dir).prePushDrift, { onlyInCi: ["type-check"], onlyInPrePush: ["build"] });
});

test("a scripts input that is not a plain list falls back to approximate", () => {
  const variable = project({
    ".gitlab-ci.yml": `include:\n  - component: ${NPM_COMPONENT}\n    inputs:\n      scripts: $VERIFY_SCRIPTS\n`,
  });
  const entry = project({
    ".gitlab-ci.yml": `include:\n  - component: ${NPM_COMPONENT}\n    inputs:\n      scripts:\n        - $[[ inputs.check ]]\n`,
  });
  for (const dir of [variable, entry]) {
    const report = analyze(dir);
    assert.equal(report.parity, "approximate");
    assert.match(report.parityLine, /^CI parity: approximate \(the scripts input of node-npm is not a plain list: /);
    assert.equal(report.scripts, null);
  }
});

test("config/ci include: approximate with its ref, project jobs listed and never run", () => {
  const dir = project({
    "package-lock.json": "{}",
    ".gitlab-ci.yml": [
      "include:",
      '  - project: "greenberrynl/config/ci"',
      "    # Replace the ref for another version of the CI pipeline",
      "    ref: version/3.1.1",
      '    file: "/projects/templates/deploy-clever.yml"',
      "",
      "image: node:24.15.0",
      "",
      ".only-mr:",
      "  rules:",
      "    - if: $CI_PIPELINE_SOURCE == 'merge_request_event'",
      "",
      "type_check:",
      "  stage: test",
      "  extends: .only-mr",
      "  script:",
      "    - npm run generate:importmap",
      "    - npx next typegen",
      "    - npm run type-check",
      "",
      "storybook_test:",
      "  script:",
      "    - |",
      "      node scripts/vitest/run-storybook-shards.js",
      "  after_script: echo done",
      "",
      "smoke: { script: echo }",
    ].join("\n"),
  });
  const report = analyze(dir);
  assert.equal(report.parity, "approximate");
  assert.equal(report.parityLine, "CI parity: approximate (config/ci version/3.1.1)");
  assert.equal(report.scripts, null);
  assert.deepEqual(report.projectJobs, [
    {
      name: "type_check",
      script: ["npm run generate:importmap", "npx next typegen", "npm run type-check"],
      extends: ".only-mr",
    },
    { name: "storybook_test", script: ["(multi-line command)"], extends: null },
    { name: "smoke", script: [], extends: null },
  ]);
});

test("only a local include: approximate, naming the file it did not read", () => {
  const dir = project({ ".gitlab-ci.yml": "include:\n  - local: ci/main.yml\n" });
  assert.equal(analyze(dir).parityLine, "CI parity: approximate (local include not read: ci/main.yml)");
});

test("a lockfile that disagrees with the component is noted, the component wins", () => {
  const dir = project({
    "pnpm-lock.yaml": "",
    "package.json": packageJson("lint:check", "type-check", "test"),
    ".gitlab-ci.yml": `include:\n  - component: ${NPM_COMPONENT}\n`,
  });
  const report = analyze(dir);
  assert.equal(report.packageManager, "npm");
  assert.deepEqual(report.notes, ["the lockfile says pnpm, while node-npm runs npm"]);
});
