---
name: npm-maintenance
description: Safely inspect and update Node.js dependencies, including routine minor or patch updates, npm audit remediation, and researched major-version migrations. Use when the user asks to update npm packages, run npm outdated or npm update, manage dependency versions, fix dependency vulnerabilities, or assess breaking changes from a package upgrade.
---

# npm dependency maintenance

Keep package updates deliberate, reproducible, and verified. Treat major-version changes and forceful vulnerability fixes as approval gates.

## 1. Establish the project context

1. Check the working tree and preserve unrelated user changes. Do not change branches, create branches, stage, commit, push, or open a pull request unless the user asks.
2. Read `package.json`, the lockfile, the package-manager configuration, and available scripts. Use the lockfile to select the package manager:
   - `package-lock.json` → npm
   - `pnpm-lock.yaml` → pnpm
   - `yarn.lock` → Yarn
   - `bun.lock` or `bun.lockb` → Bun
3. Detect the supported runtime command before installing or validating:
   - Prefer the repository's documented command or dev-container wrapper.
   - Respect `.nvmrc`, `.node-version`, Volta configuration, or the package manager's `packageManager` field.
   - Use DDEV when the project documentation or configuration makes it the supported environment.
4. Inventory outdated packages and vulnerabilities with the selected package manager. Separate direct from transitive dependencies and minor or patch from major updates.

Report the proposed scope before making a change when the update set is broad or ambiguous.

## 2. Apply routine updates

For a requested minor or patch update:

1. Update only the requested packages. If the request is general maintenance, keep the batch limited to compatible minor and patch releases.
2. Reinstall or update the lockfile using the selected package manager; never hand-edit a lockfile.
3. Inspect `package.json` and the lockfile diff. Call out unexpected added, removed, or major-version transitive changes.
4. Run the relevant checks in [Validation](#validation).
5. Summarize updated packages, version transitions, audit status, changed files, and validation results.

## 3. Handle major updates

Before changing a direct dependency across a major version:

1. Identify the installed version, target version, package role, peer dependencies, and dependents in the repository.
2. Research the upstream migration guide, release notes, changelog, and official documentation. Prefer primary sources. Summarize breaking changes with file-level codebase impact where discoverable.
3. Propose a bounded migration plan, including configuration, API, type, build, and test changes.
4. Obtain explicit approval for the target version and plan before modifying dependencies or application code.
5. Apply the approved migration, then run validation. If checks fail, diagnose and report the failure; do not silently weaken tests, pins, or configuration to make the update pass.

## 4. Address vulnerabilities

For an audit or CVE request:

1. Run the package manager's audit command in both machine-readable and readable formats when available.
2. Report each actionable vulnerability: package, severity, direct or transitive path, affected range, and available remediation.
3. Apply safe compatible fixes covered by the user's requested scope, then run the audit again.
4. Never run `npm audit fix --force` or an equivalent breaking update without explicit user approval. Treat any remediation that upgrades a major version as a major update and follow the research workflow.
5. Clearly distinguish unresolved vulnerabilities with no upstream fix from vulnerabilities deferred by the approved scope.

## Validation

Run only scripts present in `package.json`, preferring the project's documented validation command. Otherwise, use the smallest relevant set:

1. lint and type checks;
2. focused tests for affected packages, then the normal test suite where practical;
3. production build;
4. Storybook build or tests when Storybook is configured and the update can affect UI tooling.

For Next.js projects, include the production build. State any skipped check and why. Never claim validation passed when a required command was not run.

## Safety constraints

- Never use `--force`, `--legacy-peer-deps`, `--ignore-scripts`, or equivalent bypasses to conceal an incompatibility without explicit user approval and a stated reason.
- Never delete a lockfile or replace one package manager with another merely to resolve an update.
- Preserve package-manager integrity: use immutable or frozen installs for verification when the project supports them.
- Do not commit, push, or create a pull request without the user's explicit request.
