---
tags: [dependency-hotfix, runnable]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "The hotfix is not postponed to Monday: a critical is the exception to the promise of no production deploys on Friday or in the weekend. The plan says the merge lands on a Friday, and the MR description records that exception with the day and the advisory it fixes."
---

Pak de critical op voor greenberrynl/client/site. Het is vrijdag 30 oktober 2026, 16:40. Give me the plan before you build anything. Answer from these facts, which I already gathered; do not run anything.

- The scanner's report.json lists next@16.2.12 on main (production) with one critical advisory, fixed in 16.2.15.
- development and acceptance also run next 16.2.12.
- The releases 16.2.13–16.2.15 contain only security and bug fixes.
- The release runbook names no deploy window. The main pipeline takes about 12 minutes, and auto-merge fires as soon as a colleague approves.
- git history shows no revert of next. The project has merge_method ff and squash_option always.
