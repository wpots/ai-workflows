---
tags: [close-sprint, runnable]
max_turns: 6
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "The run gives a Phase 1 JQL that windows on statusCategoryChangedDate with statusCategory = Done, not on resolved, and a Phase 2 git command that matches RFW-29 without matching RFW-291 and does not use \\b as the word boundary."
---

We close support month 2026-09 on a project without sprints: Jira key RFW, I work on macOS. Before you start, tell me the exact JQL you run in Phase 1 to fetch the month's tickets on my name, and the exact git command you run in Phase 2 to find the commits that belong to RFW-29.
