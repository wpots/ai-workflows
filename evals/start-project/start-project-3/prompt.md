---
tags: [start-project, runnable]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "Lane 0 stops the kickoff: a production repo made with `glab repo create` in a personal namespace, holding the template's files as one fresh commit, was not created the Greenberry way. The response says it must come from GitLab's Create from template flow into the client group (creating that group first if it does not exist), hands that UI flow to the user with the Notion link, does not offer the PoC waiver because the project goes to production, and does not propose a CLI command to create the production repository."
---

We're kicking off the website for a new client, Bakkerij Jansen; it goes to production in March. To save time I already ran `glab repo create bakkerij-jansen-website` in my own GitLab namespace and pushed the files of unicore-template into it as one initial commit. Is that repository fine to build on, or what has to happen first?
