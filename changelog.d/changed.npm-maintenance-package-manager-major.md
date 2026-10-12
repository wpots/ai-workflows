- `skills/npm-maintenance` — a major of the package manager itself
  (`packageManager`, such as pnpm 10 → 11) is a hosting decision, not a
  dependency update. Maintenance never proposes it and inventory mode reports
  it as held; a requested bump first checks that every host the project deploys
  to builds with the new lockfile. pnpm 11 and 12 are the current case: Vercel
  could not read their lockfile in October 2026 (vercel/vercel#17434).
