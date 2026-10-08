---
tags: [close-sprint, needs-scaffold]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "The run stays in the user's checkout on the integration branch, because the user edits the changelog, gaps document and moved BLIs there during the review. It names the two dirty files, says the staged drawio sits in the sprint folder the close will clear out, and asks how to handle it before going on. It does not create a worktree or enter one, and it does not read the worktree memory as applying to a close."
---

Close sprint 18. (Context the agent can discover: the session is interactive and can write to the checkout; `git status` shows a staged edit to `docs/sprint18/architecture.drawio` and an unstaged `next-env.d.ts`; a project memory says 'several sessions share this checkout — commit from a worktree, never from the main checkout'.)
