---
name: npm-maintenance
description: Run npm audit and fix vulnerabilities. Two modes - monthly maintenance (from development) or urgent CVE fix (from main). Use when user asks to run npm maintenance, fix vulnerabilities, audit dependencies, or patch a CVE.
---

# NPM Maintenance Skill

Two modes based on arguments:

- `/npm-maintenance` or `/npm-maintenance maintenance` — monthly maintenance
- `/npm-maintenance cve` — urgent CVE patching

## Mode Detection

- If argument contains `cve` (case-insensitive) → **CVE mode**
- Otherwise → **Maintenance mode**

---

## Maintenance Mode

Fixes all known vulnerabilities on a scheduled cadence.

### Workflow

1. Ensure working tree is clean (`git status`). Abort if dirty.
2. `git checkout development && git pull origin development`
3. Determine branch name: `chore/maintenance-<month-year>` (e.g., `chore/maintenance-april-2026`). Use lowercase month name.
4. `git checkout -b <branch>`
5. Run `npm audit --json` and `npm audit` (human-readable). Show the report to the user.
6. If no vulnerabilities found, inform user and stop.
7. Run `npm audit fix` to auto-fix what's safe.
8. Run `npm audit` again. If **critical** or **high** vulnerabilities remain:
   - Show which packages are still vulnerable and their CVE IDs.
   - Ask user whether to run `npm audit fix --force` (may include breaking semver changes).
   - If user approves, run it.
9. Run `npm audit` a final time and show the remaining report.
10. If `package-lock.json` or `package.json` changed:
    - Run project checks if available (`npm run lint`, `npm run type-check`, `npm run build`). Skip missing scripts.
    - Stage `package.json` and `package-lock.json`.
    - Commit: `chore(deps): monthly dependency maintenance <month> <year>`
11. Show summary: what was fixed, what remains, whether checks passed.
12. Ask user if they want to push and create a PR targeting `development`.

### Target branch: `development`

---

## CVE Mode

Discovers and patches CVE vulnerabilities, branching from and merging to `main`.

### Workflow

1. Ensure working tree is clean (`git status`). Abort if dirty.
2. `git checkout main && git pull origin main`
3. Run `npm audit --json` to discover vulnerabilities with CVE identifiers.
4. Parse the audit output and list all CVEs found with severity, package name, and affected version.
5. If no CVEs found, inform user and stop.
6. Show the CVE list to the user and ask which to fix:
   - **All** — fix everything
   - **Critical/High only** — fix only critical and high severity
   - **Specific CVE(s)** — user picks from the list
7. Determine branch name from the CVEs being fixed:
   - Single CVE: `chore/cve-<cve-id>` (e.g., `chore/cve-2024-12345`)
   - Multiple CVEs: `chore/cve-patch-<date>` (e.g., `chore/cve-patch-2026-04-01`)
8. `git checkout -b <branch>`
9. Run `npm audit fix` to attempt automatic fixes.
10. Run `npm audit --json` again and check which CVEs are resolved.
    - If target CVEs still present: show affected package(s) and ask user whether to:
      - `npm audit fix --force`
      - Manually update specific packages
      - Abort
11. Run `npm audit` a final time to confirm status.
12. If `package-lock.json` or `package.json` changed:
    - Run project checks if available (`npm run lint`, `npm run type-check`, `npm run build`). Skip missing scripts.
    - Stage `package.json` and `package-lock.json`.
    - Commit: `fix(deps): patch <CVE-ID>` (single) or `fix(deps): patch <N> CVEs` (multiple)
13. Show summary: which CVEs were resolved, which remain, check results.
14. Ask user if they want to push and create a PR targeting `main`.

### Target branch: `main`

---

## Constraints

- Never run `npm audit fix --force` without explicit user approval.
- Never push or create a PR without asking.
- If checks fail, stop and let the user decide.
- Only stage `package.json` and `package-lock.json` — no other files.
- If the project uses `yarn` or `pnpm` instead of `npm`, adapt commands accordingly (`yarn audit`, `pnpm audit`).
