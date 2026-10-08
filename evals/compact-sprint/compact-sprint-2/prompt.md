---
tags: [compact-sprint, runnable]
max_turns: 6
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "The run refuses sprint 16: its close is not pushed, because the changelog is not on the integration branch's remote. It says what makes the sprint eligible: commit and push the close, then wait until sprint 17's planning has read the gaps document. It does not compact."
---

Sprint 16 ended today. I wrote `docs/sprint-16-changelog.md` and `docs/sprint-16-gaps.md` locally but have not committed or pushed them; `docs/sprint-16/` holds the moved items. Sprint 17 starts tomorrow with a planning session. Compact sprint 16 now, so the repo is clean before sprint 17.
