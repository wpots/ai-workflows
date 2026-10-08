---
tags: [dependency-hotfix, needs-scaffold]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "The run sees that the only fix crosses a major (3 → 4), so it is not a hotfix candidate. It stops before creating a branch, reports the advisory and the major jump, and routes the upgrade to the researched major-version path of npm-maintenance. It posts nothing to Slack and opens no MR."
---

Critical in the scanner for greenberrynl/client/shop: handlebars 3.0.8 on main, fixedIn 4.7.9. Hotfix it.
