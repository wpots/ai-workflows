---
tags: [start-project, routing, runnable]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "Routing, should not fire: adding tooling to an existing project is not a project kickoff, so the run never invokes start-project despite the words 'set up' and 'project'."
---

Set up ESLint and Prettier in this project.
