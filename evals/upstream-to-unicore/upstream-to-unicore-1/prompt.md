---
tags: [upstream-to-unicore, needs-scaffold]
max_turns: 15
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "In Step 2 the run sees that the page-tree route fixes only exist because the project runs with `cacheComponents: true` and the Payload API on `/admin/api`, which the template does not have. It does not mark them drop as project-specific: it asks whether those are the team's direction, and offers to upstream them together with the missing config. It opens no MR before the user answers."
---

Moeten de page-tree-fixes uit dit project niet allemaal upstream naar de unicore-template? (Context the agent can discover: the project's page-tree route switched from `request.headers` to `await headers()` and added `unstable_rethrow` in its `catch`, both after the project set `cacheComponents: true` in `next.config.ts`; its Payload config sets `routes.api: "/admin/api"` and the page tree's client URLs follow it. The template's `development` has neither `cacheComponents` nor a custom `routes.api`.)
