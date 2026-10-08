---
tags: [close-sprint, needs-scaffold]
max_turns: 10
allowed_tools: [Read, Glob, Grep, Skill]
expected_outcome: "Before the first move the run snapshots the tree. After the moves it lists the relative links whose target is missing now but resolved in the snapshot, and fixes them: the ADR link becomes `../sprint-19/RFW-131-feat-a.md`, the moved item's sibling link becomes `../backlog/RFW-140-feat-b.md`, and the staying item's link becomes `../sprint-19/RFW-131-feat-a.md`. It removes RFW-131's row from the backlog index. It leaves the test file alone and lists it under Actions in the gaps document for its own MR. It does not touch the link in `docs/todo/old.md`, which was broken before the close."
---

Close sprint 19. (Context the agent can discover: 30 delivered BLIs move to `docs/sprint-19/`; `docs/adr/0004-x.md` links `../backlog/RFW-131-feat-a.md`, which moves; the moved `RFW-131-feat-a.md` links its sibling `RFW-140-feat-b.md`, which stays in `docs/backlog/` as spillover; the staying `RFW-140-feat-b.md` links `RFW-131-feat-a.md`; `docs/backlog/README.md` lists both; a test file comment names `docs/backlog/RFW-131-feat-a.md`; `docs/todo/old.md` links a source file that was renamed two sprints ago.)
