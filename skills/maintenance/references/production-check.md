# Is a critical on production?

The sweep audits the local checkout, usually development; the dependency
scanner and `dependency-hotfix` work from production. Run this read-only check
for every critical lane A lists.

## Check

1. Production branch: `main`, or `master` when there is no `main`.
   `git fetch origin <branch>`, then `git show origin/<branch>:<lockfile>` into
   the scratchpad.
2. Versions it resolves: `package-lock.json` →
   `packages["node_modules/<name>"].version`, plus every nested
   `node_modules/**/node_modules/<name>` entry; `pnpm-lock.yaml` → the
   `<name>@<version>` keys under `packages:`.
3. Vulnerable range from the audit the inventory already ran: `npm audit
   --json` → `vulnerabilities.<name>.range`; pnpm →
   `advisories.*.vulnerable_versions`. Test each version with
   `npx --yes semver -r "<range>" <version>`: it prints the version when it is
   inside the range, nothing when it is not.

## Label and route

- **on production**: a resolved version is inside the range. Lane A is
  `urgent`, the fix names `/greenberry:dependency-hotfix` with the package and
  the advisory, the critical stays off the proposed backlog list, and the
  verdicts end with the `Next step:` line from
  [report-format.md](report-format.md) §1.
- **development only**: none is. The fix names `skills/npm-maintenance`, and
  the backlog threshold applies as for any finding.
- **production not checked**: the branch or its lockfile could not be read; say
  why. Handled as on production: a check that did not run never downgrades a
  critical.

The sweep proposes the hotfix and never starts it. Once the user starts
`skills/dependency-hotfix/SKILL.md`, it goes ahead of every other fix, and its
Step 3 plan is the approval: the sweep adds none of its own.
