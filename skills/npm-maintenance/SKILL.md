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
   - Run the package manager through the pinned Node binary — `<node>/bin/node <node>/lib/node_modules/npm/bin/npm-cli.js …` — not `<node>/bin/npm`: npm's shebang resolves `node` from `PATH`, so the wrong runtime still wins (`EBADENGINE`). A root-owned `~/.npm` (`EPERM`; npm suggests `chown`) is worked around with `--cache <scratch dir>`, never with `sudo`.
4. Inventory outdated packages and vulnerabilities with the selected package manager. Separate direct from transitive dependencies and minor or patch from major updates.
5. **Read the project's own history for every package you intend to move**: `git log --oneline -S'"<pkg>": "' -- package.json` and `git log --oneline --grep=Revert`. A reverted bump of the same package — above all one re-applied afterwards at a lower version — is a hard stop: name the revert commit and its reason before proposing anything, and when the reason is in neither the commit, the MR nor the tracker, ask. Never assume it is stale.

Report the proposed scope before making a change when the update set is broad or ambiguous.

## Inventory mode (report-only)

Use this mode when the caller wants the dependency picture without changing
anything — a periodic sweep (`skills/maintenance/SKILL.md` lane A), a pre-sprint
check, or a "how bad is it" question.

In this mode, after step 1:

1. Run only read commands: the package manager's `outdated` and `audit`
   (machine-readable where available). Never `update`, `install`, `audit fix`,
   or a lockfile write — not even to "see if it resolves".
2. Report, without acting:
   - direct dependencies behind a major, with the current → latest jump, split
     from minor/patch drift;
   - high and critical vulnerabilities: package, direct or transitive path,
     whether an upstream fix exists, and whether the fix is itself a major;
   - deprecated or unmaintained packages (deprecation notices, last publish
     older than ~18 months);
   - lockfile ↔ `package.json` drift — verify with a **frozen/immutable
     install into a throwaway location** or a dry run; never write the
     project's lockfile to find out;
   - whether an automated updater (Renovate, Dependabot) is configured and
     actually opening MRs.
3. End with the smallest set of *proposed* next actions, ranked, each tagged
   routine (§2) or major (§3). The caller decides; this mode never applies them.

Skip [Validation](#validation) entirely — nothing changed, so there is nothing
to validate. Saying "checks passed" after an inventory run is a false claim.

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

## Framework minors are behavioural changes

A minor of the framework (Next, Nuxt, Remix, Expo) can flip defaults and change
request patterns while lint, tests and the build stay green. When the bump is a
framework minor, or the history check in §1 found a revert, do this before
calling it safe:

1. Diff the release notes between the **exact** deployed version and the target
   — every patch in between, from the releases API, not the minor's blog post.
2. Diff the framework's default configuration between the two tags (for Next:
   `packages/next/src/server/config-shared.ts`). A flipped default is a
   behavioural change the app never opted into.
3. Name the host's cost-sensitive metrics (Vercel: Function Invocations, Edge
   Requests, Firewall Rate Limit Requests) and what the app's baseline is.
4. Measure request volume on a production build served locally (`next start`)
   against the current production deployment as baseline: the homepage and one
   list page, DevTools filtered on the framework's data-request marker
   (`_rsc` for Next), counted after load, after 60 s idle, and after forced
   re-renders.
5. **Positive control**: reinstall the known-bad version with
   `<pm> install <pkg>@<bad> --no-save`, rebuild, repeat the measurement. A clean
   result on the target without a reproduced failure on the bad version proves
   nothing. Restore `node_modules` from the lockfile afterwards.
6. Put all three numbers in the MR, name the metric to watch in the first hour
   after deploy, and name the rollback.

## 4. Address vulnerabilities

For an audit or CVE request:

1. Run the package manager's audit command in both machine-readable and readable formats when available.
2. Report each actionable vulnerability: package, severity, direct or transitive path, affected range, and available remediation.
3. Apply safe compatible fixes covered by the user's requested scope, then run the audit again. To move one package, write only the lockfile with `<pm> install <pkg>@<range> --package-lock-only`. Diff the lockfile entry by entry (added, removed and re-versioned paths), not just its line count. A plain install over a copied or stale `node_modules` can drop optional platform packages, such as the wasm runtimes, from the lockfile.
4. Never run `npm audit fix --force` or an equivalent breaking update without explicit user approval. Treat any remediation that upgrades a major version as a major update and follow the research workflow.
5. Clearly distinguish unresolved vulnerabilities with no upstream fix from vulnerabilities deferred by the approved scope.
6. Once the fix is live — the delivering commit is an ancestor of the production ref and the deploy pipeline passed — offer the short dev-team mail from `references/advisory-mail.md` in this skill's directory. Mirror the previous `OSV scan (PATCHED)` mail in the sent folder. Create it as a draft through the mail connector first, and put it in the reply ready to paste only when that fails. Never send it.

### A finding from an external scanner

An external scanner (OSV-Scanner or a similar service) need not agree with the project's own audit:

- **It may scan another ref.** Scanners often read the production branch, not the working tree. Audit that ref's lockfile without checking it out: `git archive --output=<scratch>/lock.tar <ref> package.json package-lock.json`, unpack it, then `npm audit --package-lock-only --prefix <dir>`.
- **Its severity may differ.** OSV can call critical what `npm audit` and GitHub call high, and it can list an advisory before `npm audit` has it. Filtering `npm audit` on the scanner's severity then finds nothing. Ask OSV directly instead: POST the lockfile's `name@version` list to `https://api.osv.dev/v1/querybatch`, then fetch each hit from `/v1/vulns/<id>`. The newest `published` date is usually the "new" finding.
- **Its dates may differ.** OSV's `published` date and the date on the GitHub advisory page can be days apart. Report both.
- **Check whether the vulnerable code path is reachable** before you rank urgency. An SVG-decoder bug matters little in an app that never decodes SVG. That decides between a hotfix and riding along with the next release, not whether the fix goes in.

## Validation

Run only scripts present in `package.json`, preferring the project's documented validation command. Otherwise, use the smallest relevant set:

1. lint and type checks;
2. focused tests for affected packages, then the normal test suite where practical;
3. production build;
4. Storybook build or tests when Storybook is configured and the update can affect UI tooling.

For Next.js projects, include the production build. State any skipped check and why. Never claim validation passed when a required command was not run.

Capture exit codes, not excerpts: run each validation command on its own and read its status. `npm run build | tail` returns `tail`'s status, so a failed build prints as a green line.

## Safety constraints

- Never use `--force`, `--legacy-peer-deps`, `--ignore-scripts`, or equivalent bypasses to conceal an incompatibility without explicit user approval and a stated reason.
- Never delete a lockfile or replace one package manager with another merely to resolve an update.
- Preserve package-manager integrity: use immutable or frozen installs for verification when the project supports them.
- Do not commit, push, or create a pull request without the user's explicit request.
