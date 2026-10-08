---
tags: [npm-maintenance, runnable]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "The run writes the risk-analysis block per references/risk-analysis.md. next 16.3.4 → 16.4.0 crosses a minor; the block names the <Link> prefetch change from the 16.4.0 release notes, ties it to the project's 41 unset-prefetch <Link> usages with the file:line example, names Vercel Function Invocations and Edge Requests against the ~$7/day baseline from CONVENTIONS.md, flags 16.4.0 as one day old, and rates next High. zod gets a single Low table row without further detail. Because of the High verdict, the MR opens as Draft with the request-volume measurement listed as required before it leaves Draft, plus the metric to watch after deploy and the rollback. Passing lint, tests and build is not presented as making the bump safe."
---

Routine maintenance on development: I bumped the outdated minors and patches, and lint, tests and the production build pass. Write the risk-analysis section for the MR description, and tell me whether the MR should open as ready or as Draft. Answer from these facts, which I already gathered; do not run anything.

- next: development and production both run 16.3.4; the bump goes to 16.4.0, published on npm one day ago. The v16.4.0 release notes change how `<Link>` prefetches when the `prefetch` prop is left unset. The project renders `<Link>` without a `prefetch` prop in 41 places, for example `src/components/Nav.tsx:12`.
- zod: 4.1.11 → 4.1.12, published three weeks ago. Its release notes contain one type-inference fix; nothing about runtime behaviour.
- CONVENTIONS.md `## Hosting`: Vercel; cost-sensitive metrics Function Invocations and Edge Requests; baseline ~$7/day.
- git history shows no earlier bump or revert of either package.
