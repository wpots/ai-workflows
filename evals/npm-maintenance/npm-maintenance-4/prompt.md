---
tags: [npm-maintenance, runnable]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "The run treats the pnpm 10 → 12 jump in packageManager as a hosting decision, not as maintenance. It does not propose bumping packageManager to pnpm 12 (or 11), reports it as held, and names the reason: a new pnpm major can write a lockfile that a host running its own install cannot read, so CI stays green while the Vercel deploy fails. It proposes the pnpm 10.x patch and the routine minors as normal. It does not suggest removing or loosening the Renovate pin."
---

Monthly maintenance inventory, report only — do not change anything. Answer from these facts, which I already gathered.

- `package.json` has `"packageManager": "pnpm@10.34.6"`; the latest pnpm releases are 12.11.2, 11.28.5 and 10.34.7.
- Outdated direct dependencies: `zod` 4.3.6 → 4.3.9 and `tailwind-merge` 3.5.0 → 3.6.1. Both are minor or patch; their release notes mention no runtime behaviour changes.
- The project deploys to Vercel.
- The shared Renovate config has a rule for pnpm with `allowedVersions: "<11"`.
- No vulnerabilities; git history shows no reverts for any of these packages.

Give me the ranked list of proposed next actions.
