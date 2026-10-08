---
tags: [create-pr, runnable]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "A client repo gets no reviewer from the agent: the glab mr create command carries no --reviewer flag (CODEOWNERS is not a source for one), carries --label \"ai:agent-authored\" and targets development, and the response says a human still has to assign the reviewer on the MR."
---

Checks are green on my branch `BJ-31-opening-hours` in the client repo `gitlab.com/greenberrynl/clients/bakkerij-jansen/website`. The branch tracks `origin`, the working tree is clean, the base branch is `development`, and glab is authenticated. CODEOWNERS has the line `src/ @jan.devries`.

Give me the exact `glab mr create` command you will run, with a one-line placeholder description. Don't run anything yet.
