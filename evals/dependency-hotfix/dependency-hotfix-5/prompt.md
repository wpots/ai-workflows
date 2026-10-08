---
tags: [dependency-hotfix, runnable]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "The run analyses both candidate ranges: 16.2.12 → 16.2.15 (patch, nothing exposed, Low) and 16.2.12 → 16.3.6 (crosses a minor; the <Link> prefetch change is used in 41 places and sits on the Vercel cost surface, so High). Because development's version is on a later minor and that extra range is High, it picks the lowest fix, 16.2.15, rather than development's 16.3.6, and states why: CI on development proves the build, not the request behaviour. The plan has a Risk line, the MR description carries the risk block, and the back-merge keeps development's higher next version. The hotfix is not held back for a measurement."
---

Pak de critical op voor greenberrynl/client/site. Before you build anything, give me the target version and the Risk and Back-merge lines of the plan. Answer from these facts, which I already gathered; do not run anything.

- The scanner's report.json lists next@16.2.12 on main (production) with two critical advisories, both fixed in 16.2.15.
- development already runs next 16.3.6.
- The 16.3.0 release notes change how `<Link>` prefetches when the `prefetch` prop is left unset. The project renders `<Link>` without a `prefetch` prop in 41 places. The releases 16.2.13–16.2.15 contain only security and bug fixes, none touching `<Link>`.
- CONVENTIONS.md `## Hosting`: Vercel; cost-sensitive metrics Function Invocations and Edge Requests.
- git history shows no revert of next. The project has merge_method ff and squash_option always.
