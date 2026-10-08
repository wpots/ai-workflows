---
tags: [compact-sprint, runnable]
max_turns: 6
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "The run does not refuse sprint 15 on the retention guard: its close is pushed and no planning follows. It reports the links into the folder from living docs (the 11 ADRs, the architecture doc, the transition register, the open backlog items), explains that compacting turns each of them into a retrieval recipe, and recommends waiting until the migration they document is live. It leaves the decision to the user and does not start compacting."
---

Sprint 15 was closed two days ago: its changelog is on origin/development and its gaps document is gone. There is no sprint 16 and no planning will follow. `docs/sprint-15/` holds 55 delivered items, and 40 living docs link into it: all 11 ADRs, `docs/architecture.md` (9 links), the cross-sprint transition register (8) and five open backlog items. The catalogue migration those items document goes live on production in a few months. Can we compact sprint 15 now?
